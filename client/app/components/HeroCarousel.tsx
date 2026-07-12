"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "New season arrivals",
    title: "Elevate every corner of your home",
    description:
      "Discover refined essentials that bring comfort, style, and calm to your everyday routine.",
    bg: "bg-gradient-to-br from-stone-900 via-zinc-800 to-amber-700",
    cta: "Shop collection",
  },
  {
    eyebrow: "Fresh favorites",
    title: "Bring timeless style to your daily look",
    description:
      "Explore versatile pieces designed for effortless dressing, all-season comfort, and easy confidence.",
    bg: "bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500",
    cta: "Browse bestsellers",
  },
  {
    eyebrow: "Limited-time deals",
    title: "Save on premium picks before they’re gone",
    description:
      "Enjoy exclusive offers on curated products that blend performance, quality, and modern design.",
    bg: "bg-gradient-to-br from-slate-900 via-slate-700 to-emerald-700",
    cta: "See deals",
  },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setActiveIndex(index);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="relative overflow-hidden rounded-4xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative min-h-105 overflow-hidden sm:min-h-120">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={slide.title}
                className={`absolute inset-0 flex flex-col justify-between p-6 text-white transition-all duration-700 sm:p-8 lg:p-10 ${slide.bg} ${
                  isActive
                    ? "translate-x-0 opacity-100"
                    : index < activeIndex
                      ? "-translate-x-full opacity-0"
                      : "translate-x-full opacity-0"
                }`}
              >
                <div className="max-w-xl">
                  <p className="mb-3 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] backdrop-blur">
                    {slide.eyebrow}
                  </p>
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="mt-4 max-w-lg text-base text-zinc-100 sm:text-lg">
                    {slide.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#shop"
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                  >
                    {slide.cta}
                  </a>
                  <a
                    href="#categories"
                    className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Explore more
                  </a>
                </div>
              </div>
            );
          })}

          <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-2 backdrop-blur">
            <button
              type="button"
              onClick={() =>
                goToSlide((activeIndex - 1 + slides.length) % slides.length)
              }
              className="rounded-full border border-white/30 bg-white/15 p-2 text-lg text-white transition hover:bg-white/25"
              aria-label="Previous slide"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goToSlide((activeIndex + 1) % slides.length)}
              className="rounded-full border border-white/30 bg-white/15 p-2 text-lg text-white transition hover:bg-white/25"
              aria-label="Next slide"
            >
              →
            </button>
          </div>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeIndex === index ? "w-8 bg-white" : "w-2.5 bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-600">
            Fast delivery
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Trusted shipping in 24 hours
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Enjoy seamless checkout and quick delivery for your favorite finds.
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-zinc-900 p-5 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
            Community picks
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Loved by customers across the globe
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Browse the collections most people are talking about this week.
          </p>
        </div>
      </div>
    </div>
  );
}
