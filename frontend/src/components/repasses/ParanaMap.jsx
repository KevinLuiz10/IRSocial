import { useMemo, useRef, useState } from "react";
import { formatarMoeda } from "../../utils/format";

// Mapa coroplético do Paraná em SVG puro.
// `municipios`: [{ codigo, nome, d, valor, faixa }] (faixa = null quando não há dados)
// `cores`: cor de cada faixa, da mais clara à mais escura.
export default function ParanaMap({
  largura,
  altura,
  municipios,
  cores,
  rotuloMetrica,
  formatarValor = formatarMoeda,
  selecionado,
  onSelecionar,
}) {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);

  const porCodigo = useMemo(
    () => new Map(municipios.map((m) => [m.codigo, m])),
    [municipios]
  );

  // Os 399 contornos só são recriados quando os dados ou as cores mudam,
  // não a cada movimento do mouse.
  const contornos = useMemo(
    () =>
      municipios.map((m) => (
        <path
          key={m.codigo}
          d={m.d}
          data-codigo={m.codigo}
          fill={m.faixa === null ? "url(#sem-dados)" : cores[m.faixa]}
          stroke="#ffffff"
          strokeWidth="0.7"
          strokeLinejoin="round"
          className="cursor-pointer"
        />
      )),
    [municipios, cores]
  );

  function codigoDoEvento(evento) {
    return evento.target?.dataset?.codigo ?? null;
  }

  function aoMover(evento) {
    const codigo = codigoDoEvento(evento);
    if (!codigo || evento.pointerType === "touch") {
      setHover(null);
      return;
    }
    const caixa = containerRef.current.getBoundingClientRect();
    setHover({ codigo, x: evento.clientX - caixa.left, y: evento.clientY - caixa.top, largura: caixa.width });
  }

  const emHover = hover && porCodigo.get(hover.codigo);
  const emSelecao = selecionado && porCodigo.get(selecionado);

  return (
    <div ref={containerRef} className="relative" onPointerLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="block h-auto w-full touch-manipulation select-none"
        role="img"
        aria-label={`Mapa do Paraná com os municípios coloridos por ${rotuloMetrica.toLowerCase()}. A mesma informação está na tabela abaixo.`}
        onPointerMove={aoMover}
        onClick={(e) => {
          const codigo = codigoDoEvento(e);
          if (codigo) onSelecionar(codigo === selecionado ? null : codigo);
        }}
      >
        <defs>
          <pattern id="sem-dados" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#eeebe4" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#cdc8bd" strokeWidth="2" />
          </pattern>
        </defs>

        <g>{contornos}</g>

        {/* Contorno com "halo" branco, visível tanto sobre cores claras quanto escuras */}
        {emHover && hover.codigo !== selecionado && <Destaque d={emHover.d} espessura={1.5} />}
        {emSelecao && <Destaque d={emSelecao.d} espessura={2.5} />}
      </svg>

      {emHover && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 w-max max-w-56 rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-md"
          style={{
            left: hover.x + 14,
            top: hover.y + 14,
            transform: hover.x > hover.largura - 220 ? "translateX(calc(-100% - 28px))" : undefined,
          }}
        >
          <p className="font-semibold text-ink">{emHover.nome}</p>
          <p className="tabular-nums text-ink-soft">
            {emHover.faixa === null ? "Sem destinações no ano" : formatarValor(emHover.valor)}
          </p>
        </div>
      )}
    </div>
  );
}

function Destaque({ d, espessura }) {
  return (
    <g pointerEvents="none" fill="none" strokeLinejoin="round">
      <path d={d} stroke="#ffffff" strokeWidth={espessura + 2.5} />
      <path d={d} stroke="var(--color-ink)" strokeWidth={espessura} />
    </g>
  );
}

export function MapLegend({ rotulos, cores }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-soft">
      {rotulos.map((rotulo, i) => (
        <li key={rotulo} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-5 rounded-sm" style={{ background: cores[i] }} />
          {rotulo}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="h-3 w-5 rounded-sm border border-line-strong"
          style={{ background: "repeating-linear-gradient(45deg, #eeebe4 0 3px, #cdc8bd 3px 5px)" }}
        />
        Sem destinações
      </li>
    </ul>
  );
}
