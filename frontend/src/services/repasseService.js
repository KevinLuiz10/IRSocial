import { apiFetch } from "./api";

// Consome as rotas de backend/routes-repasses.js. O normalizador aceita tanto
// camelCase quanto as colunas snake_case do banco e converte os NUMERIC, que o
// driver pg devolve como string, para número.

function opcional(valor) {
  return valor === undefined || valor === null ? null : num(valor);
}

function num(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function normalizarRepasse(linha) {
  return {
    municipioId: linha.municipioId ?? linha.municipio_id,
    municipio: linha.municipio ?? linha.nome,
    ano: linha.ano !== undefined ? num(linha.ano) : undefined,
    valorFdca: opcional(linha.valorFdca ?? linha.valor_fdca),
    valorFdi: opcional(linha.valorFdi ?? linha.valor_fdi),
    valorTotal: num(linha.valorTotal ?? linha.valor_total),
    doacoesFdca: opcional(linha.doacoesFdca ?? linha.doacoes_fdca),
    doacoesFdi: opcional(linha.doacoesFdi ?? linha.doacoes_fdi),
    percentualFdca: opcional(linha.percentualFdca ?? linha.percentual_fdca),
    percentualFdi: opcional(linha.percentualFdi ?? linha.percentual_fdi),
    doacoesTotal: opcional(linha.doacoesTotal ?? linha.doacoes_total),
    valorDarf: opcional(linha.valorDarf ?? linha.valor_darf),
    potencial: opcional(linha.potencial),
    destinacaoPf: opcional(linha.destinacaoPf ?? linha.destinacao_pf),
    estadualValor: opcional(linha.estadualValor ?? linha.estadual_valor),
    estadualDoacoes: opcional(linha.estadualDoacoes ?? linha.estadual_doacoes),
  };
}

function ultimaAtualizacao(resposta) {
  return resposta.ultimaAtualizacao ?? resposta.ultima_atualizacao ?? null;
}

export async function listarAnos() {
  const r = await apiFetch("/repasses/anos");
  return {
    anos: r.anos.map(Number).sort((a, b) => b - a),
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function obterResumo(ano) {
  const r = await apiFetch("/repasses/resumo", { params: { ano } });
  return {
    ...normalizarRepasse(r),
    municipios: num(r.municipios),
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function listarRepasses({ ano, busca, pagina = 1, limite = 20, ordem }) {
  const params = { ano, busca: busca?.trim(), pagina, limite, ordem };
  const r = await apiFetch("/repasses", { params });
  return {
    itens: (r.itens ?? r.dados ?? []).map(normalizarRepasse),
    total: num(r.total),
    pagina: num(r.pagina) || pagina,
    limite: num(r.limite) || limite,
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

// Todos os municípios de um ano, usado pelo mapa. Reaproveita a listagem
// paginada da API (máximo de 100 por página): busca a primeira página e,
// sabendo o total, as demais em paralelo. Para os 399 municípios: 4 chamadas.
const MAXIMO_POR_PAGINA = 100;

export async function listarRepassesDoAno(ano) {
  const primeira = await listarRepasses({ ano, pagina: 1, limite: MAXIMO_POR_PAGINA });
  const totalPaginas = Math.ceil(primeira.total / MAXIMO_POR_PAGINA);
  const demais = await Promise.all(
    Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, i) =>
      listarRepasses({ ano, pagina: i + 2, limite: MAXIMO_POR_PAGINA })
    )
  );
  return {
    itens: [primeira, ...demais].flatMap((p) => p.itens),
    ultimaAtualizacao: primeira.ultimaAtualizacao,
  };
}

export async function obterHistoricoMunicipio(municipioId) {
  const r = await apiFetch(`/municipios/${encodeURIComponent(municipioId)}/repasses`);
  return {
    municipio: r.municipio,
    historico: r.historico.map(normalizarRepasse).sort((a, b) => a.ano - b.ano),
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function listarMunicipios() {
  const r = await apiFetch("/municipios");
  return r.map((m) => ({ id: m.id, nome: m.nome }));
}
