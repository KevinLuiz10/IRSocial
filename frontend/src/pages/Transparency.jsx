import { useMemo, useState } from "react";
import TransparencyMap from "../components/map/TransparencyMap";
import { institutionsMock } from "../data/institutionsMock";

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Transparency() {
  const [fundType, setFundType] = useState("Todos");
  const [selected, setSelected] = useState(null);

  const filteredInstitutions = useMemo(() => {
    if (fundType === "Todos") return institutionsMock;

    return institutionsMock.filter(
      (institution) => institution.fundType === fundType
    );
  }, [fundType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-emerald-700">Transparência</p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        Mapa de instituições e recursos
      </h1>

      <p className="mt-5 max-w-3xl leading-7 text-slate-600">
        Consulte dados demonstrativos sobre fundos e instituições. Na versão
        integrada ao backend, essas informações poderão ser carregadas de bases
        públicas e atualizadas periodicamente.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label htmlFor="fundType" className="font-semibold">
          Filtrar por fundo:
        </label>

        <select
          id="fundType"
          value={fundType}
          onChange={(event) => setFundType(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-3"
        >
          <option>Todos</option>
          <option>Criança e Adolescente</option>
          <option>Pessoa Idosa</option>
        </select>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <TransparencyMap
          institutions={filteredInstitutions}
          onSelect={setSelected}
        />

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Detalhes</h2>

          {selected ? (
            <div className="mt-5 space-y-3">
              <h3 className="font-bold text-emerald-700">
                {selected.name}
              </h3>

              <p className="text-sm text-slate-600">
                {selected.city} - {selected.state}
              </p>

              <p>
                <span className="font-semibold">Tipo:</span>{" "}
                {selected.fundType}
              </p>

              <p>
                <span className="font-semibold">Valor:</span>{" "}
                {formatCurrency(selected.amount)}
              </p>

              <p>
                <span className="font-semibold">Última atualização:</span>{" "}
                {new Date(selected.lastUpdate).toLocaleDateString("pt-BR")}
              </p>

              <p className="text-sm leading-6 text-slate-600">
                {selected.description}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-slate-600">
              Selecione um marcador no mapa para visualizar os detalhes.
            </p>
          )}

          <p className="mt-8 text-xs leading-5 text-slate-500">
            Os dados exibidos nesta versão são demonstrativos e deverão ser
            substituídos por informações reais após a integração com o backend.
          </p>
        </aside>
      </div>
    </div>
  );
}
