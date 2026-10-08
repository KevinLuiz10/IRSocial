import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "../common/Logo";

const links = [
  { to: "/", label: "Início", end: true },
  { to: "/entenda", label: "Entenda" },
  { to: "/passo-a-passo", label: "Passo a passo" },
  { to: "/transparencia", label: "Transparência" },
  { to: "/sobre", label: "Sobre" },
];

export default function Header() {
  const { pathname } = useLocation();
  // Guarda em qual página o menu foi aberto: ao navegar, ele fecha sozinho.
  const [abertoEm, setAbertoEm] = useState(null);
  const menuAberto = abertoEm === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-serif text-xl font-bold text-ink no-underline"
        >
          <Logo className="size-8" />
          IR Social
        </Link>

        <button
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-ink md:hidden"
          onClick={() => setAbertoEm(menuAberto ? null : pathname)}
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
        >
          {menuAberto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span className="sr-only">{menuAberto ? "Fechar menu" : "Abrir menu"}</span>
        </button>

        <nav
          id="menu-principal"
          aria-label="Navegação principal"
          className={`${menuAberto ? "block" : "hidden"} absolute inset-x-0 top-16 border-b border-line bg-paper px-4 pb-4 md:static md:block md:border-0 md:bg-transparent md:p-0`}
        >
          <ul className="flex flex-col md:flex-row md:items-center md:gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block border-b border-line py-3 text-[0.9375rem] font-medium no-underline md:rounded-md md:border-0 md:px-3 md:py-2 ${
                      isActive
                        ? "text-brand md:bg-brand-tint"
                        : "text-ink-soft hover:text-ink md:hover:bg-black/[0.04]"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
