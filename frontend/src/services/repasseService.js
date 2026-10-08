import { apiFetch, USANDO_DADOS_DEMONSTRATIVOS } from "./api";
import * as mock from "../data/repassesMock";

// Contrato esperado da API (ver relatório de integração). O normalizador aceita
// tanto camelCase quanto as colunas snake_case das views do banco
// (v_repasse_municipio_ano etc.) e converte os NUMERIC, que o driver pg
// devolve como string, para número.

function num(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function normalizarRepasse(linha) {
  return {
    municipioId: linha.municipioId ?? linha.municipio_id,
    municipio: linha.municipio ?? linha.nome,
    ano: linha.ano !== undefined ? num(linha.ano) : undefined,
    valorFdca: num(linha.valorFdca ?? linha.valor_fdca),
    valorFdi: num(linha.valorFdi ?? linha.valor_fdi),
    valorTotal: num(linha.valorTotal ?? linha.valor_total),
    doacoesFdca: num(linha.doacoesFdca ?? linha.doacoes_fdca),
    doacoesFdi: num(linha.doacoesFdi ?? linha.doacoes_fdi),
  };
}

function ultimaAtualizacao(resposta) {
  return resposta.ultimaAtualizacao ?? resposta.ultima_atualizacao ?? null;
}

export async function listarAnos() {
  const r = USANDO_DADOS_DEMONSTRATIVOS
    ? await mock.listarAnos()
    : await apiFetch("/repasses/anos");
  return {
    anos: r.anos.map(Number).sort((a, b) => b - a),
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function obterResumo(ano) {
  const r = USANDO_DADOS_DEMONSTRATIVOS
    ? await mock.obterResumo(ano)
    : await apiFetch("/repasses/resumo", { params: { ano } });
  return {
    ...normalizarRepasse(r),
    municipios: num(r.municipios),
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function listarRepasses({ ano, busca, pagina = 1, limite = 20, ordem }) {
  const params = { ano, busca: busca?.trim(), pagina, limite, ordem };
  const r = USANDO_DADOS_DEMONSTRATIVOS
    ? await mock.listarRepasses(params)
    : await apiFetch("/repasses", { params });
  return {
    itens: (r.itens ?? r.dados ?? []).map(normalizarRepasse),
    total: num(r.total),
    pagina: num(r.pagina) || pagina,
    limite: num(r.limite) || limite,
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function obterHistoricoMunicipio(municipioId) {
  const r = USANDO_DADOS_DEMONSTRATIVOS
    ? await mock.obterHistoricoMunicipio(municipioId)
    : await apiFetch(`/municipios/${encodeURIComponent(municipioId)}/repasses`);
  return {
    municipio: r.municipio,
    historico: r.historico.map(normalizarRepasse).sort((a, b) => a.ano - b.ano),
    ultimaAtualizacao: ultimaAtualizacao(r),
  };
}

export async function listarMunicipios() {
  const r = USANDO_DADOS_DEMONSTRATIVOS
    ? await mock.listarMunicipios()
    : await apiFetch("/municipios");
  return r.map((m) => ({ id: m.id, nome: m.nome }));
}
