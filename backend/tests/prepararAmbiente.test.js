'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { aplicarMigracoes, prepararAmbiente, validarAno } = require('../scripts/preparar-ambiente');

function bancoSimulado({ anosDisponiveis = [], migracoesRegistradas = {} } = {}) {
    const chamadas = [];
    const registradas = new Map(Object.entries(migracoesRegistradas));
    let encerrado = false;
    const client = {
        connect: async () => { chamadas.push('CONNECT'); },
        end: async () => { encerrado = true; chamadas.push('END'); },
        query: async (sql, valores = []) => {
            chamadas.push({ sql, valores });
            if (sql.startsWith('SELECT hash_sha256 FROM schema_migrations')) {
                const hash = registradas.get(valores[0]);
                return { rowCount: hash ? 1 : 0, rows: hash ? [{ hash_sha256: hash }] : [] };
            }
            if (sql.startsWith('INSERT INTO schema_migrations')) {
                registradas.set(valores[0], valores[1]);
            }
            if (sql.startsWith('SELECT 1 FROM estatistica_receita_estado_ano')) {
                return { rowCount: anosDisponiveis.includes(valores[0]) ? 1 : 0, rows: [] };
            }
            return { rowCount: 0, rows: [] };
        },
    };
    return { client, chamadas, registradas, get encerrado() { return encerrado; } };
}

function pastaTemporaria(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'irsocial-migracoes-'));
    fs.writeFileSync(path.join(dir, '001_criacao.sql'), 'CREATE TABLE IF NOT EXISTS exemplo (id int);');
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    return dir;
}

test('valida configuracao do ano antes de inicializar', () => {
    assert.equal(validarAno('2025'), 2025);
    assert.throws(() => validarAno('2025; DROP TABLE'), /invalido/);
    assert.throws(() => validarAno(''), /invalido/);
});

test('migra uma vez e nao repete scripts ja aplicados', async (t) => {
    const dir = pastaTemporaria(t);
    const banco = bancoSimulado();
    await aplicarMigracoes(banco.client, dir);
    const primeiras = banco.chamadas.filter((c) => c.sql === 'CREATE TABLE IF NOT EXISTS exemplo (id int);').length;
    await aplicarMigracoes(banco.client, dir);
    const finais = banco.chamadas.filter((c) => c.sql === 'CREATE TABLE IF NOT EXISTS exemplo (id int);').length;
    assert.equal(primeiras, 1);
    assert.equal(finais, 1);
    assert.equal(banco.registradas.size, 1);
});

test('recusa mudar uma migracao que ja foi aplicada', async (t) => {
    const dir = pastaTemporaria(t);
    const banco = bancoSimulado();
    await aplicarMigracoes(banco.client, dir);
    fs.writeFileSync(path.join(dir, '001_criacao.sql'), 'CREATE TABLE exemplo_nova (id int);');
    await assert.rejects(aplicarMigracoes(banco.client, dir), /alterada apos aplicada/);
});

test('inicializa banco e tenta importar dados automaticamente', async (t) => {
    const dir = pastaTemporaria(t);
    const banco = bancoSimulado();
    const anos = [];
    await prepararAmbiente({ criarCliente: () => banco.client, pastaMigracoes: dir,
        ano: '2025', importar: async (ano) => anos.push(ano) });
    assert.deepEqual(anos, [2025]);
    assert.equal(banco.encerrado, true);
});

test('quando a Receita cai, preserva os dados anteriores e segue', async (t) => {
    const dir = pastaTemporaria(t);
    const banco = bancoSimulado({ anosDisponiveis: [2025] });
    await assert.doesNotReject(prepararAmbiente({ criarCliente: () => banco.client,
        pastaMigracoes: dir, ano: '2025', importar: async () => { throw new Error('offline'); } }));
    assert.equal(banco.encerrado, true);
});

test('falha no primeiro carregamento quando a Receita esta indisponivel', async (t) => {
    const dir = pastaTemporaria(t);
    const banco = bancoSimulado();
    await assert.rejects(prepararAmbiente({ criarCliente: () => banco.client,
        pastaMigracoes: dir, ano: '2025', importar: async () => { throw new Error('offline'); } }),
    /Falha na primeira importacao/);
    assert.equal(banco.encerrado, true);
});

test('permite desativar a importacao automatica explicitamente', async (t) => {
    const dir = pastaTemporaria(t);
    const banco = bancoSimulado();
    let chamadas = 0;
    await prepararAmbiente({ criarCliente: () => banco.client,
        pastaMigracoes: dir, ano: '2025', importarAutomaticamente: false,
        importar: async () => { chamadas++; } });
    assert.equal(chamadas, 0);
    assert.equal(banco.registradas.size, 1);
});
