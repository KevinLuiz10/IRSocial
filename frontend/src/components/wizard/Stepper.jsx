import { Check } from "lucide-react";

// Indicador de progresso (RNF03): mostra etapas concluídas, a atual e as próximas.
// Etapas já visitadas podem ser reabertas (RF04).
export default function Stepper({ etapas, atual, maxAlcancada, onIr }) {
  return (
    <nav aria-label="Etapas do passo a passo" className="no-print">
      <p className="text-sm font-medium text-ink-soft md:hidden">
        Etapa {atual + 1} de {etapas.length}: <span className="text-ink">{etapas[atual].titulo}</span>
      </p>
      <div className="mt-2 flex h-1.5 gap-1 md:hidden" aria-hidden="true">
        {etapas.map((etapa, i) => (
          <span
            key={etapa.id}
            className={`flex-1 rounded-full ${i <= atual ? "bg-brand" : "bg-line"}`}
          />
        ))}
      </div>

      <ol className="hidden md:flex md:gap-2">
        {etapas.map((etapa, i) => {
          const concluida = i < atual || (i <= maxAlcancada && i !== atual);
          const ehAtual = i === atual;
          const clicavel = i <= maxAlcancada && !ehAtual;

          const conteudo = (
            <>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  ehAtual
                    ? "border-brand bg-brand text-white"
                    : concluida
                      ? "border-brand bg-brand-tint text-brand"
                      : "border-line-strong bg-surface text-ink-muted"
                }`}
              >
                {concluida ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-sm leading-tight ${ehAtual ? "font-semibold text-ink" : "text-ink-soft"}`}>
                {etapa.titulo}
                <span className="sr-only">
                  {ehAtual ? " (etapa atual)" : concluida ? " (concluída)" : " (pendente)"}
                </span>
              </span>
            </>
          );

          return (
            <li
              key={etapa.id}
              className={`flex-1 border-t-[3px] pt-3 ${i <= atual ? "border-brand" : "border-line"}`}
              aria-current={ehAtual ? "step" : undefined}
            >
              {clicavel ? (
                <button
                  type="button"
                  onClick={() => onIr(i)}
                  className="flex w-full cursor-pointer items-start gap-2 rounded text-left hover:underline"
                >
                  {conteudo}
                </button>
              ) : (
                <div className="flex items-start gap-2">{conteudo}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
