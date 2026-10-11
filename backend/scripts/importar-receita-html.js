#!/usr/bin/env node
'use strict';

// Fonte publica oficial: tabela dos municipios do Parana por endereco do fundo.
// Uso: node scripts/importar-receita-html.js [--arquivo pagina.html]
// Para atualizar outro ano: --ano 2026 (apos conferir o mesmo formato da tabela).
// Valida todos os registros antes de iniciar a transacao no PostgreSQL.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { Client } = require('pg');
const { extrairReceitaHTML, htmlDeBuffer, nomeNormalizado, validarAnoPublicado } = require('./receitaParser');

const anoPos = process.argv.indexOf('--ano');
const ano = anoPos >= 0 ? Number(process.argv[anoPos + 1]) : 2025;
if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    console.error('Ano invalido. Exemplo: --ano 2025');
    process.exit(1);
}
const arquivoPos = process.argv.indexOf('--arquivo');
const arquivo = arquivoPos >= 0 ? process.argv[arquivoPos + 1] : null;
if (arquivoPos >= 0 && !arquivo) {
    console.error('Informe o caminho apos --arquivo');
    process.exit(1);
}
const fonteUrl = `https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_${ano}.HTML`;
class AnoAindaNaoPublicado extends Error {
    constructor(ano) {
        super(`Relatorio oficial de ${ano} ainda nao publicado (HTTP 404/410).`);
        this.name = 'AnoAindaNaoPublicado';
    }
}
const CAMPOS = ['potencial', 'contribuintes', 'destinacao_pf', 'qtde_pf', 'valor_total',
    'doacoes_total', 'percentual_fdca', 'percentual_fdi', 'valor_darf', 'qtde_darf'];

async function obterHTML() {
    if (arquivo) return fs.readFileSync(arquivo);
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), 30000);
    try {
        const resposta = await fetch(fonteUrl, {
            signal: controlador.signal,
            headers: { 'User-Agent': 'IRSocial/1.0 (projeto academico; consulta a dados publicos)' },
        });
        if (resposta.status === 404 || resposta.status === 410) throw new AnoAindaNaoPublicado(ano);
        if (!resposta.ok) throw new Error(`Receita Federal respondeu HTTP ${resposta.status}`);
        const tipo = resposta.headers.get('content-type') || '';
        if (tipo && !tipo.includes('html') && !tipo.includes('text/plain')) {
            throw new Error(`Conteudo inesperado da Receita: ${tipo}`);
        }
        return Buffer.from(await resposta.arrayBuffer());
    } finally {
        clearTimeout(timeout);
    }
}

async function importar() {
    const buffer = await obterHTML();
    const html = htmlDeBuffer(buffer);
    validarAnoPublicado(html, ano);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const { municipios, total, estadual } = extrairReceitaHTML(html);
    console.log(`Receita Federal ${ano}: ${municipios.length} municipios validados, linha ESTADUAL: ${estadual ? 'sim' : 'nao'}; total R$ ${total.valor_total.toFixed(2)}.`);

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    let importacaoId;
    try {
        // Evita auditorias e gravacoes repetidas quando o HTML oficial nao mudou.
        // Uma importacao incompleta nao deve ser considerada atualizada.
        const anterior = await client.query(`
            SELECT i.arquivo_hash, i.status,
                (SELECT count(*)::int FROM estatistica_receita_municipio_ano WHERE ano = $1) AS municipios
            FROM estatistica_receita_estado_ano e
            JOIN importacao i ON i.id = e.importacao_id
            WHERE e.ano = $1`, [ano]);
        if (anterior.rowCount && anterior.rows[0].status === 'concluida' &&
            anterior.rows[0].arquivo_hash.trim() === hash &&
            Number(anterior.rows[0].municipios) === municipios.length) {
            console.log(`Receita Federal ${ano}: arquivo oficial inalterado; importacao dispensada.`);
            return;
        }
        // Usa a trilha de auditoria existente sem modificar as tabelas antigas.
        const criada = await client.query(
            'INSERT INTO importacao (arquivo_nome, arquivo_hash) VALUES ($1, $2) RETURNING id',
            [`Receita Federal - PR ${ano} - ${arquivo || fonteUrl}`, hash]);
        importacaoId = criada.rows[0].id;
        await client.query('BEGIN');
        const m = await client.query('SELECT id, nome FROM municipio WHERE uf = $1 AND NOT eh_estadual', ['PR']);
        const ids = new Map();
        for (const municipio of m.rows) {
            const chave = nomeNormalizado(municipio.nome);
            if (ids.has(chave)) {
                throw new Error(`Municipios ja duplicados no banco apos normalizacao: ${chave}`);
            }
            ids.set(chave, municipio.id);
        }
        let inseridos = 0;
        let atualizados = 0;
        let ignorados = 0;
        for (const r of municipios) {
            let municipioId = ids.get(r.nome);
            if (!municipioId) {
                const criado = await client.query(
                    'INSERT INTO municipio (nome, uf) VALUES ($1, $2) RETURNING id', [r.nome, 'PR']);
                municipioId = criado.rows[0].id;
                ids.set(r.nome, municipioId);
            }
            const valores = CAMPOS.map((c) => r[c]);
            const placeholders = CAMPOS.map((_, i) => `$${i + 3}`).join(', ');
            const modificacoes = CAMPOS.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
            const atuais = CAMPOS.map((c) => `alvo.${c}`).join(', ');
            const novos = CAMPOS.map((c) => `EXCLUDED.${c}`).join(', ');
            const resposta = await client.query(`
                INSERT INTO estatistica_receita_municipio_ano AS alvo
                    (municipio_id, ano, ${CAMPOS.join(', ')}, fonte_url, importacao_id)
                VALUES ($1, $2, ${placeholders}, $${CAMPOS.length + 3}, $${CAMPOS.length + 4})
                ON CONFLICT (municipio_id, ano) DO UPDATE
                SET ${modificacoes}, fonte_url = EXCLUDED.fonte_url,
                    importacao_id = EXCLUDED.importacao_id, atualizado_em = now()
                WHERE (${atuais}, alvo.fonte_url)
                    IS DISTINCT FROM (${novos}, EXCLUDED.fonte_url)
                RETURNING (xmax = 0) AS inserido`,
            [municipioId, ano, ...valores, fonteUrl, importacaoId]);
            if (!resposta.rowCount) ignorados++;
            else if (resposta.rows[0].inserido) inseridos++;
            else atualizados++;
        }
        const camposEstado = [...CAMPOS, 'estadual_valor', 'estadual_doacoes'];
        const dadosEstado = { ...total, estadual_valor: estadual?.valor_total ?? 0,
            estadual_doacoes: estadual?.doacoes_total ?? 0 };
        const valoresEstado = camposEstado.map((c) => dadosEstado[c]);
        await client.query(`
            INSERT INTO estatistica_receita_estado_ano AS alvo
                (ano, ${camposEstado.join(', ')}, fonte_url, importacao_id)
            VALUES ($1, ${camposEstado.map((_, i) => `$${i + 2}`).join(', ')}, $${camposEstado.length + 2}, $${camposEstado.length + 3})
            ON CONFLICT (ano) DO UPDATE
            SET ${camposEstado.map((c) => `${c} = EXCLUDED.${c}`).join(', ')},
                fonte_url = EXCLUDED.fonte_url, importacao_id = EXCLUDED.importacao_id,
                atualizado_em = now()`, [ano, ...valoresEstado, fonteUrl, importacaoId]);
        await client.query(`UPDATE importacao
            SET status = 'concluida', linhas_lidas = $1, registros_inseridos = $2,
                registros_atualizados = $3, registros_ignorados = $4 WHERE id = $5`,
        [municipios.length, inseridos, atualizados, ignorados, importacaoId]);
        await client.query('COMMIT');
        console.log(`Importacao #${importacaoId}: ${inseridos} inseridos, ${atualizados} atualizados, ${ignorados} identicos.`);
    } catch (erro) {
        await client.query('ROLLBACK').catch(() => {});
        if (importacaoId) {
            await client.query('UPDATE importacao SET status = $1, erro = $2 WHERE id = $3',
                ['falhou', erro.message, importacaoId]).catch(() => {});
        }
        throw erro;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    importar().catch((erro) => {
        if (erro instanceof AnoAindaNaoPublicado) {
            console.log(`[Receita] ${erro.message}`);
            process.exitCode = 3; // O sincronizador tentara novamente em outro ciclo.
        } else {
            console.error('Falha na importacao da Receita Federal:', erro.message);
            process.exitCode = 1;
        }
    });
}

module.exports = { importar, AnoAindaNaoPublicado };
