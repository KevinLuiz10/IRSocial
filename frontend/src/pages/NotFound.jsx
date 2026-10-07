import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-8xl font-bold text-emerald-700">404</p>

      <h1 className="mt-6 text-3xl font-bold text-slate-900">
        Página não encontrada
      </h1>

      <p className="mt-4 text-slate-600">
        A página que você tentou acessar não existe ou foi movida.
      </p>

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar para a página inicial
      </Link>
    </div>
  );
}
