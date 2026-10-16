// Gera, a partir das APIs públicas do IBGE:
//   - src/data/mapaParana.json: contorno dos municípios do Paraná em caminhos SVG;
//   - src/data/municipiosParana.json: só código e nome oficial (leve, usado
//     para exibir os nomes com acento em todo o site).
// Rode só quando quiser atualizar a malha (ela muda raramente):
//
//   node scripts/gerar-mapa-parana.mjs
//
// Se aparecer "unable to verify the first certificate", o servidor do IBGE
// não enviou a cadeia completa; use os certificados do sistema:
//   node --use-system-ca scripts/gerar-mapa-parana.mjs
//
// O site não chama o IBGE em tempo de execução: o JSON gerado vai junto no build.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const UF_PR = 41;
const URL_MALHA = `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${UF_PR}?formato=application/vnd.geo%2Bjson&intrarregiao=municipio&qualidade=minima`;
const URL_NOMES = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${UF_PR}/municipios`;
const LARGURA = 1000;
const SAIDA = new URL("../src/data/mapaParana.json", import.meta.url);
const SAIDA_NOMES = new URL("../src/data/municipiosParana.json", import.meta.url);

async function baixar(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${resposta.status}`);
  return resposta.json();
}

function aneis(geometria) {
  if (geometria.type === "Polygon") return geometria.coordinates;
  if (geometria.type === "MultiPolygon") return geometria.coordinates.flat();
  throw new Error(`Geometria não suportada: ${geometria.type}`);
}

const [malha, nomes] = await Promise.all([baixar(URL_MALHA), baixar(URL_NOMES)]);
const nomePorCodigo = new Map(nomes.map((m) => [String(m.id), m.nome]));

// Limites do estado, para enquadrar o desenho
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const f of malha.features) {
  for (const anel of aneis(f.geometry)) {
    for (const [lon, lat] of anel) {
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
  }
}

// Projeção equirretangular corrigida pela latitude média: suficiente para um único estado
const fatorLon = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const escala = LARGURA / ((maxLon - minLon) * fatorLon);
const altura = Math.ceil((maxLat - minLat) * escala);

const projetar = ([lon, lat]) => [
  Math.round((lon - minLon) * fatorLon * escala * 10) / 10,
  Math.round((maxLat - lat) * escala * 10) / 10,
];

function caminho(geometria) {
  return aneis(geometria)
    .map((anel) => {
      const pontos = [];
      for (const ponto of anel.map(projetar)) {
        const ultimo = pontos.at(-1);
        if (!ultimo || ultimo[0] !== ponto[0] || ultimo[1] !== ponto[1]) pontos.push(ponto);
      }
      if (pontos.length < 3) return "";
      return `M${pontos.map((p) => p.join(",")).join("L")}Z`;
    })
    .join("");
}

const municipios = malha.features
  .map((f) => {
    const codigo = String(f.properties.codarea);
    const nome = nomePorCodigo.get(codigo);
    if (!nome) throw new Error(`Município sem nome no IBGE: ${codigo}`);
    return { codigo, nome, d: caminho(f.geometry) };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

const fonte = "IBGE – Malhas territoriais e Localidades (servicodados.ibge.gov.br)";
await writeFile(
  SAIDA,
  JSON.stringify({ fonte, largura: LARGURA, altura, municipios }) + "\n"
);
await writeFile(
  SAIDA_NOMES,
  JSON.stringify(municipios.map(({ codigo, nome }) => ({ codigo, nome }))) + "\n"
);
console.log(`${municipios.length} municípios gravados em ${fileURLToPath(SAIDA)} (${LARGURA}×${altura})`);
