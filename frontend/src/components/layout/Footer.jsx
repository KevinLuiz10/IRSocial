import { Link } from "react-router-dom";
import Logo from "../common/Logo";

const navegacao = [
  { to: "/entenda", label: "Entenda a destinação" },
  { to: "/passo-a-passo", label: "Passo a passo do DARF" },
  { to: "/transparencia", label: "Repasses por município" },
  { to: "/sobre", label: "Sobre o projeto" },
];

const fontes = [
  { href: "https://www.gov.br/receitafederal/pt-br", label: "Receita Federal" },
  {
    href: "https://www.gov.br/mdh/pt-br",
    label: "Ministério dos Direitos Humanos e da Cidadania",
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-[#eeebe3] text-ink-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-serif text-lg font-bold text-ink no-underline"
          >
            <Logo className="size-7" />
            IR Social
          </Link>
          <p className="mt-3 max-w-sm text-[0.9375rem]">
            Orientação para destinar parte do Imposto de Renda aos fundos da
            criança e do idoso, e transparência sobre os repasses no Paraná.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="text-sm font-semibold font-sans text-ink">Navegação</h2>
          <ul className="mt-3 space-y-2 text-[0.9375rem]">
            {navegacao.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-ink-soft hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold font-sans text-ink">Fontes oficiais</h2>
          <ul className="mt-3 space-y-2 text-[0.9375rem]">
            {fontes.map((fonte) => (
              <li key={fonte.href}>
                <a
                  href={fonte.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-soft hover:text-ink"
                >
                  {fonte.label}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-ink-muted sm:px-6">
          Projeto acadêmico, sem vínculo com a Receita Federal. Confira sempre as
          regras do ano da sua declaração nas fontes oficiais.
        </p>
      </div>
    </footer>
  );
}
