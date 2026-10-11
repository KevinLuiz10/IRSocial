'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// Permite testar a logica dos handlers sem acessar o PostgreSQL ou instalar Express.
const handlers = new Map();
const carregarOriginal = Module._load;
Module._load = function (request, parent, isMain) {
    if (request === 'express') {
        return { Router: () => ({ get: (caminho, handler) => handlers.set(caminho, handler) }) };
    }
    return carregarOriginal.call(this, request, parent, isMain);
};
const { criarRotasRepasses } = require('../routes-repasses');
Module._load = carregarOriginal;

function respostaFake() {
    return {
        statusCode: 200, dados: null,
        status(codigo) { this.statusCode = codigo; return this; },
        json(dados) { this.dados = dados; return this; },
    };
}

async function requisitar(caminho, query = {}, params = {}) {
    const resposta = respostaFake();
    const errors = [];
    await handlers.get(caminho)({ query, params }, resposta, (err) => errors.push(err));
    assert.deepEqual(errors, []);
    return resposta;
}

test('registra as cinco rotas da API sem alterar o roteamento do React', () => {
    criarRotasRepasses({ query: async () => ({ rowCount: 0, rows: [] }) });
    assert.deepEqual([...handlers.keys()].sort(), [
        '/municipios', '/municipios/:id/repasses', '/repasses', '/repasses/anos', '/repasses/resumo',
    ].sort());
});

test('valida ano, pagina e identificador do municipio', async () => {
    criarRotasRepasses({ query: async () => ({ rowCount: 0, rows: [] }) });
    assert.equal((await requisitar('/repasses/resumo', { ano: '2025;DROP' })).statusCode, 400);
    assert.equal((await requisitar('/repasses', { ano: '2025', pagina: '-1' })).statusCode, 400);
    assert.equal((await requisitar('/municipios/:id/repasses', {}, { id: '1 OR 1=1' })).statusCode, 400);
});

test('listagem limita pagina fora do intervalo e normaliza acento', async () => {
    const chamadas = [];
    criarRotasRepasses({ query: async (sql, valores) => {
        chamadas.push({ sql, valores });
        if (sql.includes('count(*)::int AS total')) return { rows: [{ total: 3 }] };
        if (sql.includes('ORDER BY e.valor_total DESC')) return { rows: [{ municipio: 'ASSAI', valor_total: '18594.40' }] };
        return { rows: [{ ultima_atualizacao: '2026-04-01' }] };
    }});
    const r = await requisitar('/repasses', { ano: '2025', pagina: '99', limite: '2',
        busca: 'Assaí', ordem: 'valor_total; DROP TABLE municipio' });
    assert.equal(r.statusCode, 200);
    assert.equal(r.dados.pagina, 2);
    assert.equal(r.dados.total, 3);
    assert.equal(chamadas[0].valores[1], 'ASSAI');
    assert.deepEqual(chamadas[1].valores, [2025, 'ASSAI', 2, 2]);
    assert.ok(!chamadas[1].sql.includes('DROP TABLE'));
});
