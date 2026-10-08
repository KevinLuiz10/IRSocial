export default function ErrorMessage({ titulo = "Não foi possível carregar os dados", erro, onRetry }) {
  return (
    <div role="alert" className="rounded-md border-l-4 border-danger bg-danger-tint p-4">
      <p className="font-semibold text-danger">{titulo}</p>
      {erro?.message && <p className="mt-1 text-ink-soft">{erro.message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary mt-3">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
