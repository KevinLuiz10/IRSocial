import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { faqData } from "../data/faqData.js";
import { useRequest } from "../hooks/useRequest";
import { listarAnos, obterResumo } from "../services/repasseService";
import { formatarMoeda, formatarMoedaCompacta } from "../utils/format";
import FundSplitBar from "../components/repasses/FundSplitBar";
import Loading from "../components/common/Loading";

const etapas = [
  {
    titulo: "Confira se você pode",
    texto: "Vale para quem declara no modelo completo e entrega no prazo.",
  },
  {
    titulo: "Escolha o fundo",
    texto: "Criança e adolescente, pessoa idosa ou os dois. De qualquer cidade.",
  },
  {
    titulo: "Pague o DARF",
    texto: "O programa da Receita gera a guia. Pague até o fim do prazo de entrega.",
  },
];

export default function Home() {
  return (
    <>
      <title>IR Social: destine parte do seu IR a causas sociais</title>

      <Hero />
      <Etapas />
      <Fundos />
      <ResumoTransparencia />
      <Perguntas />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <h1 className="text-4xl font-bold sm:text-5xl lg:text-[3.5rem]">
            Parte do seu Imposto de Renda pode ficar na sua cidade.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            Na declaração, você pode destinar até 6% do imposto devido aos
            fundos que financiam projetos para crianças, adolescentes e pessoas
            idosas. Sem pagar nada a mais.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/passo-a-passo" className="btn btn-primary">
              Começar o passo a passo
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/entenda" className="btn btn-secondary">
              Entender como funciona
            </Link>
          </div>
        </div>

        <ExemploCalculo />
      </div>
    </section>
  );
}

function ExemploCalculo() {
  const linhas = [
    { rotulo: "Imposto devido na declaração", valor: "R$ 5.000,00" },
    { rotulo: "Fundo da Criança e do Adolescente (3%)", valor: "R$ 150,00", cor: "bg-fdca" },
    { rotulo: "Fundo da Pessoa Idosa (3%)", valor: "R$ 150,00", cor: "bg-fdi" },
  ];

  return (
    <figure className="rounded-lg border border-line bg-surface p-6 shadow-[0_1px_0_var(--color-line)]">
      <figcaption className="eyebrow">Exemplo</figcaption>
      <dl className="mt-4 divide-y divide-line">
        {linhas.map((linha) => (
          <div key={linha.rotulo} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-ink-soft">
              {linha.cor && <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-sm ${linha.cor}`} />}
              {linha.rotulo}
            </dt>
            <dd className="whitespace-nowrap font-semibold tabular-nums">{linha.valor}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 pt-4">
          <dt className="font-semibold">Quanto você paga a mais</dt>
          <dd className="whitespace-nowrap font-serif text-2xl font-bold text-brand">R$ 0,00</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-ink-muted">
        Os R$ 300 saem do imposto que você já deve. Só muda o destino.
      </p>
    </figure>
  );
}

function Etapas() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-bold">Como fazer, em três etapas</h2>
        <Link to="/passo-a-passo" className="font-semibold">
          Ver o passo a passo completo
        </Link>
      </div>

      <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
        {etapas.map((etapa, i) => (
          <li key={etapa.titulo} className="border-t-2 border-ink pt-5">
            <span className="font-serif text-lg font-bold text-ink-muted">{i + 1}.</span>
            <h3 className="mt-1 text-xl font-bold">{etapa.titulo}</h3>
            <p className="mt-2 text-ink-soft">{etapa.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Fundos() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <h2 className="max-w-2xl text-3xl font-bold">Para onde o dinheiro vai</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Cada município pode ter dois fundos, administrados por conselhos com
          participação da sociedade civil.
        </p>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <article className="border-l-4 border-fdca pl-5">
            <h3 className="text-xl font-bold">Fundo dos Direitos da Criança e do Adolescente</h3>
            <p className="mt-1 text-sm font-semibold text-fdca">FDCA · até 3% do imposto devido</p>
            <p className="mt-3 text-ink-soft">
              Financia projetos de proteção, educação, esporte, cultura e
              acolhimento de crianças e adolescentes, aprovados pelo conselho
              municipal (CMDCA).
            </p>
          </article>
          <article className="border-l-4 border-fdi pl-5">
            <h3 className="text-xl font-bold">Fundo dos Direitos da Pessoa Idosa</h3>
            <p className="mt-1 text-sm font-semibold text-fdi">FDI · até 3% do imposto devido</p>
            <p className="mt-3 text-ink-soft">
              Apoia instituições de longa permanência, centros de convivência e
              ações de saúde e cidadania para pessoas idosas, aprovados pelo
              conselho municipal.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

async function buscarResumoMaisRecente() {
  const { anos } = await listarAnos();
  if (!anos.length) return null;
  return obterResumo(anos[0]);
}

function ResumoTransparencia() {
  const { data, error, loading } = useRequest(buscarResumoMaisRecente, "resumo-home");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-bold">Acompanhe os repasses no Paraná</h2>
          <p className="mt-3 text-ink-soft">
            Reunimos os dados da Receita Federal sobre quanto os contribuintes
            de cada município destinaram aos fundos, ano a ano.
          </p>
          <Link to="/transparencia" className="btn btn-secondary mt-6">
            Consultar meu município
          </Link>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6">
          {loading && !data ? (
            <Loading linhas={3} />
          ) : error || !data ? (
            <p className="text-ink-soft">
              Os números ainda não estão disponíveis. Você pode consultar a
              página de transparência mais tarde.
            </p>
          ) : (
            <>
              <p className="text-ink-soft">
                Total destinado em {data.ano} por contribuintes de{" "}
                {data.municipios} {data.municipios === 1 ? "município" : "municípios"}
              </p>
              <p
                className="mt-1 font-serif text-4xl font-bold tabular-nums sm:text-5xl"
                title={formatarMoeda(data.valorTotal)}
              >
                {formatarMoedaCompacta(data.valorTotal)}
              </p>
              <div className="mt-5">
                <FundSplitBar fdca={data.valorFdca} fdi={data.valorFdi} altura="h-3" />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="flex items-center gap-2 text-ink-soft">
                    <span aria-hidden="true" className="size-2.5 rounded-sm bg-fdca" />
                    Criança e Adolescente
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{formatarMoeda(data.valorFdca)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-ink-soft">
                    <span aria-hidden="true" className="size-2.5 rounded-sm bg-fdi" />
                    Pessoa Idosa
                  </dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{formatarMoeda(data.valorFdi)}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Perguntas() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h2 className="text-3xl font-bold">Perguntas frequentes</h2>
      <div className="faq mt-8">
        {faqData.map((item) => (
          <details key={item.pergunta}>
            <summary>{item.pergunta}</summary>
            <div>{item.resposta}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
