import { USANDO_DADOS_DEMONSTRATIVOS } from "../../services/api";

export default function FonteReceita({ ano = 2025 }) {
  if (USANDO_DADOS_DEMONSTRATIVOS) return null;
  return (
    <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
      <strong>Fonte oficial:</strong>{" "}
      <a className="underline" target="_blank" rel="noopener noreferrer"
        href={`https://servicos.receita.fazenda.gov.br/publico/EstatisticaIRPF/doacoesDIRPF_PR_${ano}.HTML`}>
        Receita Federal — Destinações na Declaração, Paraná
      </a>. Os valores são informados pelo endereço do fundo e representam destinações
      declaradas, não necessariamente recursos já aplicados em projetos. A divisão entre
      FDCA e FDI é percentual e arredondada na publicação oficial.
    </p>
  );
}
