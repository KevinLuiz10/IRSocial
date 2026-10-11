#!/usr/bin/env node
'use strict';

// Inicializa o banco e confere a fonte oficial ANTES de iniciar o Express.
// Nunca apaga dados existentes. Em falha na Receita, mantém os registros
// existentes; em uma instalação vazia, indica a falha e permite nova tentativa.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const PASTA_MIGRACOES = path.resolve(__dirname, '../../db/migrations');

function validarAno(valor) {
    if (!/^\d{4}$/.test(String(valor)) || Number(valor) < 2000 || Number(valor) > 2100) {
        throw new Error('RECEITA_ANO invalido. Informe um ano com quatro digitos, ex.: 2025.');
    }
    return Number(valor);
}

async function aplicarMigracoes(client, pasta = PASTA_MIGRACOES) {
    const arquivos = fs.readdirSync(pasta).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
    if (!arquivos.length) throw new Error(`Nenhuma migracao encontrada em ${pasta}`);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
        nome text PRIMARY KEY,
        hash_sha256 char(64) NOT NULL,
        aplicada_em timestamptz NOT NULL DEFAULT now()
    )`);
    for (const nome of arquivos) {
        const sql = fs.readFileSync(path.join(pasta, nome), 'utf8');
        const hash = crypto.createHash('sha256').update(sql).digest('hex');
        const registro = await client.query('SELECT hash_sha256 FROM schema_migrations WHERE nome = $1', [nome]);
        if (registro.rowCount) {
            if (registro.rows[0].hash_sha256.trim() !== hash) {
                throw new Error(`Migracao ${nome} foi alterada apos aplicada. Crie nova migracao em vez de editar a antiga.`);
            }
            console.log(`[Banco] Migracao ja aplicada: ${nome}`);
            continue;
        }
        await client.query('BEGIN');
        try {
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (nome, hash_sha256) VALUES ($1, $2)', [nome, hash]);
            await client.query('COMMIT');
            console.log(`[Banco] Migracao aplicada: ${nome}`);
        } catch (erro) {
            await client.query('ROLLBACK');
            throw new Error(`Erro na migracao ${nome}: ${erro.message}`);
        }
    }
}

function executarImportador(ano) {
    return new Promise((resolve, reject) => {
        const filho = spawn(process.execPath, ['scripts/importar-receita-html.js', '--ano', String(ano)],
            { cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit' });
        filho.on('error', reject);
        filho.on('exit', (codigo, sinal) => {
            if (codigo === 0) resolve();
            else reject(new Error(`Importador terminou com ${sinal ? `sinal ${sinal}` : `codigo ${codigo}`}`));
        });
    });
}

async function prepararAmbiente({
    criarCliente = () => new (require('pg').Client)({ connectionString: process.env.DATABASE_URL }),
    importar = executarImportador,
    pastaMigracoes = PASTA_MIGRACOES,
    ano = process.env.RECEITA_ANO || '2025',
    importarAutomaticamente = process.env.RECEITA_AUTO_IMPORTAR !== 'false',
} = {}) {
    const anoValidado = validarAno(ano);
    const client = criarCliente();
    await client.connect();
    try {
        console.log('[Banco] Verificando migracoes...');
        await aplicarMigracoes(client, pastaMigracoes);
        if (!importarAutomaticamente) {
            console.log('[Receita] Importacao automatica desativada (RECEITA_AUTO_IMPORTAR=false).');
            return;
        }
        console.log(`[Receita] Verificando informacoes oficiais do PR para ${anoValidado}...`);
        try {
            await importar(anoValidado);
            console.log('[Receita] Verificacao concluida.');
        } catch (erro) {
            const disponiveis = await client.query(
                'SELECT 1 FROM estatistica_receita_estado_ano WHERE ano = $1 LIMIT 1', [anoValidado]);
            if (!disponiveis.rowCount) {
                throw new Error(`Falha na primeira importacao de ${anoValidado}: ${erro.message}. ` +
                    'O site ainda nao tem dados oficiais no banco. Verifique os logs e a conexao com a Receita.');
            }
            console.warn(`[Receita] Nao foi possivel atualizar ${anoValidado}: ${erro.message}`);
            console.warn('[Receita] Mantendo os dados oficiais importados anteriormente.');
        }
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    prepararAmbiente().catch((erro) => {
        console.error('[Inicializacao] Falha:', erro.message);
        process.exitCode = 1;
    });
}

module.exports = { aplicarMigracoes, prepararAmbiente, validarAno };
