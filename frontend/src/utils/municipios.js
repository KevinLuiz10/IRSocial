import municipiosParana from "../data/municipiosParana.json";

// A Receita publica os nomes em MAIÚSCULAS e sem acento ("SAO JOSE DOS PINHAIS"),
// e o banco não guarda o código IBGE. Para casar com o IBGE comparamos nomes sem
// acento, pontuação ou espaços: "DIAMANTE D'OESTE" e "Diamante D'Oeste" viram
// "DIAMANTEDOESTE".
function chaveBruta(nome) {
  return String(nome)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

// Grafias da Receita que diferem do IBGE (conferidas nos relatórios 2021–2025)
const EQUIVALENCIAS = {
  BELAVISTADOCAROBA: "BELAVISTADACAROBA",
  MUNHOZDEMELLO: "MUNHOZDEMELO",
  PINHALDOSAOBENTO: "PINHALDESAOBENTO",
  SANTACRUZDOMONTECASTELO: "SANTACRUZDEMONTECASTELO",
};

export function chaveMunicipio(nome) {
  const chave = chaveBruta(nome);
  return EQUIVALENCIAS[chave] ?? chave;
}

const nomePorChave = new Map(municipiosParana.map((m) => [chaveMunicipio(m.nome), m.nome]));

// Nome oficial do IBGE, com acentos ("São José dos Pinhais"), ou null se não for do PR
export function nomeOficial(nome) {
  return nomePorChave.get(chaveMunicipio(nome)) ?? null;
}
