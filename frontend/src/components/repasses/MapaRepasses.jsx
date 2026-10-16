import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import ParanaMap, { MapLegend } from "./ParanaMap";
import FundSplitBar from "./FundSplitBar";
import Loading from "../common/Loading";
import ErrorMessage from "../common/ErrorMessage";
import { useRequest } from "../../hooks/useRequest";
import { listarRepassesDoAno } from "../../services/repasseService";
import { formatarMoeda, formatarInteiro, formatarPercentual } from "../../utils/format";
import {
  calcularLimites,
  chaveMunicipio,
  corDaFaixa,
  faixaDoValor,
  METRICAS,
  rotulosDasFaixas,
} from "../../utils/mapa";

// A malha (~37 KB comprimida) só é baixada quando o mapa aparece
const carregarMalha = () => import("../../data/mapaParana.json").then((m) => m.default);

export default function MapaRepasses({ ano }) {
  const malha = useRequest(carregarMalha, "malha-pr");
  const dados = useRequest(() => listarRepassesDoAno(ano), `mapa-${ano}`);
  const [metrica, setMetrica] = useState("total");
  const [selecionado, setSelecionado] = useState(null);

  const visao = useMemo(() => {
    if (!malha.data || !dados.data) return null;
    return montarVisao(malha.data, dados.data.itens, metrica);
  }, [malha.data, dados.data, metrica]);

  // Avisa no console (só em desenvolvimento) quais nomes da Receita não
  // casaram com o IBGE; nesse caso, acrescente a grafia em utils/municipios.js.
  useEffect(() => {
    if (import.meta.env.DEV && visao?.semCorrespondencia.length) {
      console.warn("Municípios sem correspondência no mapa:", visao.semCorrespondencia);
    }
  }, [visao]);

  const erro = malha.error || dados.error;
  if (erro) {
    return (
      <ErrorMessage
        titulo="Não foi possível carregar o mapa"
        erro={erro}
        onRetry={() => (malha.error ? malha.retry() : dados.retry())}
      />
    );
  }

  const info = METRICAS[metrica];
  const municipioSelecionado = visao?.municipios.find((m) => m.codigo === selecionado);

  return (
    <section aria-labelledby="titulo-mapa">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 id="titulo-mapa" className="text-2xl font-bold">Mapa das destinações em {ano}</h2>
          <p className="mt-1 text-ink-soft">
            {info.descricao} Quanto mais escuro, maior. Clique em um município
            para ver os detalhes.
          </p>
        </div>
        <SeletorMetrica valor={metrica} onChange={setMetrica} />
      </div>

      {!visao ? (
        <div className="mt-6 grid aspect-[10/7] place-items-center rounded-lg border border-line bg-surface lg:aspect-auto lg:h-[32rem]">
          <div className="w-1/2"><Loading linhas={3} rotulo="Carregando mapa…" /></div>
        </div>
      ) : (
        <div className={`mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] ${dados.loading ? "opacity-60" : ""}`}>
          <div className="rounded-lg border border-line bg-surface p-3 sm:p-5">
            <BuscaNoMapa municipios={visao.municipios} onEscolher={setSelecionado} />
            <div className="mt-3">
              <ParanaMap
                largura={malha.data.largura}
                altura={malha.data.altura}
                municipios={visao.municipios}
                cores={visao.cores}
                rotuloMetrica={info.rotulo}
                formatarValor={info.formatar}
                selecionado={selecionado}
                onSelecionar={setSelecionado}
              />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-sm font-semibold">{info.rotulo} em {ano}</p>
              <MapLegend rotulos={visao.rotulos} cores={visao.cores} />
            </div>
          </div>

          <PainelMunicipio
            ano={ano}
            municipio={municipioSelecionado}
            ranking={visao.ranking}
            metrica={metrica}
            onEscolher={setSelecionado}
            onFechar={() => setSelecionado(null)}
          />
        </div>
      )}

      <p className="mt-3 text-xs text-ink-muted">Malha municipal: IBGE. Valores: Receita Federal.</p>
    </section>
  );
}

function montarVisao(malha, itens, metrica) {
  const { valor: valorDe, cor, formatarCurto } = METRICAS[metrica];
  const porChave = new Map(itens.map((item) => [chaveMunicipio(item.municipio), item]));
  const chavesDoMapa = new Set();

  const limites = calcularLimites(itens.map(valorDe));
  const totalFaixas = limites.length + 1;
  const cores = Array.from({ length: totalFaixas }, (_, i) => corDaFaixa(i, totalFaixas, cor));

  const municipios = malha.municipios.map((m) => {
    const chave = chaveMunicipio(m.nome);
    chavesDoMapa.add(chave);
    const linha = porChave.get(chave) ?? null;
    const valor = linha ? valorDe(linha) : 0;
    return { ...m, linha, valor, faixa: valor > 0 ? faixaDoValor(valor, limites) : null };
  });

  const ranking = municipios
    .filter((m) => m.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  return {
    municipios,
    cores,
    rotulos: rotulosDasFaixas(limites, formatarCurto),
    ranking,
    semCorrespondencia: itens
      .filter((item) => !chavesDoMapa.has(chaveMunicipio(item.municipio)))
      .map((item) => item.municipio),
  };
}

function SeletorMetrica({ valor, onChange }) {
  return (
    <fieldset>
      <legend className="sr-only">O que o mapa mostra</legend>
      <div className="inline-flex rounded-md border border-line-strong bg-surface p-0.5">
        {Object.entries(METRICAS).map(([chave, { rotuloCurto }]) => (
          <label
            key={chave}
            className="cursor-pointer rounded px-3 py-1.5 text-sm font-medium text-ink-soft has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-fdi"
          >
            <input
              type="radio"
              name="metrica-mapa"
              value={chave}
              checked={valor === chave}
              onChange={() => onChange(chave)}
              className="sr-only"
            />
            {rotuloCurto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BuscaNoMapa({ municipios, onEscolher }) {
  const [texto, setTexto] = useState("");

  function aoDigitar(valor) {
    setTexto(valor);
    const chave = chaveMunicipio(valor);
    const encontrado = municipios.find((m) => chaveMunicipio(m.nome) === chave);
    if (encontrado) onEscolher(encontrado.codigo);
  }

  return (
    <div className="max-w-xs">
      <label htmlFor="busca-mapa" className="sr-only">Encontrar município no mapa</label>
      <input
        id="busca-mapa"
        type="search"
        list="municipios-mapa"
        className="field"
        placeholder="Encontrar município no mapa"
        autoComplete="off"
        value={texto}
        onChange={(e) => aoDigitar(e.target.value)}
      />
      <datalist id="municipios-mapa">
        {municipios.map((m) => (
          <option key={m.codigo} value={m.nome} />
        ))}
      </datalist>
    </div>
  );
}

function PainelMunicipio({ ano, municipio, ranking, metrica, onEscolher, onFechar }) {
  const painelRef = useRef(null);
  const codigo = municipio?.codigo;
  const info = METRICAS[metrica];

  // Em telas estreitas o painel fica abaixo do mapa: rola até ele ao selecionar
  useEffect(() => {
    if (!codigo || !window.matchMedia("(max-width: 1023px)").matches) return;
    painelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [codigo]);

  if (!municipio) {
    return (
      <aside aria-label="Maiores valores" className="rounded-lg border border-line bg-surface p-5">
        <h3 className="font-sans text-base font-semibold">
          Maiores valores em {ano}
          <span className="block text-sm font-normal text-ink-soft">{info.rotulo}</span>
        </h3>
        <ol className="mt-3 divide-y divide-line">
          {ranking.slice(0, 8).map((m, i) => (
            <li key={m.codigo}>
              <button
                type="button"
                onClick={() => onEscolher(m.codigo)}
                className="flex w-full cursor-pointer items-baseline gap-3 py-2 text-left hover:text-brand"
              >
                <span className="w-5 text-sm tabular-nums text-ink-muted">{i + 1}</span>
                <span className="flex-1">{m.nome}</span>
                <span className="text-sm tabular-nums">{info.formatar(m.valor)}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-ink-muted">Clique em um município no mapa para ver os detalhes.</p>
      </aside>
    );
  }

  const linha = municipio.linha;
  const posicao = ranking.findIndex((m) => m.codigo === municipio.codigo) + 1;
  const aproveitamento = linha?.potencial > 0 ? METRICAS.potencial.valor(linha) : null;

  return (
    <aside ref={painelRef} aria-live="polite" aria-label={`Detalhes de ${municipio.nome}`} className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Município selecionado</p>
          <h3 className="mt-1 text-2xl font-bold">{municipio.nome}</h3>
        </div>
        <button
          type="button"
          onClick={onFechar}
          className="-mr-2 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-soft hover:bg-black/[0.05]"
        >
          <X size={18} aria-hidden="true" />
          <span className="sr-only">Fechar detalhes</span>
        </button>
      </div>

      {!linha || linha.valorTotal === 0 ? (
        <div className="mt-4 space-y-2 text-ink-soft">
          <p>Os fundos deste município não receberam destinações em {ano}.</p>
          {linha?.destinacaoPf > 0 && (
            <p>
              Mesmo assim, os moradores destinaram {formatarMoeda(linha.destinacaoPf)} a fundos de
              outras cidades ({METRICAS.potencial.formatar(aproveitamento)} do potencial).
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-ink-soft">Recebido pelos fundos em {ano}</p>
          <p className="font-serif text-3xl font-bold tabular-nums">{formatarMoeda(linha.valorTotal)}</p>
          {posicao > 0 && (
            <p className="mt-1 text-sm text-ink-muted">
              {posicao}º de {formatarInteiro(ranking.length)} municípios em {info.rotulo.toLowerCase()}
            </p>
          )}

          <div className="mt-4">
            <FundSplitBar
              fdca={linha.valorFdca}
              fdi={linha.valorFdi}
              percentualFdca={linha.percentualFdca}
              percentualFdi={linha.percentualFdi}
              valorTotal={linha.valorTotal}
              altura="h-2.5"
            />
          </div>
          <dl className="mt-3 space-y-1.5 text-[0.9375rem]">
            <LinhaFundo cor="bg-fdca" rotulo="Criança e Adolescente" valor={linha.valorFdca} percentual={linha.percentualFdca} />
            <LinhaFundo cor="bg-fdi" rotulo="Pessoa Idosa" valor={linha.valorFdi} percentual={linha.percentualFdi} />
          </dl>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            {linha.doacoesTotal != null && <Dado rotulo="Doações" valor={formatarInteiro(linha.doacoesTotal)} />}
            {linha.valorDarf != null && <Dado rotulo="DARFs pagos" valor={formatarMoeda(linha.valorDarf)} />}
            {aproveitamento != null && (
              <Dado rotulo="Moradores: % do potencial" valor={METRICAS.potencial.formatar(aproveitamento)} />
            )}
          </dl>

          {linha.municipioId != null && (
            <Link
              to={`/transparencia/${linha.municipioId}`}
              className="mt-5 inline-flex items-center gap-1.5 font-semibold"
            >
              Ver histórico de todos os anos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </>
      )}
    </aside>
  );
}

// Com dados oficiais só há o percentual de cada fundo; com valores exatos, mostra em reais
function LinhaFundo({ cor, rotulo, valor, percentual }) {
  const texto = valor != null ? formatarMoeda(valor) : percentual != null ? formatarPercentual(percentual) : "—";
  return (
    <div className="flex justify-between gap-3">
      <dt className="flex items-center gap-2 text-ink-soft">
        <span aria-hidden="true" className={`size-2.5 rounded-sm ${cor}`} />
        {rotulo}
      </dt>
      <dd className="tabular-nums">{texto}</dd>
    </div>
  );
}

function Dado({ rotulo, valor }) {
  return (
    <div>
      <dt className="text-ink-muted">{rotulo}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}
