import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import DemoNotice from "../components/repasses/DemoNotice";
import FonteReceita from "../components/repasses/FonteReceita";
import FundSplitBar, { FundLegend } from "../components/repasses/FundSplitBar";
import { useRequest } from "../hooks/useRequest";
import { obterHistoricoMunicipio } from "../services/repasseService";
import {
  formatarData,
  formatarInteiro,
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNomeMunicipio,
} from "../utils/format";

const variacao = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

export default function MunicipalityDetail() {
  const { municipioId } = useParams();
  const { state } = useLocation();
  const { data, error, retry } = useRequest(
    () => obterHistoricoMunicipio(municipioId),
    `municipio-${municipioId}`
  );

  const linkVoltar = `/transparencia${state?.voltar ?? ""}`;
  const nome = data ? formatarNomeMunicipio(data.municipio.nome) : "";

  return (
    <>
      <title>{nome ? `${nome} | Repasses | IR Social` : "Repasses | IR Social"}</title>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link to={linkVoltar} className="no-print inline-flex items-center gap-1.5 font-semibold">
          <ArrowLeft size={18} aria-hidden="true" />
          Todos os municípios
        </Link>

        {error ? (
          <div className="mt-8">
            <ErrorMessage
              titulo="Não foi possível carregar este município"
              erro={error}
              onRetry={error.status === 404 ? undefined : retry}
            />
          </div>
        ) : !data ? (
          <div className="mt-8">
            <Loading linhas={6} />
          </div>
        ) : (
          <Conteudo nome={nome} {...data} />
        )}
      </div>
    </>
  );
}

function Conteudo({ nome, historico, ultimaAtualizacao }) {
  const soma = (campo) => historico.reduce((t, h) => t + h[campo], 0);
  const oficiais = historico.some((h) => h.percentualFdca != null);
  const totalFdca = oficiais ? null : soma("valorFdca");
  const totalFdi = oficiais ? null : soma("valorFdi");
  const totalDestinado = soma("valorTotal");
  const totalDarf = soma("valorDarf");
  const totalDoacoes = soma("doacoesTotal");
  const maior = Math.max(...historico.map((h) => h.valorTotal), 0);
  const primeiro = historico[0]?.ano;
  const ultimo = historico.at(-1)?.ano;
  const periodo = primeiro === ultimo ? `${primeiro}` : `${primeiro} a ${ultimo}`;

  return (
    <>
      <p className="eyebrow mt-8">Município do Paraná</p>
      <h1 className="mt-1 text-4xl font-bold sm:text-5xl">{nome}</h1>
      <p className="mt-3 text-ink-soft">
        Última atualização dos dados: {formatarData(ultimaAtualizacao)}
      </p>

      <div className="mt-6">
        <DemoNotice />
        <FonteReceita ano={ultimo || 2025} />
      </div>

      {historico.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-line-strong p-8 text-center text-ink-soft">
          Ainda não há repasses registrados para este município.
        </p>
      ) : (
        <>
          <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {(oficiais ? [
              { rotulo: `Total declarado de ${periodo}`, valor: formatarMoedaCompacta(totalDestinado), completo: formatarMoeda(totalDestinado) },
              { rotulo: "Doações declaradas", valor: formatarInteiro(totalDoacoes) },
              { rotulo: "DARFs pagos", valor: formatarMoedaCompacta(totalDarf), completo: formatarMoeda(totalDarf) },
            ] : [
              { rotulo: `Total de ${periodo}`, valor: formatarMoedaCompacta(totalFdca + totalFdi), completo: formatarMoeda(totalFdca + totalFdi) },
              { rotulo: "Criança e Adolescente", valor: formatarMoedaCompacta(totalFdca), completo: formatarMoeda(totalFdca), cor: "bg-fdca" },
              { rotulo: "Pessoa Idosa", valor: formatarMoedaCompacta(totalFdi), completo: formatarMoeda(totalFdi), cor: "bg-fdi" },
            ]).map((item) => (
              <div key={item.rotulo} className="bg-surface p-5">
                <dt className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
                  {item.cor && <span aria-hidden="true" className={`size-2.5 rounded-sm ${item.cor}`} />}
                  {item.rotulo}
                </dt>
                <dd className="mt-1 font-serif text-2xl font-bold tabular-nums" title={item.completo || item.valor}>
                  {item.valor}
                </dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="titulo-linha-tempo" className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="titulo-linha-tempo" className="text-2xl font-bold">Ano a ano</h2>
              <FundLegend />
            </div>
            {oficiais && <p className="mt-3 text-sm text-ink-muted">
              Valores totais oficiais; divisão entre os fundos apenas em percentuais arredondados.
            </p>}

            <div
              aria-hidden="true"
              className="mt-6 hidden grid-cols-[4rem_1fr_28rem] gap-x-4 pb-2 text-sm font-semibold text-ink-soft md:grid"
            >
              <span>Ano</span>
              <span />
              <span className="grid grid-cols-3 gap-2 text-right">
                <span>Criança</span>
                <span>Idoso</span>
                <span>Total</span>
              </span>
            </div>
            <ol className="border-t-2 border-ink max-md:mt-6">
              {[...historico].reverse().map((h) => {
                const anterior = historico.find((x) => x.ano === h.ano - 1);
                const mudanca = anterior?.valorTotal ? h.valorTotal / anterior.valorTotal - 1 : null;

                return (
                  <li
                    key={h.ano}
                    className="grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-2 border-b border-line py-4 md:grid-cols-[4rem_1fr_9rem_9rem_10rem]"
                  >
                    <span className="font-serif text-xl font-bold">{h.ano}</span>
                    <div className="self-center">
                      <FundSplitBar fdca={h.valorFdca} fdi={h.valorFdi}
                        percentualFdca={h.percentualFdca} percentualFdi={h.percentualFdi}
                        valorTotal={h.valorTotal} maximo={maior} altura="h-4" />
                    </div>
                    <dl className="col-span-2 grid grid-cols-3 gap-2 text-sm md:col-span-3 md:text-[0.9375rem]">
                      <div className="md:text-right">
                        <dt className="text-ink-muted md:sr-only">Criança</dt>
                        <dd className="tabular-nums">{oficiais ? `${h.percentualFdca.toFixed(1)}%` : formatarMoeda(h.valorFdca)}</dd>
                        {h.doacoesFdca > 0 && (
                          <dd className="text-xs text-ink-muted">{formatarInteiro(h.doacoesFdca)} doações</dd>
                        )}
                      </div>
                      <div className="md:text-right">
                        <dt className="text-ink-muted md:sr-only">Idoso</dt>
                        <dd className="tabular-nums">{oficiais ? `${h.percentualFdi.toFixed(1)}%` : formatarMoeda(h.valorFdi)}</dd>
                        {h.doacoesFdi > 0 && (
                          <dd className="text-xs text-ink-muted">{formatarInteiro(h.doacoesFdi)} doações</dd>
                        )}
                      </div>
                      <div className="text-right">
                        <dt className="text-ink-muted md:sr-only">Total</dt>
                        <dd className="font-semibold tabular-nums">{formatarMoeda(h.valorTotal)}</dd>
                        {mudanca !== null && (
                          <dd className="text-xs text-ink-muted">
                            {variacao.format(mudanca)} sobre {h.ano - 1}
                          </dd>
                        )}
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="mt-12 max-w-2xl rounded-md border border-line bg-surface p-5">
            <h2 className="font-sans text-base font-semibold">Quer saber como o dinheiro foi usado?</h2>
            <p className="mt-1 text-ink-soft">
              Os projetos financiados são aprovados pelos conselhos municipais
              (CMDCA e Conselho da Pessoa Idosa). As atas e editais costumam
              ser publicados no portal da transparência da prefeitura.
            </p>
          </aside>
        </>
      )}
    </>
  );
}
