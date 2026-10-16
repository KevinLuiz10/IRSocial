import { formatarMoeda, formatarMoedaCompacta } from "./format";

export { chaveMunicipio } from "./municipios";

const porcentagem = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

// O que o mapa pode colorir. A fonte oficial só traz o valor exato do total;
// por fundo há apenas percentuais arredondados, por isso não há modo por fundo.
export const METRICAS = {
  total: {
    rotulo: "Valor destinado",
    rotuloCurto: "Valor",
    descricao: "Quanto os contribuintes destinaram aos fundos do município.",
    cor: "var(--color-brand)",
    valor: (linha) => linha.valorTotal,
    formatar: formatarMoeda,
    formatarCurto: formatarMoedaCompacta,
  },
  potencial: {
    rotulo: "Aproveitamento do potencial",
    rotuloCurto: "% do potencial",
    descricao:
      "Quanto do valor que os contribuintes poderiam destinar foi de fato destinado. Compara cidades grandes e pequenas.",
    cor: "var(--color-potencial)",
    valor: (linha) => (linha.potencial > 0 ? linha.valorTotal / linha.potencial : 0),
    formatar: (v) => porcentagem.format(v),
    formatarCurto: (v) => porcentagem.format(v),
  },
};

// Escala sequencial: um único tom, do claro (pouco) ao escuro (muito)
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

// Faixas por quantis: os valores são muito concentrados (a capital recebe
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

export function rotulosDasFaixas(limites, formatar) {
  if (limites.length === 0) return ["Com destinações"];
  return [
    `Até ${formatar(limites[0])}`,
    ...limites.slice(1).map((limite, i) => `${formatar(limites[i])} a ${formatar(limite)}`),
    `Acima de ${formatar(limites.at(-1))}`,
  ];
}
