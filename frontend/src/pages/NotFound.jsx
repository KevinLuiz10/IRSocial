import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <>
      <title>Página não encontrada | IR Social</title>

      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-2 text-4xl font-bold">Não encontramos esta página</h1>
        <p className="mt-4 text-lg text-ink-soft">
          O endereço pode ter mudado ou ter sido digitado errado. Talvez você
          esteja procurando uma destas:
        </p>
        <ul className="mt-6 space-y-2 text-lg">
          <li><Link to="/">Página inicial</Link></li>
          <li><Link to="/passo-a-passo">Passo a passo do DARF</Link></li>
          <li><Link to="/transparencia">Repasses por município</Link></li>
        </ul>
      </div>
    </>
  );
}
