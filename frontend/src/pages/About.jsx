import { HeartHandshake, Users, Target } from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-emerald-700">Sobre o projeto</p>

      <h1 className="mt-3 text-4xl font-bold text-slate-900">
        Informação para fortalecer a cidadania
      </h1>

      <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
        O IR Social é uma plataforma acadêmica criada para orientar os
        contribuintes sobre a destinação de parte do Imposto de Renda devido a
        fundos sociais e ampliar a transparência sobre a aplicação desses
        recursos.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Target
            className="text-emerald-700"
            size={32}
            aria-hidden="true"
          />

          <h2 className="mt-5 text-xl font-bold">Nosso objetivo</h2>

          <p className="mt-3 leading-7 text-slate-600">
            Tornar o processo mais simples, acessível e compreensível para a
            população.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <HeartHandshake
            className="text-emerald-700"
            size={32}
            aria-hidden="true"
          />

          <h2 className="mt-5 text-xl font-bold">Impacto social</h2>

          <p className="mt-3 leading-7 text-slate-600">
            Incentivar a participação social e fortalecer fundos que apoiam
            crianças, adolescentes e pessoas idosas.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Users
            className="text-emerald-700"
            size={32}
            aria-hidden="true"
          />

          <h2 className="mt-5 text-xl font-bold">Trabalho em equipe</h2>

          <p className="mt-3 leading-7 text-slate-600">
            Projeto desenvolvido por estudantes do curso de Análise e
            Desenvolvimento de Sistemas.
          </p>
        </article>
      </div>

      <div className="mt-12 rounded-2xl bg-emerald-50 p-6">
        <h2 className="text-2xl font-bold text-emerald-900">
          Equipe responsável
        </h2>

        <p className="mt-3 leading-7 text-emerald-950">
          Esta seção pode ser atualizada posteriormente com os nomes dos
          integrantes, instituição de ensino, disciplina e professor
          responsável.
        </p>
      </div>
    </div>
  );
}
