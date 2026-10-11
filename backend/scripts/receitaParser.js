'use strict';

const TOLERANCIA_TOTAL_CENTAVOS = 100;

// Le a tabela HTML publica da Receita Federal, sem dependencias adicionais.
// A fonte oferece totais em reais e proporcoes arredondadas por fundo.
function nomeNormalizado(nome) {
    return String(nome).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function decodificarEntidades(texto) {
    const entidades = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>',
        aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', eacute: 'é',
        ecirc: 'ê', iacute: 'í', oacute: 'ó', ocirc: 'ô', otilde: 'õ',
        uacute: 'ú', ccedil: 'ç', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã',
        Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Otilde: 'Õ', Uacute: 'Ú', Ccedil: 'Ç' };
    return texto.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (ref, entidade) => {
        if (entidade.startsWith('#x')) return String.fromCodePoint(parseInt(entidade.slice(2), 16));
        if (entidade.startsWith('#')) return String.fromCodePoint(parseInt(entidade.slice(1), 10));
        return entidades[entidade] ?? ref;
    });
}

function textoCelula(html) {
    return decodificarEntidades(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function numeroBR(valor, { inteiro = false, percentual = false } = {}) {
    const texto = String(valor).trim().replace(/\u00a0/g, ' ')
        .replace(/^R\$\s*/, '').replace(/\s/g, '').replace(/%$/, '');
    if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(texto)) {
        throw new Error(`Numero invalido na fonte oficial: ${JSON.stringify(valor)}`);
    }
    const valorNumerico = Number(texto.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(valorNumerico) || valorNumerico < 0 ||
        (inteiro && !Number.isSafeInteger(valorNumerico)) ||
        (percentual && valorNumerico > 100)) {
        throw new Error(`Valor fora dos limites: ${JSON.stringify(valor)}`);
    }
    return valorNumerico;
}

function linhaDados(celulas) {
    if (celulas.length !== 11) return null;
    const nome = nomeNormalizado(celulas[0]);
    if (!nome || nome === 'MUNICIPIO' || nome === 'UF') return null;
    // Ignora cabecalhos/tabelas decorativas, sem silenciar valores invalidos.
    if (!/^\d/.test(celulas[1].trim())) return null;
    const r = {
        nome,
        potencial: numeroBR(celulas[1]),
        contribuintes: numeroBR(celulas[2], { inteiro: true }),
        destinacao_pf: numeroBR(celulas[3]),
        qtde_pf: numeroBR(celulas[4], { inteiro: true }),
        valor_total: numeroBR(celulas[5]),
        doacoes_total: numeroBR(celulas[6], { inteiro: true }),
        percentual_fdca: numeroBR(celulas[7], { percentual: true }),
        percentual_fdi: numeroBR(celulas[8], { percentual: true }),
        valor_darf: numeroBR(celulas[9]),
        qtde_darf: numeroBR(celulas[10], { inteiro: true }),
    };
    const percentualSomado = r.percentual_fdca + r.percentual_fdi;
    if ((r.valor_total > 0 && Math.abs(percentualSomado - 100) > 0.11) ||
        (r.valor_total === 0 && percentualSomado !== 0)) {
        throw new Error(`Percentuais inconsistentes para ${nome}: ${percentualSomado}`);
    }
    return r;
}

function extrairReceitaHTML(html, { minimoMunicipios = 399 } = {}) {
    const linhas = [];
    const vistos = new Set();
    let total = null;
    let estadual = null;
    const expLinha = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    for (const item of html.matchAll(expLinha)) {
        const celulas = [...item[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
            .map((c) => textoCelula(c[1]));
        const linha = linhaDados(celulas);
        if (!linha) continue;
        if (linha.nome === 'TOTAL') {
            if (total) throw new Error('Mais de uma linha TOTAL encontrada');
            total = linha;
            continue;
        }
        // A linha ESTADUAL representa fundos estaduais, nao o 400o municipio.
        if (linha.nome === 'ESTADUAL') {
            if (estadual) throw new Error('Mais de uma linha ESTADUAL encontrada');
            estadual = linha;
            continue;
        }
        if (vistos.has(linha.nome)) throw new Error(`Municipio duplicado: ${linha.nome}`);
        vistos.add(linha.nome);
        linhas.push(linha);
    }
    if (!total || linhas.length < minimoMunicipios) {
        throw new Error(`Tabela HTML incompleta: ${linhas.length} municipios, total ${total ? 'presente' : 'ausente'}`);
    }
    // A soma publicada pode divergir em ate R$ 1,00 do agregado oficial.
    const centavos = linhas.reduce((soma, r) => soma + Math.round(r.valor_total * 100),
        estadual ? Math.round(estadual.valor_total * 100) : 0);
    if (Math.abs(centavos - Math.round(total.valor_total * 100)) > TOLERANCIA_TOTAL_CENTAVOS) {
        throw new Error('Soma dos valores municipais difere do TOTAL da Receita; importacao cancelada');
    }
    const doacoes = linhas.reduce((soma, r) => soma + r.doacoes_total,
        estadual ? estadual.doacoes_total : 0);
    if (doacoes !== total.doacoes_total) {
        throw new Error('Soma das doacoes municipais difere do TOTAL da Receita; importacao cancelada');
    }
    return { municipios: linhas, total, estadual };
}


// Confere que a pagina pertence ao ano consultado; nao confia apenas na URL.
function validarAnoPublicado(html, anoEsperado) {
    const cabecalho = html.replace(/<[^>]*>/g, ' ').replace(/&(?:#\d+|[a-z]+);/gi, 'x')
        .replace(/\s+/g, ' ').slice(0, 20000);
    const encontrado = cabecalho.match(/Imposto\s+de\s+Renda\s+da\s+Pessoa\s+F\S*\s+(20\d{2})\b/i);
    if (!encontrado || Number(encontrado[1]) !== anoEsperado) {
        throw new Error(`Titulo do relatorio nao confirma o ano ${anoEsperado}; importacao cancelada.`);
    }
}

function htmlDeBuffer(buffer) {
    // As paginas historicas da Receita podem ser ISO-8859-1/Windows-1252.
    const inicio = buffer.subarray(0, 4096).toString('latin1');
    const charset = /charset\s*=\s*["']?([\w-]+)/i.exec(inicio)?.[1];
    return new TextDecoder(charset && /^(?:utf-?8)$/i.test(charset) ? 'utf-8' : 'windows-1252')
        .decode(buffer);
}

module.exports = { extrairReceitaHTML, htmlDeBuffer, nomeNormalizado, numeroBR, validarAnoPublicado };
