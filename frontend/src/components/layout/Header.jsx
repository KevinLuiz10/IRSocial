import { Link, NavLink } from "react-router-dom";
import { HeartHandshake, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "Início" },
  { to: "/contexto", label: "Entenda a doação" },
  { to: "/como-doar", label: "Como fazer" },
  { to: "/transparencia", label: "Mapa de transparência" },
  { to: "/sobre", label: "Sobre o projeto" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-emerald-700"
          aria-label="IR Social - Página inicial"
        >
          <HeartHandshake size={28} aria-hidden="true" />
          <span>IR Social</span>
        </Link>

        <button
          className="rounded-lg p-2 text-slate-700 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav
          className={`${menuOpen ? "block" : "hidden"} absolute left-0 top-full w-full border-b bg-white p-4 md:static md:block md:w-auto md:border-0 md:p-0`}
          aria-label="Navegação principal"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive
                      ? "text-emerald-700"
                      : "text-slate-600 hover:text-emerald-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
