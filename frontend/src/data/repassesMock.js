// DADOS DEMONSTRATIVOS. Usados apenas quando VITE_USE_MOCK=true (por exemplo,
// para mostrar o site sem banco). Os valores são gerados e NÃO correspondem
// aos dados reais, mas seguem o mesmo formato das rotas do backend
// (backend/routes-repasses.js): total exato e só o percentual de cada fundo.

import { ApiError } from "../services/api";
import municipiosParana from "./municipiosParana.json";

// As maiores cidades primeiro (recebem mais); depois os demais municípios
const MAIORES = [
  "Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel",
  "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava",
  "Paranaguá", "Araucária", "Toledo", "Apucarana", "Campo Largo", "Pinhais",
  "Arapongas", "Almirante Tamandaré", "Piraquara", "Umuarama", "Cambé",
];

const ANOS = [2021, 2022, 2023, 2024, 2025];
const ULTIMA_ATUALIZACAO = "2026-06-14T10:32:00-03:00";

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

// Como a Receita publica: MAIÚSCULAS e sem acento
const comoReceita = (nome) =>
  nome.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();

const nomes = [
  ...MAIORES,
  ...municipiosParana.map((m) => m.nome).filter((nome) => !MAIORES.includes(nome)),
];
const municipios = nomes.map((nome, i) => ({ id: i + 1, nome: comoReceita(nome) }));

const arredondar = (v, casas = 2) => Math.round(v * 10 ** casas) / 10 ** casas;

const repasses = municipios.flatMap((m, i) => {
  const rnd = aleatorio(i + 7);
  const grande = i < MAIORES.length;
  const porte = grande ? 9_000_000 / Math.pow(i + 1, 1.15) : 6_000 + Math.pow(rnd(), 2.2) * 160_000;
  return ANOS.map((ano, j) => {
    const crescimento = 1 + j * 0.12 + (rnd() - 0.5) * 0.25;
    const valorTotal = arredondar(porte * crescimento);
    const percentualFdca = arredondar(40 + rnd() * 40, 1);
    const doacoes = Math.max(1, Math.round(valorTotal / (450 + rnd() * 400)));
    return {
      municipio_id: m.id,
      municipio: m.nome,
      ano,
      potencial: arredondar(valorTotal * (8 + rnd() * 30)),
      valor_total: valorTotal,
      doacoes_total: doacoes,
      percentual_fdca: percentualFdca,
      percentual_fdi: arredondar(100 - percentualFdca, 1),
      valor_darf: arredondar(valorTotal * (0.97 + rnd() * 0.03)),
      qtde_darf: Math.round(doacoes * (0.95 + rnd() * 0.05)),
      ultima_atualizacao: ULTIMA_ATUALIZACAO,
    };
  });
});

const espera = (dados) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(dados)), 250));

export function listarAnos() {
  return espera({ anos: [...ANOS].reverse(), ultima_atualizacao: ULTIMA_ATUALIZACAO });
}

export function obterResumo(ano) {
  const doAno = repasses.filter((r) => r.ano === Number(ano));
  const soma = (campo) => doAno.reduce((t, r) => t + r[campo], 0);
  const total = soma("valor_total");
  const fdca = doAno.reduce((t, r) => t + (r.valor_total * r.percentual_fdca) / 100, 0);
  const percentualFdca = arredondar((fdca / total) * 100, 1);
  return espera({
    ano: Number(ano),
    potencial: soma("potencial"),
    valor_total: arredondar(total),
    doacoes_total: soma("doacoes_total"),
    percentual_fdca: percentualFdca,
    percentual_fdi: arredondar(100 - percentualFdca, 1),
    valor_darf: arredondar(soma("valor_darf")),
    qtde_darf: soma("qtde_darf"),
    estadual_valor: 0,
    estadual_doacoes: 0,
    municipios: doAno.length,
    ultima_atualizacao: ULTIMA_ATUALIZACAO,
  });
}

export function listarRepasses({ ano, busca, pagina = 1, limite = 20, ordem }) {
  let lista = repasses.filter((r) => r.ano === Number(ano));
  if (busca) {
    const termo = comoReceita(busca);
    lista = lista.filter((r) => r.municipio.includes(termo));
  }
  lista.sort(
    ordem === "municipio"
      ? (a, b) => a.municipio.localeCompare(b.municipio, "pt-BR")
      : (a, b) => b.valor_total - a.valor_total
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
