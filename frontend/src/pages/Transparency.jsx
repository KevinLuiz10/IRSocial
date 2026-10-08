import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import DemoNotice from "../components/repasses/DemoNotice";
import FundSplitBar, { FundLegend } from "../components/repasses/FundSplitBar";
import { useRequest } from "../hooks/useRequest";
import { listarAnos, listarRepasses, obterResumo } from "../services/repasseService";
import {
  formatarData,
  formatarInteiro,
  formatarMoeda,
  formatarMoedaCompacta,
  formatarNomeMunicipio,
} from "../utils/format";

const POR_PAGINA = 20;

export default function Transparency() {
  const [params, setParams] = useSearchParams();
  const anos = useRequest(listarAnos, "anos");

  const ano = params.get("ano") || anos.data?.anos[0] || "";
  const busca = params.get("busca") ?? "";
  const ordem = params.get("ordem") === "municipio" ? "municipio" : "valor";
  const pagina = Math.max(1, Number(params.get("pagina")) || 1);

  // Qualquer filtro novo volta para a página 1
  function alterarFiltro(chave, valor) {
    setParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (valor) novo.set(chave, valor);
        else novo.delete(chave);
        if (chave !== "pagina") novo.delete("pagina");
        return novo;
      },
      { replace: chave === "busca" }
    );
  }

  return (
    <>
      <title>Repasses por município | IR Social</title>

      <PageHeader eyebrow="Transparência" titulo="Quanto cada município do Paraná recebeu">
        Valores que os contribuintes destinaram aos fundos da criança e do
        idoso pela declaração do Imposto de Renda, segundo dados da Receita
        Federal.
        {anos.data?.ultimaAtualizacao && (
          <span className="mt-3 block text-[0.9375rem] text-ink-muted">
            Última atualização dos dados: {formatarData(anos.data.ultimaAtualizacao)}
          </span>
        )}
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <DemoNotice />

        {anos.error && !anos.data ? (
          <ErrorMessage erro={anos.error} onRetry={anos.retry} />
        ) : !ano ? (
          <Loading linhas={4} />
        ) : (
          <>
            <ResumoAno ano={ano} />

            <section aria-labelledby="titulo-lista">
              <h2 id="titulo-lista" className="sr-only">Repasses por município</h2>

              <Filtros
                anos={anos.data?.anos ?? []}
                ano={ano}
                busca={busca}
                ordem={ordem}
                onChange={alterarFiltro}
              />

              <ListaRepasses
                ano={ano}
                busca={busca}
                ordem={ordem}
                pagina={pagina}
                onPagina={(p) => alterarFiltro("pagina", p > 1 ? String(p) : "")}
              />
            </section>
          </>
        )}
      </div>
    </>
  );
}

function ResumoAno({ ano }) {
  const { data, error, loading, retry } = useRequest(() => obterResumo(ano), `resumo-${ano}`);

  if (error) return <ErrorMessage erro={error} onRetry={retry} />;
  if (!data || (loading && data.ano !== Number(ano))) {
    return (
      <div className="h-[9.5rem]">
        <Loading linhas={3} />
      </div>
    );
  }

  const indicadores = [
    { rotulo: `Total destinado em ${data.ano}`, valor: data.valorTotal, destaque: true },
    { rotulo: "Criança e Adolescente", valor: data.valorFdca, cor: "bg-fdca" },
    { rotulo: "Pessoa Idosa", valor: data.valorFdi, cor: "bg-fdi" },
  ];

  return (
    <section aria-labelledby="titulo-resumo">
      <h2 id="titulo-resumo" className="sr-only">Resumo de {data.ano}</h2>
      <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {indicadores.map((item) => (
          <div key={item.rotulo} className="bg-surface p-5">
            <dt className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
              {item.cor && <span aria-hidden="true" className={`size-2.5 rounded-sm ${item.cor}`} />}
              {item.rotulo}
            </dt>
            <dd
              className={`mt-1 font-serif font-bold tabular-nums ${item.destaque ? "text-3xl" : "text-2xl"}`}
              title={formatarMoeda(item.valor)}
            >
              {formatarMoedaCompacta(item.valor)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <FundSplitBar fdca={data.valorFdca} fdi={data.valorFdi} altura="h-2" />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Soma de {formatarInteiro(data.municipios)} municípios com repasse no ano.
      </p>
    </section>
  );
}

function Filtros({ anos, ano, busca, ordem, onChange }) {
  // O campo de busca tem estado próprio e só atualiza a URL após uma pausa na digitação
  const [texto, setTexto] = useState(busca);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function digitar(valor) {
    setTexto(valor);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange("busca", valor.trim()), 350);
  }

  return (
    <div className="no-print grid gap-4 border-b border-line pb-6 sm:grid-cols-[1fr_9rem_13rem]">
      <div>
        <label htmlFor="busca" className="block text-[0.9375rem] font-semibold">
          Buscar município
        </label>
        <div className="relative mt-1.5">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="busca"
            type="search"
            className="field pl-10"
            placeholder="Ex.: Londrina"
            autoComplete="off"
            value={texto}
            onChange={(e) => digitar(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ano" className="block text-[0.9375rem] font-semibold">
          Ano
        </label>
        <select id="ano" className="field mt-1.5" value={ano} onChange={(e) => onChange("ano", e.target.value)}>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ordem" className="block text-[0.9375rem] font-semibold">
          Ordenar por
        </label>
        <select
          id="ordem"
          className="field mt-1.5"
          value={ordem}
          onChange={(e) => onChange("ordem", e.target.value === "municipio" ? "municipio" : "")}
        >
          <option value="valor">Maior valor total</option>
          <option value="municipio">Nome do município</option>
        </select>
      </div>
    </div>
  );
}

function ListaRepasses({ ano, busca, ordem, pagina, onPagina }) {
  const location = useLocation();
  const chave = JSON.stringify({ ano, busca, ordem, pagina });
  const { data, error, loading, retry } = useRequest(
    () => listarRepasses({ ano, busca, ordem: ordem === "municipio" ? "municipio" : "valor_total", pagina, limite: POR_PAGINA }),
    chave
  );

  if (error) return <div className="mt-6"><ErrorMessage erro={error} onRetry={retry} /></div>;
  if (!data) return <div className="mt-6"><Loading linhas={8} /></div>;

  const { itens, total } = data;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const inicio = total ? (pagina - 1) * POR_PAGINA + 1 : 0;
  const fim = Math.min(pagina * POR_PAGINA, total);
  const maior = Math.max(...itens.map((i) => i.valorTotal), 0);
  const voltar = { voltar: location.search };

  return (
    <div className={`transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p aria-live="polite" className="text-[0.9375rem] text-ink-soft">
          {total === 0
            ? "Nenhum município encontrado"
            : total === 1
              ? "1 município encontrado"
              : `Mostrando ${inicio}–${fim} de ${formatarInteiro(total)} municípios`}
        </p>
        <FundLegend />
      </div>

      {total === 0 ? (
        <div className="rounded-md border border-dashed border-line-strong p-8 text-center">
          <p className="font-semibold">Nenhum resultado para “{busca}” em {ano}.</p>
          <p className="mt-1 text-ink-soft">
            Confira a grafia ou digite só parte do nome. Pode ser também que o
            município não tenha recebido destinações nesse ano.
          </p>
        </div>
      ) : (
        <>
          {/* Telas médias e grandes: tabela */}
          <table className="hidden w-full border-collapse text-left md:table">
            <caption className="sr-only">
              Repasses aos fundos por município em {ano}, página {pagina} de {totalPaginas}
            </caption>
            <thead>
              <tr className="border-b-2 border-ink text-sm text-ink-soft">
                <th scope="col" className="py-2 pr-4 font-semibold">Município</th>
                <th scope="col" className="w-[26%] py-2 pr-4 font-semibold">
                  <span className="sr-only">Distribuição entre os fundos</span>
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Criança e Adolescente</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Pessoa Idosa</th>
                <th scope="col" className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.municipioId} className="border-b border-line hover:bg-surface">
                  <th scope="row" className="py-3 pr-4 font-medium">
                    <Link to={`/transparencia/${item.municipioId}`} state={voltar}>
                      {formatarNomeMunicipio(item.municipio)}
                    </Link>
                  </th>
                  <td className="py-3 pr-4">
                    <FundSplitBar fdca={item.valorFdca} fdi={item.valorFdi} maximo={maior} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatarMoeda(item.valorFdca)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{formatarMoeda(item.valorFdi)}</td>
                  <td className="py-3 text-right font-semibold tabular-nums">{formatarMoeda(item.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Celulares: lista */}
          <ul className="divide-y divide-line border-y border-line md:hidden">
            {itens.map((item) => (
              <li key={item.municipioId} className="py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Link to={`/transparencia/${item.municipioId}`} state={voltar} className="font-semibold">
                    {formatarNomeMunicipio(item.municipio)}
                  </Link>
                  <span className="font-semibold tabular-nums">{formatarMoeda(item.valorTotal)}</span>
                </div>
                <div className="mt-2">
                  <FundSplitBar fdca={item.valorFdca} fdi={item.valorFdi} maximo={maior} />
                </div>
                <dl className="mt-2 flex flex-wrap gap-x-5 text-sm text-ink-soft">
                  <div className="flex gap-1">
                    <dt>Criança:</dt>
                    <dd className="tabular-nums">{formatarMoeda(item.valorFdca)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>Idoso:</dt>
                    <dd className="tabular-nums">{formatarMoeda(item.valorFdi)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 && (
            <nav aria-label="Paginação" className="no-print mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pagina <= 1}
                onClick={() => onPagina(pagina - 1)}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Anterior
              </button>
              <span className="text-[0.9375rem] text-ink-soft">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pagina >= totalPaginas}
                onClick={() => onPagina(pagina + 1)}
              >
                Próxima
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
