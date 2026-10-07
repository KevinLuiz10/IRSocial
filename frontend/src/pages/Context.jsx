export default function Context() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-emerald-700">Entenda a doação</p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        O que são as destinações via Imposto de Renda?
      </h1>

      <div className="mt-8 space-y-6 text-lg leading-8 text-slate-700">
        <p>
          A legislação brasileira permite que determinados contribuintes
          destinem parte do Imposto de Renda devido a fundos sociais autorizados.
          Dessa forma, o recurso pode apoiar políticas públicas e projetos
          voltados à população.
        </p>

        <p>
          Entre os fundos existentes estão os Fundos dos Direitos da Criança e
          do Adolescente e os Fundos dos Direitos da Pessoa Idosa.
        </p>

        <p>
          A destinação não representa necessariamente um imposto adicional. Ela
          corresponde a uma parcela do imposto devido, respeitando as regras e
          limites estabelecidos para cada situação.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-6 text-amber-950">
        <h2 className="font-bold">Atenção</h2>
        <p className="mt-2">
          As regras podem variar conforme o tipo de declaração e o ano
          fiscal. Consulte sempre as orientações oficiais antes de concluir
          sua declaração.
        </p>
      </div>
    </div>
  );
}
