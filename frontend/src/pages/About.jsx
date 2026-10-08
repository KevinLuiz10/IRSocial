import { Link } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import { creditoAcademico, equipe } from "../data/equipe";

export default function About() {
  return (
    <>
      <title>Sobre o projeto | IR Social</title>

      <PageHeader eyebrow="Sobre" titulo="Por que o IR Social existe">
        Pouca gente sabe que pode destinar parte do imposto a causas sociais, e
        quem sabe costuma travar no programa da Receita. Queremos mudar as
        duas coisas.
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2">
          <section className="prose-ir">
            <h2 className="!mt-0">O problema</h2>
            <p>
              O processo de destinação exige navegar por fichas pouco
              intuitivas e gerar um DARF sem orientação visual. A insegurança
              faz muita gente desistir.
            </p>
            <p>
              Depois de doar, acompanhar o destino do dinheiro também é
              difícil: os dados ficam espalhados em portais de cada prefeitura,
              em formatos técnicos.
            </p>
          </section>

          <section className="prose-ir">
            <h2 className="!mt-0">O que fazemos</h2>
            <ul>
              <li>
                <Link to="/entenda">Explicamos</Link> como a destinação funciona,
                sem termos técnicos.
              </li>
              <li>
                <Link to="/passo-a-passo">Guiamos</Link> o preenchimento no
                programa e a conferência do DARF.
              </li>
              <li>
                <Link to="/transparencia">Reunimos</Link> os dados da Receita
                Federal sobre os repasses a cada município do Paraná.
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-14 grid gap-12 border-t border-line pt-12 md:grid-cols-2">
          <div className="prose-ir">
            <h2 className="!mt-0">O que não fazemos</h2>
            <ul>
              <li>Não pedimos login, CPF ou qualquer dado pessoal.</li>
              <li>Não guardamos o que você digita no passo a passo.</li>
              <li>Não recebemos nem intermediamos doações.</li>
              <li>Não substituímos um contador nem as orientações oficiais.</li>
            </ul>
          </div>

          <div className="prose-ir">
            <h2 className="!mt-0">De onde vêm os dados</h2>
            <p>
              Os valores da página de transparência vêm de planilhas publicadas
              pela Receita Federal com as destinações feitas na declaração,
              por município e por fundo. Elas são importadas para o nosso banco
              de dados sempre que há uma nova versão.
            </p>
          </div>
        </section>

        {(equipe.length > 0 || creditoAcademico) && (
          <section className="mt-14 border-t border-line pt-12">
            <h2 className="text-2xl font-bold">Equipe</h2>
            {creditoAcademico && <p className="mt-2 text-ink-soft">{creditoAcademico}</p>}
            {equipe.length > 0 && (
              <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {equipe.map((pessoa) => (
                  <li key={pessoa.nome}>
                    <span className="font-semibold">{pessoa.nome}</span>
                    {pessoa.papel && <span className="block text-ink-soft">{pessoa.papel}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  );
}
