#!/usr/bin/env node
'use strict';

// Importa a planilha de repasses (uma aba por ano) para o PostgreSQL.
// Uso: node scripts/importar-planilha.js <caminho-para-planilha.xlsx>
//
// Fluxo (RF09/RF10/RNF11):
//   1) validar todas as linhas antes de tocar no banco
//   2) INSERT em importacao (fora de transação, para persistir mesmo se a carga falhar)
//   3) BEGIN; carregar stg_repasse em lote; SELECT fn_carregar_importacao(id); COMMIT
//   4) em erro: ROLLBACK e marcar a importacao como "falhou"

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('xlsx');
const { Client } = require('pg');

const COLUNAS_STG = [
    'importacao_id', 'ano', 'municipio_nome', 'potencial', 'contribuintes', 'destinacao_pf', 'qtde_pf',
    'eca_valor', 'eca_qtde', 'idoso_valor', 'idoso_qtde',
    'darf_eca_valor', 'darf_eca_qtde', 'darf_idoso_valor', 'darf_idoso_qtde',
];

function normalizarNome(nome) {
    return String(nome).trim().replace(/\s+/g, ' ').toUpperCase();
}

function extrairAno(nomeAba) {
    const m = /(\d{4})\s*$/.exec(String(nomeAba).trim());
    return m ? Number(m[1]) : null;
}

function numero(valor) {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string' && valor.trim() !== '') {
        const n = Number(valor.trim().replace(',', '.'));
        if (!Number.isNaN(n)) return n;
    }
    return NaN;
}

// Mapeamento por posição da coluna (a planilha não tem nomes de coluna estáveis entre anos):
//   0 UF, 1 Município, 2 potencial, 3 contribuintes, 4 destinacao_pf, 5 qtde_pf,
//   6/7 totais de fundos (não armazenados), 8 eca_valor, 9 eca_qtde, 10 idoso_valor, 11 idoso_qtde,
//   12/13 totais de DARF (não armazenados), 14 darf_eca_valor, 15 darf_eca_qtde, 16 darf_idoso_valor, 17 darf_idoso_qtde
function lerPlanilha(caminho) {
    const wb = xlsx.readFile(caminho);
    const linhas = [];
    const erros = [];

    for (const nomeAba of wb.SheetNames) {
        const ano = extrairAno(nomeAba);
        if (ano === null) continue; // aba fora do padrão "...AAAA" é ignorada
        if (ano < 2000 || ano > 2100) {
            erros.push(`Aba "${nomeAba}": ano ${ano} fora do intervalo permitido (2000-2100)`);
            continue;
        }

        const sheet = wb.Sheets[nomeAba];
        const todasLinhas = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
        const dados = todasLinhas.slice(1); // descarta o cabeçalho

        dados.forEach((row, idx) => {
            const numeroLinha = idx + 2; // +1 pelo cabeçalho, +1 por ser 1-based
            if (!row || row.every((c) => c === undefined || c === '')) return;

            const municipioNome = row[1] !== undefined ? String(row[1]).trim() : '';
            const campos = {
                potencial: numero(row[2]),
                contribuintes: numero(row[3]),
                destinacao_pf: numero(row[4]),
                qtde_pf: numero(row[5]),
                eca_valor: numero(row[8]),
                eca_qtde: numero(row[9]),
                idoso_valor: numero(row[10]),
                idoso_qtde: numero(row[11]),
                darf_eca_valor: numero(row[14]),
                darf_eca_qtde: numero(row[15]),
                darf_idoso_valor: numero(row[16]),
                darf_idoso_qtde: numero(row[17]),
            };

            const prefixo = `Aba "${nomeAba}", linha ${numeroLinha}`;
            if (!municipioNome) {
                erros.push(`${prefixo}: nome do município ausente`);
                return;
            }
            for (const [campo, valor] of Object.entries(campos)) {
                if (Number.isNaN(valor)) {
                    erros.push(`${prefixo} (${municipioNome}): campo "${campo}" não é um número válido`);
                } else if (valor < 0) {
                    erros.push(`${prefixo} (${municipioNome}): campo "${campo}" é negativo (${valor})`);
                }
            }

            linhas.push({ ano, municipio_nome: normalizarNome(municipioNome), ...campos });
        });
    }

    return { linhas, erros };
}

async function importar(caminhoArquivo) {
    const caminhoAbsoluto = path.resolve(caminhoArquivo);
    const buffer = fs.readFileSync(caminhoAbsoluto);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    const { linhas, erros } = lerPlanilha(caminhoAbsoluto);

    if (erros.length > 0) {
        console.error(`Validação falhou com ${erros.length} erro(s). Nenhum dado foi gravado no banco.`);
        erros.forEach((e) => console.error(` - ${e}`));
        process.exitCode = 1;
        return;
    }

    const anos = [...new Set(linhas.map((l) => l.ano))].sort();
    console.log(`Planilha validada: ${linhas.length} linha(s) nos anos [${anos.join(', ')}].`);

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const existente = await client.query(
            'SELECT id, importado_em, status FROM importacao WHERE arquivo_hash = $1 ORDER BY importado_em DESC LIMIT 1',
            [hash]
        );
        if (existente.rows.length > 0) {
            const anterior = existente.rows[0];
            console.warn(
                `Atenção: este arquivo já foi importado antes (importação #${anterior.id}, em ${anterior.importado_em}, status "${anterior.status}"). Continuando mesmo assim.`
            );
        }

        const insertImportacao = await client.query(
            'INSERT INTO importacao (arquivo_nome, arquivo_hash) VALUES ($1, $2) RETURNING id',
            [path.basename(caminhoAbsoluto), hash]
        );
        const importacaoId = insertImportacao.rows[0].id;

        try {
            await client.query('BEGIN');

            const valores = [];
            const grupos = linhas.map((l, i) => {
                const base = i * COLUNAS_STG.length;
                valores.push(
                    importacaoId, l.ano, l.municipio_nome, l.potencial, l.contribuintes, l.destinacao_pf, l.qtde_pf,
                    l.eca_valor, l.eca_qtde, l.idoso_valor, l.idoso_qtde,
                    l.darf_eca_valor, l.darf_eca_qtde, l.darf_idoso_valor, l.darf_idoso_qtde
                );
                const placeholders = COLUNAS_STG.map((_, j) => `$${base + j + 1}`).join(', ');
                return `(${placeholders})`;
            });

            await client.query(
                `INSERT INTO stg_repasse (${COLUNAS_STG.join(', ')}) VALUES ${grupos.join(', ')}`,
                valores
            );

            const resultado = await client.query('SELECT * FROM fn_carregar_importacao($1)', [importacaoId]);
            await client.query('COMMIT');

            const r = resultado.rows[0];
            console.log(
                `Importação #${importacaoId} concluída: ${r.linhas_lidas} lidas, ${r.inseridos} inseridos, ${r.atualizados} atualizados, ${r.ignorados} ignorados.`
            );
        } catch (erroCarga) {
            await client.query('ROLLBACK');
            await client.query('UPDATE importacao SET status = $1, erro = $2 WHERE id = $3', [
                'falhou',
                erroCarga.message,
                importacaoId,
            ]);
            throw erroCarga;
        }
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    const caminho = process.argv[2];
    if (!caminho) {
        console.error('Uso: node scripts/importar-planilha.js <caminho-para-planilha.xlsx>');
        process.exit(1);
    }
    importar(caminho).catch((erro) => {
        console.error('Falha na importação:', erro.message);
        process.exit(1);
    });
}

module.exports = { lerPlanilha, normalizarNome, extrairAno };
