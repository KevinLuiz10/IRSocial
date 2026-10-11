'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    numeroInteiro, anoAtualBrasilia, anosParaVerificar, sincronizarUmaVez,
} = require('../scripts/sincronizar-receita');

test('planeja anos ausentes e revisa apenas os dois mais recentes', () => {
    const plano = anosParaVerificar({ inicio: 2021, atual: 2026, revisar: 2,
        importados: new Set([2021, 2022, 2023, 2024, 2025]) });
    assert.deepEqual(plano, [2025, 2026]);
});

test('faz carga historica completa no banco vazio', () => {
    assert.deepEqual(anosParaVerificar({ inicio: 2021, atual: 2026, revisar: 2,
        importados: new Set() }), [2021, 2022, 2023, 2024, 2025, 2026]);
});

test('nao busca ano futuro antes de iniciar o calendario oficial', () => {
    assert.deepEqual(anosParaVerificar({ inicio: 2021, atual: 2026, revisar: 2,
        importados: new Set([2021, 2022, 2023, 2024, 2025, 2026]) }), [2025, 2026]);
});

test('detecta ano de Brasilia na virada sem depender do fuso do servidor', () => {
    assert.equal(anoAtualBrasilia(new Date('2027-01-01T01:00:00Z')), 2026);
    assert.equal(anoAtualBrasilia(new Date('2027-01-01T04:00:00Z')), 2027);
});

test('rejeita configuracoes invalidas', () => {
    assert.equal(numeroInteiro('24', 'HORAS', 1, 720), 24);
    assert.throws(() => numeroInteiro('0', 'HORAS', 1, 720), /HORAS/);
    assert.throws(() => numeroInteiro('24.5', 'HORAS', 1, 720), /HORAS/);
    assert.throws(() => numeroInteiro('texto', 'HORAS', 1, 720), /HORAS/);
});

test('sincroniza os anos necessarios e ignora nao publicado sem impedir outros', async () => {
    const vistos = [];
    const resposta = await sincronizarUmaVez({ inicio: 2023, atual: 2026, revisar: 2,
        consultarAnos: async () => new Set([2023, 2025]),
        importarAno: async (ano) => {
            vistos.push(ano);
            if (ano === 2026) return 'nao-publicado';
            return 'verificado';
        } });
    assert.deepEqual(vistos, [2024, 2025, 2026]);
    assert.deepEqual(resposta.verificados, [2024, 2025]);
    assert.deepEqual(resposta.naoPublicados, [2026]);
});

test('se um relatorio falha continua verificando os demais', async () => {
    const vistos = [];
    const resposta = await sincronizarUmaVez({ inicio: 2024, atual: 2026, revisar: 2,
        consultarAnos: async () => new Set(),
        importarAno: async (ano) => {
            vistos.push(ano);
            if (ano === 2025) throw new Error('site offline');
            return 'verificado';
        } });
    assert.deepEqual(vistos, [2024, 2025, 2026]);
    assert.deepEqual(resposta.falhas, [2025]);
    assert.deepEqual(resposta.verificados, [2024, 2026]);
});

test('encerramento sinalizado nao inicia novas importacoes', async () => {
    const controlador = new AbortController();
    controlador.abort();
    let chamadas = 0;
    await sincronizarUmaVez({ inicio: 2025, atual: 2026, revisar: 2,
        consultarAnos: async () => new Set(),
        importarAno: async () => { chamadas++; }, signal: controlador.signal });
    assert.equal(chamadas, 0);
});
