import { formatarMoeda } from "../../utils/format";

// Reprodução simplificada dos campos do DARF, com explicação de cada um (RF03).
export default function DarfPreview({ fundo, valor, anoCalendario, anoDeclaracao }) {
  const campos = [
    {
      n: "01",
      nome: "Nome / telefone",
      valor: "Seu nome",
      explicacao: "Preenchido pelo programa com os dados da declaração.",
    },
    {
      n: "02",
      nome: "Período de apuração",
      valor: `31/12/${anoCalendario}`,
      explicacao: "Último dia do ano a que a declaração se refere.",
    },
    {
      n: "03",
      nome: "CPF",
      valor: "Seu CPF",
      explicacao: "O CPF de quem está declarando.",
    },
    {
      n: "04",
      nome: "Código da receita",
      valor: fundo.codigoReceita,
      explicacao: `Identifica que o pagamento é uma doação ao fundo ${fundo.nomeCurto}. Confira se é este o código na sua guia.`,
      destaque: true,
    },
    {
      n: "05",
      nome: "Número de referência",
      valor: "—",
      explicacao: "Fica em branco.",
    },
    {
      n: "06",
      nome: "Data de vencimento",
      valor: `Prazo final de ${anoDeclaracao}`,
      explicacao: "Último dia do prazo de entrega da declaração. Pague até essa data, em cota única.",
      destaque: true,
    },
    {
      n: "07",
      nome: "Valor do principal",
      valor: formatarMoeda(valor),
      explicacao: "O valor que você destinou a este fundo.",
      destaque: true,
    },
    {
      n: "08 e 09",
      nome: "Multa e juros",
      valor: "—",
      explicacao: "Ficam em branco se você pagar no prazo.",
    },
    {
      n: "10",
      nome: "Valor total",
      valor: formatarMoeda(valor),
      explicacao: "Igual ao valor do principal.",
      destaque: true,
    },
  ];

  return (
    <figure className="overflow-hidden rounded-md border border-line-strong bg-surface">
      <figcaption
        className={`flex flex-wrap items-baseline justify-between gap-2 border-b border-line-strong px-4 py-3 ${
          fundo.cor === "fdca" ? "bg-fdca-tint" : "bg-fdi-tint"
        }`}
      >
        <span className="font-semibold">DARF · {fundo.nomeCurto}</span>
        <span className="text-sm text-ink-soft">Documento de Arrecadação de Receitas Federais</span>
      </figcaption>
      <dl className="divide-y divide-line">
        {campos.map((campo) => (
          <div key={campo.n} className="grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[11rem_9rem_1fr]">
            <dt className="text-sm text-ink-soft">
              <span className="font-mono text-ink-muted">{campo.n}</span> {campo.nome}
            </dt>
            <dd className={`tabular-nums ${campo.destaque ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {campo.valor}
            </dd>
            <dd className="text-sm text-ink-soft">{campo.explicacao}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
