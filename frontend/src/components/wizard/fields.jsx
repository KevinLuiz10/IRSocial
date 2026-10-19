function MensagemErro({ id, erro }) {
  if (!erro) return null;
  return (
    <p id={id} className="mt-2 flex gap-2 font-medium text-danger">
      <span aria-hidden="true">!</span>
      <span>{erro}</span>
    </p>
  );
}

// Grupo de opções com <fieldset> + <input type="radio"> nativos
export function RadioGroup({ nome, legenda, ajuda, opcoes, valor, onChange, erro }) {
  const idErro = `${nome}-erro`;
  const idAjuda = `${nome}-ajuda`;

  return (
    <fieldset
      id={nome}
      aria-describedby={[ajuda && idAjuda, erro && idErro].filter(Boolean).join(" ") || undefined}
      className={erro ? "border-l-4 border-danger pl-4" : ""}
    >
      <legend className="text-lg font-semibold">{legenda}</legend>
      {ajuda && <p id={idAjuda} className="mt-1 text-ink-soft">{ajuda}</p>}
      <MensagemErro id={idErro} erro={erro} />

      <div className="mt-3 grid gap-2">
        {opcoes.map((opcao) => (
          <label
            key={opcao.valor}
            className={`flex cursor-pointer gap-3 rounded-md border bg-surface p-3.5 ${
              valor === opcao.valor ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-strong"
            }`}
          >
            <input
              type="radio"
              name={nome}
              value={opcao.valor}
              checked={valor === opcao.valor}
              onChange={() => onChange(opcao.valor)}
              className="mt-1 size-[1.125rem] shrink-0 accent-brand"
            />
            <span>
              <span className="block font-medium">{opcao.rotulo}</span>
              {opcao.descricao && (
                <span className="block text-[0.9375rem] text-ink-soft">{opcao.descricao}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextField({ id, rotulo, ajuda, erro, prefixo, className = "", ...props }) {
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;

  return (
    <div className={erro ? `border-l-4 border-danger pl-4 ${className}` : className}>
      <label htmlFor={id} className="block font-semibold">
        {rotulo}
      </label>
      {ajuda && <p id={idAjuda} className="mt-0.5 text-[0.9375rem] text-ink-soft">{ajuda}</p>}
      <MensagemErro id={idErro} erro={erro} />
      <div className="relative mt-2">
        {prefixo && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted"
          >
            {prefixo}
          </span>
        )}
        <input
          id={id}
          className={`field ${prefixo ? "pl-10" : ""}`}
          aria-invalid={erro ? "true" : undefined}
          aria-describedby={[ajuda && idAjuda, erro && idErro].filter(Boolean).join(" ") || undefined}
          {...props}
        />
      </div>
    </div>
  );
}

// Resumo de erros no topo do formulário, com links para cada campo
export function ErrorSummary({ erros, rotulos, ref }) {
  const entradas = Object.entries(erros);
  if (!entradas.length) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-md border-2 border-danger bg-danger-tint p-4 outline-none"
    >
      <p className="font-semibold text-danger">
        {entradas.length === 1 ? "Corrija 1 item para continuar" : `Corrija ${entradas.length} itens para continuar`}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {entradas.map(([campo]) => (
          <li key={campo}>
            <a href={`#${campo}`} className="text-danger underline">
              {rotulos[campo] ?? campo}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
