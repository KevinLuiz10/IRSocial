import { Link } from "react-router-dom";
import { Eye, Info, Map, Route } from "lucide-react";
import HeroCarousel from "../components/home/HeroCarousel";

const features = [
  {
    icon: Info,
    title: "Informação",
    text: "Entenda o que são os fundos sociais e como eles podem receber recursos.",
    link: "/contexto",
  },
  {
    icon: Route,
    title: "Orientação",
    text: "Veja um passo a passo simples para conhecer as possibilidades de destinação.",
    link: "/como-doar",
  },
  {
    icon: Eye,
    title: "Transparência",
    text: "Consulte dados públicos sobre instituições e recursos direcionados.",
    link: "/transparencia",
  },
];

export default function Home() {
  return (
    <>
      <HeroCarousel />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-semibold text-emerald-700">Como o IR Social ajuda</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Informação para aproximar pessoas de causas sociais
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            A plataforma reúne informação, orientação e dados de transparência
            para tornar mais fácil compreender o processo e acompanhar o
            impacto dos recursos.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <Icon className="text-emerald-700" size={32} aria-hidden="true" />
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.text}</p>

                <Link
                  to={feature.link}
                  className="mt-5 inline-block font-semibold text-emerald-700 hover:underline"
                >
                  Acessar seção →
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
