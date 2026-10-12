import { formatarMoedaCompacta } from "./format";

// O banco não tem o código IBGE dos municípios, só o nome vindo da planilha.
// Para cruzar com o mapa, comparamos nomes sem acento, pontuação ou espaços:
// "DIAMANTE D'OESTE" e "Diamante D'Oeste" viram "DIAMANTEDOESTE".
export function chaveMunicipio(nome) {
  return String(nome)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export const METRICAS = {
  total: { rotulo: "Total", rotuloCurto: "Total", campo: "valorTotal", cor: "var(--color-brand)" },
  fdca: { rotulo: "Criança e Adolescente", rotuloCurto: "Criança", campo: "valorFdca", cor: "var(--color-fdca)" },
  fdi: { rotulo: "Pessoa Idosa", rotuloCurto: "Idoso", campo: "valorFdi", cor: "var(--color-fdi)" },
};

// Escala sequencial: um único tom, do claro (pouco repasse) ao escuro (muito repasse)
const INTENSIDADES = [14, 32, 52, 74, 100];

export function corDaFaixa(indice, totalFaixas, corBase) {
  const passo = totalFaixas <= 1 ? INTENSIDADES.length - 1 : (indice * (INTENSIDADES.length - 1)) / (totalFaixas - 1);
  const pct = INTENSIDADES[Math.round(passo)];
  return pct === 100 ? corBase : `color-mix(in oklab, ${corBase} ${pct}%, #ffffff)`;
}

// Arredonda para 2 algarismos significativos, para a legenda ter números "redondos"
function arredondar(valor) {
  if (valor <= 0) return 0;
  const magnitude = 10 ** (Math.floor(Math.log10(valor)) - 1);
  return Math.round(valor / magnitude) * magnitude;
}

// Faixas por quantis: os repasses são muito concentrados (a capital recebe
// muito mais que o resto), então faixas de tamanho igual deixariam quase
// todo o mapa com a mesma cor. Com quantis, cada faixa tem ~1/5 dos municípios.
export function calcularLimites(valores, faixas = 5) {
  const ordenados = valores.filter((v) => v > 0).sort((a, b) => a - b);
  if (ordenados.length === 0) return [];
  const maior = ordenados.at(-1);
  const limites = [];
  for (let i = 1; i < faixas; i++) {
    const limite = arredondar(ordenados[Math.floor((i / faixas) * ordenados.length)]);
    if (limite > (limites.at(-1) ?? 0) && limite < maior) limites.push(limite);
  }
  return limites;
}

export function faixaDoValor(valor, limites) {
  const i = limites.findIndex((limite) => valor < limite);
  return i === -1 ? limites.length : i;
}

export function rotulosDasFaixas(limites) {
  if (limites.length === 0) return ["Com repasse"];
  const f = formatarMoedaCompacta;
  return [
    `Até ${f(limites[0])}`,
    ...limites.slice(1).map((limite, i) => `${f(limites[i])} a ${f(limite)}`),
    `Acima de ${f(limites.at(-1))}`,
  ];
}
