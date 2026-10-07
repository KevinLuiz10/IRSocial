const steps = [
  {
    number: "01",
    title: "Verifique se você pode realizar a destinação",
    text: "Confira o tipo de declaração e as condições aplicáveis ao seu caso.",
  },
  {
    number: "02",
    title: "Escolha o fundo ou projeto autorizado",
    text: "Consulte os fundos disponíveis e verifique se há dados suficientes sobre sua atuação.",
  },
  {
    number: "03",
    title: "Informe a destinação na declaração",
    text: "Utilize a área específica do programa oficial da declaração do Imposto de Renda.",
  },
  {
    number: "04",
    title: "Emita e pague o documento correspondente",
    text: "Quando necessário, emita a guia e respeite o prazo indicado.",
  },
  {
    number: "05",
    title: "Guarde os comprovantes",
    text: "Mantenha os documentos para consulta e eventual prestação de informações.",
  },
];

export default function HowToDonate() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-emerald-700">Orientação</p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        Como realizar uma destinação
      </h1>

      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
        O processo deve ser realizado conforme as regras da declaração e do
        fundo escolhido. Use este roteiro como guia inicial.
      </p>

      <ol className="mt-12 space-y-5">
        {steps.map((step) => (
          <li
            key={step.number}
            className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span className="text-2xl font-bold text-emerald-700">
              {step.number}
            </span>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {step.title}
              </h2>
              <p className="mt-2 leading-7 text-slate-600">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl bg-slate-900 p-6 text-slate-100">
        <h2 className="text-xl font-bold">Importante</h2>
        <p className="mt-2 leading-7 text-slate-300">
          O IR Social tem finalidade educativa e informativa. A plataforma não
          substitui um contador, a Receita Federal ou os órgãos responsáveis
          pelos fundos.
        </p>
      </div>
    </div>
  );
}
