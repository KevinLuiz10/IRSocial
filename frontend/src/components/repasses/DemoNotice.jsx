import { USANDO_DADOS_DEMONSTRATIVOS } from "../../services/api";

export default function DemoNotice() {
  if (!USANDO_DADOS_DEMONSTRATIVOS) return null;

  return (
    <p className="rounded-md border border-attention/30 bg-attention-tint px-4 py-3 text-sm text-attention">
      <strong>Dados demonstrativos.</strong> Os valores abaixo são fictícios e
      servem apenas para testar a interface enquanto a API de repasses não
      está disponível.
    </p>
  );
}
