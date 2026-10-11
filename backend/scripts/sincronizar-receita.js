#!/usr/bin/env node
'use strict';

// Sincroniza historico e novas publicacoes da Receita Federal para o Parana.
// Executa uma checagem imediata e repete a cada intervalo configurado, sem
// depender de reiniciar o Docker ou de alterar tabelas existentes.
const { spawn } = require('node:child_process');
const path = require('node:path');
const { setTimeout: aguardar } = require('node:timers/promises');

function numeroInteiro(valor, nome, minimo, maximo) {
    if (!/^\d+$/.test(String(valor ?? '')) || Number(valor) < minimo || Number(valor) > maximo) {
        throw new Error(`${nome} deve ser um numero inteiro entre ${minimo} e ${maximo}.`);
    }
    return Number(valor);
}

function anoAtualBrasilia(data = new Date()) {
    return Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(data));
}

function anosParaVerificar({ inicio, atual, revisar, importados }) {
    const recentesDesde = atual - revisar + 1;
    const anos = [];
    for (let ano = inicio; ano <= atual; ano++) {
        // Anos historicos completos sao importados uma vez; os mais recentes
        // sao revisitados para acompanhar revisoes da publicacao oficial.
        if (!importados.has(ano) || ano >= recentesDesde) anos.push(ano);
    }
    return anos;
}

async function lerAnosImportados(criarCliente = () => new (require('pg').Client)({ connectionString: process.env.DATABASE_URL })) {
    const client = criarCliente();
    await client.connect();
    try {
        const resultado = await client.query(`SELECT e.ano FROM estatistica_receita_estado_ano e
            JOIN importacao i ON i.id = e.importacao_id
            WHERE i.status = 'concluida'
              AND (SELECT count(*) FROM estatistica_receita_municipio_ano m WHERE m.ano = e.ano) = 399`);
        return new Set(resultado.rows.map((r) => Number(r.ano)));
    } finally {
        await client.end();
    }
}

function importarAnoPeloScript(ano, { signal } = {}) {
    return new Promise((resolve, reject) => {
        const filho = spawn(process.execPath, ['scripts/importar-receita-html.js', '--ano', String(ano)], {
            cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit',
        });
        const cancelar = () => filho.kill('SIGTERM');
        if (signal?.aborted) cancelar();
        signal?.addEventListener('abort', cancelar, { once: true });
        filho.once('error', (erro) => {
            signal?.removeEventListener('abort', cancelar);
            reject(erro);
        });
        filho.once('exit', (codigo, sinal) => {
            signal?.removeEventListener('abort', cancelar);
            if (codigo === 0) resolve('verificado');
            else if (codigo === 3) resolve('nao-publicado');
            else reject(new Error(`Importacao de ${ano} terminou com ${sinal || `codigo ${codigo}`}`));
        });
    });
}

async function sincronizarUmaVez({
    inicio = numeroInteiro(process.env.RECEITA_ANO_INICIAL ?? 2021, 'RECEITA_ANO_INICIAL', 2000, 2100),
    revisar = numeroInteiro(process.env.RECEITA_REVISAR_ANOS ?? 2, 'RECEITA_REVISAR_ANOS', 1, 20),
    atual = anoAtualBrasilia(),
    consultarAnos = lerAnosImportados,
    importarAno = importarAnoPeloScript,
    signal,
} = {}) {
    const importados = await consultarAnos();
    const anos = anosParaVerificar({ inicio, atual, revisar, importados });
    console.log(`[Receita] Anos no banco: ${[...importados].sort().join(', ') || 'nenhum'}. Verificacao prevista: ${anos.join(', ') || 'nenhuma'}.`);
    const resultado = { verificados: [], naoPublicados: [], falhas: [] };
    for (const ano of anos) {
        if (signal?.aborted) break;
        try {
            const status = await importarAno(ano, { signal });
            if (status === 'nao-publicado') {
                console.log(`[Receita] Relatorio de ${ano} ainda nao publicado. Nova tentativa no proximo ciclo.`);
                resultado.naoPublicados.push(ano);
            } else {
                resultado.verificados.push(ano);
            }
        } catch (erro) {
            if (signal?.aborted) break;
            console.warn(`[Receita] Falha ao verificar ${ano}: ${erro.message}. Outros anos serao processados.`);
            resultado.falhas.push(ano);
        }
    }
    return resultado;
}

async function iniciarSincronizacao() {
    if (process.env.RECEITA_AUTO_IMPORTAR === 'false') {
        console.log('[Receita] Sincronizacao desativada: RECEITA_AUTO_IMPORTAR=false.');
        return;
    }
    const inicio = numeroInteiro(process.env.RECEITA_ANO_INICIAL ?? 2021, 'RECEITA_ANO_INICIAL', 2000, 2100);
    const revisar = numeroInteiro(process.env.RECEITA_REVISAR_ANOS ?? 2, 'RECEITA_REVISAR_ANOS', 1, 20);
    const intervalo = numeroInteiro(process.env.RECEITA_INTERVALO_HORAS ?? 24, 'RECEITA_INTERVALO_HORAS', 1, 720);
    const controlador = new AbortController();
    process.once('SIGTERM', () => controlador.abort());
    process.once('SIGINT', () => controlador.abort());
    console.log(`[Receita] Sincronizador iniciado. Desde ${inicio}, revisao dos ${revisar} anos recentes, a cada ${intervalo}h.`);
    while (!controlador.signal.aborted) {
        try {
            await sincronizarUmaVez({ inicio, revisar, signal: controlador.signal });
        } catch (erro) {
            if (!controlador.signal.aborted) console.error(`[Receita] Falha geral no ciclo: ${erro.message}`);
        }
        if (controlador.signal.aborted) break;
        try {
            await aguardar(intervalo * 60 * 60 * 1000, undefined, { signal: controlador.signal });
        } catch (erro) {
            if (erro.name !== 'AbortError') throw erro;
        }
    }
    console.log('[Receita] Sincronizador encerrado.');
}

if (require.main === module) {
    iniciarSincronizacao().catch((erro) => {
        console.error('[Receita] Erro fatal:', erro.message);
        process.exitCode = 1;
    });
}

module.exports = {
    numeroInteiro, anoAtualBrasilia, anosParaVerificar, lerAnosImportados,
    importarAnoPeloScript, sincronizarUmaVez, iniciarSincronizacao,
};
