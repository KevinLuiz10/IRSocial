// DADOS DEMONSTRATIVOS. Usados apenas quando VITE_USE_MOCK=true, enquanto a
// API de repasses não existe no backend. Os valores são gerados e NÃO
// correspondem aos repasses reais. Simulam o formato das views do banco.

import { ApiError } from "../services/api";
import mapaParana from "./mapaParana.json";

const NOMES = [
  "CURITIBA", "LONDRINA", "MARINGÁ", "PONTA GROSSA", "CASCAVEL",
  "SÃO JOSÉ DOS PINHAIS", "FOZ DO IGUAÇU", "COLOMBO", "GUARAPUAVA",
  "PARANAGUÁ", "ARAUCÁRIA", "TOLEDO", "APUCARANA", "CAMPO LARGO", "PINHAIS",
  "ARAPONGAS", "ALMIRANTE TAMANDARÉ", "PIRAQUARA", "UMUARAMA", "CAMBÉ",
  "FAZENDA RIO GRANDE", "CAMPO MOURÃO", "FRANCISCO BELTRÃO", "PARANAVAÍ",
  "PATO BRANCO", "SARANDI", "CIANORTE", "TELÊMACO BORBA", "CASTRO",
  "ROLÂNDIA", "IRATI", "UNIÃO DA VITÓRIA", "IBIPORÃ", "PRUDENTÓPOLIS",
  "MARECHAL CÂNDIDO RONDON", "MEDIANEIRA", "LAPA", "PALMAS", "SANTO ANTÔNIO DA PLATINA",
  "JACAREZINHO",
];

const ANOS = [2020, 2021, 2022, 2023, 2024];
const ULTIMA_ATUALIZACAO = "2025-06-14T10:32:00-03:00";

// Gerador determinístico para os números não mudarem a cada recarga
function aleatorio(semente) {
  // Espalha a semente: sementes pequenas gerariam números minúsculos no início
  let s = ((semente * 48271) % 2147483646) + 1;
  for (let i = 0; i < 3; i++) s = (s * 16807) % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// As maiores cidades primeiro (recebem mais); depois os demais municípios do PR
const outrosNomes = mapaParana.municipios
  .map((m) => m.nome.toLocaleUpperCase("pt-BR"))
  .filter((nome) => !NOMES.includes(nome));

const municipios = [...NOMES, ...outrosNomes].map((nome, i) => ({ id: i + 1, nome }));

const repasses = municipios.flatMap((m, i) => {
  const rnd = aleatorio(i + 7);
  const grande = i < NOMES.length;
  const porte = grande ? 2_400_000 / Math.pow(i + 1, 1.15) : 4_000 + Math.pow(rnd(), 2.2) * 90_000;
  return ANOS.flatMap((ano, j) => {
    // Alguns municípios pequenos ficam sem destinações em certos anos
    if (!grande && rnd() < 0.07) return [];
    const crescimento = 1 + j * 0.09 + (rnd() - 0.5) * 0.2;
    const valorFdca = Math.round(porte * crescimento * (0.55 + rnd() * 0.15) * 100) / 100;
    const valorFdi = Math.round(porte * crescimento * (0.3 + rnd() * 0.15) * 100) / 100;
    return {
      municipio_id: m.id,
      municipio: m.nome,
      ano,
      valor_fdca: valorFdca.toFixed(2),
      valor_fdi: valorFdi.toFixed(2),
      valor_total: (valorFdca + valorFdi).toFixed(2),
      doacoes_fdca: Math.round(valorFdca / (180 + rnd() * 120)),
      doacoes_fdi: Math.round(valorFdi / (160 + rnd() * 120)),
    };
  });
});

const espera = (dados) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(dados)), 250));

function semAcento(texto) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}

export function listarAnos() {
  return espera({ anos: ANOS, ultima_atualizacao: ULTIMA_ATUALIZACAO });
}

export function obterResumo(ano) {
  const doAno = repasses.filter((r) => r.ano === Number(ano));
  const soma = (campo) => doAno.reduce((t, r) => t + Number(r[campo]), 0);
  return espera({
    ano: Number(ano),
    valor_fdca: soma("valor_fdca"),
    valor_fdi: soma("valor_fdi"),
    valor_total: soma("valor_total"),
    municipios: doAno.length,
    ultima_atualizacao: ULTIMA_ATUALIZACAO,
  });
}

export function listarRepasses({ ano, busca, pagina = 1, limite = 20, ordem }) {
  let lista = repasses.filter((r) => r.ano === Number(ano));
  if (busca) {
    const termo = semAcento(busca);
    lista = lista.filter((r) => semAcento(r.municipio).includes(termo));
  }
  lista.sort(
    ordem === "municipio"
      ? (a, b) => a.municipio.localeCompare(b.municipio, "pt-BR")
      : (a, b) => Number(b.valor_total) - Number(a.valor_total)
  );
  const inicio = (pagina - 1) * limite;
  return espera({
    dados: lista.slice(inicio, inicio + limite),
    total: lista.length,
    pagina,
    limite,
    ultima_atualizacao: ULTIMA_ATUALIZACAO,
  });
}

export function listarRepassesDoAno(ano) {
  return espera({
    dados: repasses
      .filter((r) => r.ano === Number(ano))
      .map(({ municipio_id, municipio, valor_fdca, valor_fdi, valor_total }) => ({
        municipio_id, municipio, valor_fdca, valor_fdi, valor_total,
      })),
    ultima_atualizacao: ULTIMA_ATUALIZACAO,
  });
}

export function obterHistoricoMunicipio(id) {
  const municipio = municipios.find((m) => m.id === Number(id));
  if (!municipio) {
    return Promise.reject(new ApiError("Município não encontrado.", 404));
  }
  return espera({
    municipio,
    historico: repasses.filter((r) => r.municipio_id === municipio.id),
    ultima_atualizacao: ULTIMA_ATUALIZACAO,
  });
}

export function listarMunicipios() {
  return espera(municipios);
}
