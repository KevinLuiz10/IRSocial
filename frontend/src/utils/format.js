const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const inteiro = new Intl.NumberFormat("pt-BR");

export const formatarMoeda = (valor) => moeda.format(valor ?? 0);
export const formatarMoedaCompacta = (valor) => moedaCompacta.format(valor ?? 0);
export const formatarInteiro = (valor) => inteiro.format(valor ?? 0);

export function formatarData(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// O banco guarda os nomes em MAIÚSCULAS ("SÃO JOSÉ DOS PINHAIS").
// Para leitura, convertemos para "São José dos Pinhais".
const CONECTIVOS = new Set(["de", "da", "do", "das", "dos", "e", "d'"]);

export function formatarNomeMunicipio(nome) {
  if (!nome) return "";
  return nome
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((palavra, i) =>
      i > 0 && CONECTIVOS.has(palavra)
        ? palavra
        : palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1)
    )
    .join(" ");
}

// Converte "1.234,56", "1234.56" ou "1234" em número. Retorna NaN se inválido.
export function lerValorMonetario(texto) {
  if (typeof texto !== "string") return NaN;
  const limpo = texto.replace(/[R$\s]/g, "");
  if (!limpo) return NaN;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return NaN;
  return Number(normalizado);
}
