import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";

const secoes = [
  { id: "o-que-e", titulo: "O que é a destinação" },
  { id: "custo", titulo: "Quanto custa para você" },
  { id: "quem-pode", titulo: "Quem pode destinar" },
  { id: "fundos", titulo: "Os dois fundos" },
  { id: "uso", titulo: "Como o dinheiro é usado" },
  { id: "prazos", titulo: "Prazos e cuidados" },
];

export default function Context() {
  return (
    <>
      <title>Entenda a destinação | IR Social</title>

      <PageHeader eyebrow="Entenda" titulo="Como funciona a destinação do Imposto de Renda">
        Uma explicação sem juridiquês sobre o que é, quem pode fazer e para
        onde vai o dinheiro.
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Nesta página" className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">Nesta página</p>
          <ol className="mt-3 space-y-2 border-l border-line text-[0.9375rem]">
            {secoes.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-l border-transparent pl-4 text-ink-soft no-underline hover:border-ink hover:text-ink"
                >
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="prose-ir max-w-[68ch] [&_h2]:scroll-mt-24 [&>h2:first-child]:mt-0">
          <h2 id="o-que-e">O que é a destinação</h2>
          <p>
            Todo ano, quem declara o Imposto de Renda calcula quanto imposto
            deve ao governo federal. A lei permite que uma parte desse valor,
            em vez de ir para os cofres da União, seja enviada diretamente a
            fundos que financiam políticas para{" "}
            <strong>crianças, adolescentes e pessoas idosas</strong>.
          </p>
          <p>
            Isso é feito no próprio programa da declaração, na ficha{" "}
            <strong>“Doações Diretamente na Declaração”</strong>. O programa
            gera uma guia de pagamento (o DARF) com o valor escolhido.
          </p>

          <h2 id="custo">Quanto custa para você</h2>
          <p>
            <strong>Nada a mais.</strong> O valor destinado é abatido do
            imposto devido. Na prática:
          </p>
          <ul>
            <li>
              se a sua declaração tem <strong>imposto a pagar</strong>, ele
              diminui no mesmo valor da doação;
            </li>
            <li>
              se a sua declaração tem <strong>restituição</strong>, ela
              aumenta no mesmo valor da doação.
            </li>
          </ul>
          <p>
            A diferença é que você paga o DARF da doação antes, até o fim do
            prazo de entrega, e recebe o valor de volta no ajuste.
          </p>
          <div className="rounded-md border border-line bg-surface p-5">
            <p className="font-semibold text-ink">Exemplo</p>
            <p className="mt-2">
              Ana tem R$ 4.000,00 de imposto devido e R$ 1.000,00 a restituir.
              Ela destina R$ 120,00 (3%) ao fundo da criança e paga esse DARF.
              A restituição dela passa a ser de R$ 1.120,00. No fim, Ana não
              gastou nada a mais.
            </p>
          </div>

          <h2 id="quem-pode">Quem pode destinar</h2>
          <p>Para destinar pela declaração, você precisa:</p>
          <ul>
            <li>
              declarar pelo <strong>modelo completo</strong> (deduções
              legais). Quem usa o desconto simplificado não tem a opção;
            </li>
            <li>
              entregar a declaração <strong>dentro do prazo</strong>;
            </li>
            <li>
              ter <strong>imposto devido</strong> maior que zero.
            </li>
          </ul>
          <p>
            Não sabe qual modelo usar? O programa da Receita mostra, no resumo
            da declaração, qual opção é mais vantajosa para você.
          </p>

          <h2 id="fundos">Os dois fundos</h2>
          <h3>Fundo dos Direitos da Criança e do Adolescente (FDCA)</h3>
          <p>
            Previsto no Estatuto da Criança e do Adolescente. Recebe até{" "}
            <strong>3% do imposto devido</strong>. Pode ser nacional,
            estadual ou municipal.
          </p>
          <h3>Fundo dos Direitos da Pessoa Idosa (FDI)</h3>
          <p>
            Previsto no Estatuto da Pessoa Idosa. Também recebe até{" "}
            <strong>3% do imposto devido</strong>, e pode ser nacional,
            estadual ou municipal.
          </p>
          <p>
            Você pode destinar a um, aos dois, e escolher fundos de cidades
            diferentes. Se já fez doações incentivadas durante o ano, o limite
            disponível pode ser menor; o programa faz essa conta.
          </p>

          <h2 id="uso">Como o dinheiro é usado</h2>
          <p>
            Cada fundo é administrado por um <strong>conselho de direitos</strong>,
            formado por representantes do poder público e da sociedade civil.
            O conselho define prioridades, abre editais e aprova os projetos
            de entidades registradas que vão receber os recursos.
          </p>
          <p>
            Você pode acompanhar quanto os contribuintes de cada município do
            Paraná destinaram na{" "}
            <Link to="/transparencia">página de transparência</Link>.
          </p>

          <h2 id="prazos">Prazos e cuidados</h2>
          <ul>
            <li>
              O DARF da doação deve ser pago em <strong>cota única</strong>{" "}
              até o último dia do prazo de entrega da declaração, mesmo que
              você parcele o restante do imposto.
            </li>
            <li>
              Se o DARF não for pago, a destinação é desconsiderada e o valor
              volta a compor o imposto devido.
            </li>
            <li>
              Guarde o comprovante de pagamento junto com o recibo da
              declaração.
            </li>
          </ul>

          <div className="mt-10 rounded-md border-l-4 border-attention bg-attention-tint p-5">
            <p className="font-semibold text-attention">Confira as regras do seu ano</p>
            <p className="mt-1 text-ink-soft">
              Limites e prazos podem mudar. Antes de concluir, confira as
              orientações da{" "}
              <a href="https://www.gov.br/receitafederal/pt-br" target="_blank" rel="noreferrer">
                Receita Federal
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
              .
            </p>
          </div>

          <p className="pt-6">
            <Link to="/passo-a-passo" className="btn btn-primary no-underline">
              Fazer o passo a passo
            </Link>
          </p>
        </article>
      </div>
    </>
  );
}
