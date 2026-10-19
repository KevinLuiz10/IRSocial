import { formatarMoeda } from "../../utils/format";

// O mock/planilhas completas informam valores por fundo; a tabela HTML oficial
// da Receita publica apenas percentuais arredondados. Nunca transforma um
// percentual em valor monetario exato.
export default function FundSplitBar({
  fdca, fdi, percentualFdca, percentualFdi, valorTotal, maximo,
  altura = "h-2.5", rotulo,
}) {
  const comValores = fdca != null && fdi != null;
  const total = comValores ? fdca + fdi : (valorTotal ?? 0);
  const escala = maximo ? Math.min(1, total / maximo) : 1;
  const pctFdca = comValores ? (total ? (fdca / total) * 100 : 0) : (percentualFdca ?? 0);
  const pctFdi = comValores ? (total ? (fdi / total) * 100 : 0) : (percentualFdi ?? 0);
  const descricao = comValores
    ? `Fundo da Criança: ${formatarMoeda(fdca)}; Fundo do Idoso: ${formatarMoeda(fdi)}`
    : `Divisão percentual publicada pela Receita: Criança e Adolescente ${pctFdca.toFixed(1)}%; Pessoa Idosa ${pctFdi.toFixed(1)}%`;

  return (
    <div role="img" aria-label={rotulo ?? descricao} className="w-full">
      <div className={`flex ${altura} gap-0.5`} style={{ width: `${Math.max(escala * 100, total ? 1.5 : 0)}%` }}>
        {pctFdca > 0 && (
          <span className="rounded-l-sm bg-fdca" style={{ width: `${pctFdca}%` }}
            title={comValores ? formatarMoeda(fdca) : `${pctFdca.toFixed(1)}%`} />
        )}
        {pctFdi > 0 && (
          <span className="flex-1 rounded-r-sm bg-fdi"
            title={comValores ? formatarMoeda(fdi) : `${pctFdi.toFixed(1)}%`} />
        )}
      </div>
    </div>
  );
}

export function FundLegend({ className = "" }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft ${className}`}>
      <li className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-fdca" />Criança e Adolescente (FDCA)</li>
      <li className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-sm bg-fdi" />Pessoa Idosa (FDI)</li>
    </ul>
  );
}
