'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extrairReceitaHTML, htmlDeBuffer, numeroBR, nomeNormalizado, validarAnoPublicado } = require('../scripts/receitaParser');

// Amostra curta retirada de registros publicados no portal da Receita (2025).
const dados = [
    ['ABATIA', '154.884,55', '216', '41.051,69', '33', '51.388,57', '78', '42,6%', '57,4%', '51.388,57', '78'],
    ['ASSAI', '509.221,15', '1.001', '16.564,33', '17', '18.594,40', '24', '100,0%', '0,0%', '18.594,40', '24'],
    ['CURITIBA', '335.670.686,75', '329.374', '14.476.668,86', '7.385', '14.723.578,57', '9.493', '73,7%', '26,3%', '14.740.607,01', '9.401'],
];
const estadualReal = ['ESTADUAL', '0,00', '0', '0,00', '0', '1.648.940,25', '1.227', '81,5%', '18,5%', '1.615.498,56', '1.164'];
function htmlComTabela(linhas = dados, comEstadual = false, valorTotal = null) {
    const total = ['TOTAL', '336.334.792,45', '330.591', '14.534.284,88', '7.435',
        '14.793.561,54', '9.595', '62,2%', '37,8%', '14.810.590,00', '9.503'];
    if (comEstadual) {
        total[5] = '16.442.501,79';
        total[6] = '10.822';
    }
    if (valorTotal !== null) total[5] = valorTotal;
    const row = (x) => `<tr>${x.map((y) => `<td><span>${y}</span></td>`).join('')}</tr>`;
    const registros = [...linhas, ...(comEstadual ? [estadualReal] : []), total];
    return `<html><head><meta charset="utf-8"></head><body><table>${registros.map(row).join('')}</table></body></html>`;
}

test('numeros brasileiros monetarios, inteiros e percentuais', () => {
    assert.equal(numeroBR('1.234.567,89'), 1234567.89);
    assert.equal(numeroBR('32.907', { inteiro: true }), 32907);
    assert.equal(numeroBR('62,2%', { percentual: true }), 62.2);
    assert.throws(() => numeroBR('1,2x'));
    assert.throws(() => numeroBR('130,0%', { percentual: true }));
});

test('normaliza municipio com acentos para a grafia da Receita', () => {
    assert.equal(nomeNormalizado('São José dos Pinhais'), 'SAO JOSE DOS PINHAIS');
    assert.equal(nomeNormalizado("Diamante d'Oeste"), 'DIAMANTE DOESTE');
});

test('extrai dados exatos da tabela sem inventar valores por fundo', () => {
    const { municipios, total } = extrairReceitaHTML(htmlComTabela(), { minimoMunicipios: 3 });
    assert.equal(municipios.length, 3);
    assert.equal(municipios[1].nome, 'ASSAI');
    assert.equal(municipios[1].valor_total, 18594.4);
    assert.equal(municipios[1].doacoes_total, 24);
    assert.equal(municipios[0].percentual_fdca, 42.6);
    assert.equal(total.valor_total, 14793561.54);
    assert.equal(Object.hasOwn(municipios[0], 'eca_valor'), false);
});

test('a linha ESTADUAL compoe o TOTAL, mas nao e tratada como municipio', () => {
    const r = extrairReceitaHTML(htmlComTabela(dados, true), { minimoMunicipios: 3 });
    assert.equal(r.municipios.length, 3);
    assert.equal(r.estadual.valor_total, 1648940.25);
    assert.equal(r.estadual.doacoes_total, 1227);
    assert.equal(r.total.valor_total, 16442501.79);
});

test('rejeita tabelas incompletas ou somas oficiais divergentes', () => {
    assert.throws(() => extrairReceitaHTML(htmlComTabela()), /incompleta/);
    assert.throws(() => extrairReceitaHTML(htmlComTabela(dados.slice(0, 2)), { minimoMunicipios: 2 }), /Soma/);
});

test('aceita diferenca de ate R$ 1,00 no total e rejeita valores superiores', () => {
    assert.doesNotThrow(() => extrairReceitaHTML(
        htmlComTabela(dados, false, '14.793.562,54'), { minimoMunicipios: 3 }));
    assert.throws(() => extrairReceitaHTML(
        htmlComTabela(dados, false, '14.793.562,55'), { minimoMunicipios: 3 }), /Soma/);
});

test('rejeita percentuais fora dos limites', () => {
    const dadosErrados = dados.map((r) => [...r]);
    dadosErrados[0][7] = '90,0%';
    assert.throws(() => extrairReceitaHTML(htmlComTabela(dadosErrados), { minimoMunicipios: 3 }), /Percentuais/);
});

test('decodifica HTML UTF-8', () => {
    assert.match(htmlDeBuffer(Buffer.from('<meta charset="utf-8">São', 'utf8')), /São/);
});

test('confirma o ano do titulo antes de aceitar o HTML da Receita', () => {
    const html = '<h1>Declarações de Imposto de Renda da Pessoa Física 2026 - UF: PR</h1>';
    assert.doesNotThrow(() => validarAnoPublicado(html, 2026));
    assert.throws(() => validarAnoPublicado(html, 2027), /nao confirma o ano/);
    assert.throws(() => validarAnoPublicado('<title>Site de terceiros</title>', 2026), /nao confirma o ano/);
});

test('aceita entidades HTML no titulo historico', () => {
    const html = '<h1>Declara&ccedil;&otilde;es de Imposto de Renda da Pessoa F&iacute;sica 2021 - UF: PR</h1>';
    assert.doesNotThrow(() => validarAnoPublicado(html, 2021));
});
