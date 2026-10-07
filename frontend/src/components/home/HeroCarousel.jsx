import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { carouselData } from "../../data/carouselData";

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slide = carouselData[current];

  function nextSlide() {
    setCurrent((prev) => (prev + 1) % carouselData.length);
  }

  function previousSlide() {
    setCurrent(
      (prev) => (prev - 1 + carouselData.length) % carouselData.length
    );
  }

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <section
      className={`bg-gradient-to-br ${slide.color} text-white`}
      aria-label="Destaques da plataforma"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex min-h-[500px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-white/80">
            {slide.eyebrow}
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
            {slide.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
            {slide.description}
          </p>

          <Link
            to={slide.link}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            {slide.buttonLabel}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>

          <div className="mt-12 flex items-center gap-4">
            <button
              onClick={previousSlide}
              className="rounded-full border border-white/40 p-2 hover:bg-white/10"
              aria-label="Slide anterior"
            >
              <ChevronLeft />
            </button>

            <div className="flex gap-2" aria-label="Selecionar slide">
              {carouselData.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrent(index)}
                  className={`h-3 w-3 rounded-full ${
                    index === current ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`Ir para o slide ${index + 1}`}
                  aria-current={index === current}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="rounded-full border border-white/40 p-2 hover:bg-white/10"
              aria-label="Próximo slide"
            >
              <ChevronRight />
            </button>

            <span className="sr-only">
              Slide {current + 1} de {carouselData.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
