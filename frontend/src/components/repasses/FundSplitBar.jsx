import { formatarMoeda } from "../../utils/format";

// Barra horizontal dividida entre FDCA (azul) e FDI (âmbar).
// `maximo` permite comparar barras entre si (largura proporcional ao maior total).
export default function FundSplitBar({ fdca, fdi, maximo, altura = "h-2.5", rotulo }) {
  const total = fdca + fdi;
  const escala = maximo ? total / maximo : 1;
  const pctFdca = total ? (fdca / total) * 100 : 0;

  return (
    <div
      role="img"
      aria-label={
        rotulo ??
        `Fundo da Criança: ${formatarMoeda(fdca)}; Fundo do Idoso: ${formatarMoeda(fdi)}`
      }
      className="w-full"
    >
      <div
        className={`flex ${altura} gap-0.5`}
        style={{ width: `${Math.max(escala * 100, total ? 1.5 : 0)}%` }}
      >
        {fdca > 0 && (
          <span
            className="rounded-l-sm bg-fdca"
            style={{ width: `${pctFdca}%` }}
            title={`Criança e Adolescente: ${formatarMoeda(fdca)}`}
          />
        )}
        {fdi > 0 && (
          <span
            className="flex-1 rounded-r-sm bg-fdi"
            title={`Pessoa Idosa: ${formatarMoeda(fdi)}`}
          />
        )}
      </div>
    </div>
  );
}

export function FundLegend({ className = "" }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft ${className}`}>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3 rounded-sm bg-fdca" />
        Criança e Adolescente (FDCA)
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3 rounded-sm bg-fdi" />
        Pessoa Idosa (FDI)
      </li>
    </ul>
  );
}
