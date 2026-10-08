// Placeholder em forma de linhas, para a página não "pular" quando os dados chegam.
export default function Loading({ linhas = 3, rotulo = "Carregando dados…" }) {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{rotulo}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="h-4 animate-pulse rounded bg-line/70"
          style={{ width: `${90 - (i % 3) * 18}%` }}
        />
      ))}
    </div>
  );
}
