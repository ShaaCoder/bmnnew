'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { HeroSlide } from '@/app/page';

type HeroSliderProps = {
  slides: HeroSlide[];
};

export default function HeroSlider({
  slides,
}: HeroSliderProps) {
  const [current, setCurrent] = useState(0);

  const totalSlides = slides.length;

  /* =======================================================
     AUTO SLIDE
  ======================================================= */

  useEffect(() => {
    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) =>
        prev === totalSlides - 1
          ? 0
          : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides]);

  /* =======================================================
     SAFETY
  ======================================================= */

  if (!slides || slides.length === 0) {
    return null;
  }

  const slide =
    slides[current] || slides[0];

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const previousSlide = () => {
    setCurrent((prev) =>
      prev === 0
        ? totalSlides - 1
        : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrent((prev) =>
      prev === totalSlides - 1
        ? 0
        : prev + 1
    );
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-green-950">

      {/* =================================================
          BACKGROUND IMAGES
      ================================================= */}

      {slides.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === current
              ? 'opacity-100'
              : 'opacity-0'
          }`}
          style={{
            backgroundImage: item.image_url
              ? `url("${item.image_url}")`
              : undefined,
          }}
        />
      ))}

      {/* =================================================
          OVERLAY
      ================================================= */}

      <div className="hero-overlay absolute inset-0" />

      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        key={slide.id}
        className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-in fade-in duration-700"
      >

        {/* BADGE */}

        {slide.badge && (
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/40 text-green-300 text-xs font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm">

            <Award className="w-3.5 h-3.5" />

            {slide.badge}

          </div>
        )}

        {/* TITLE */}

        <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">

          {slide.title}

          {slide.highlight && (
            <span className="block text-green-400">
              {slide.highlight}
            </span>
          )}

        </h1>

        {/* DESCRIPTION */}

        {slide.description && (
          <p className="text-green-100/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            {slide.description}
          </p>
        )}

        {/* BUTTONS */}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {/* PRIMARY */}

          {slide.button_text && (
            <Link
              href={
                slide.button_link ||
                '/products'
              }
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 hover:gap-3 text-sm shadow-lg shadow-green-900/30"
            >
              {slide.button_text}

              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* SECONDARY */}

          {slide.secondary_button_text && (
            <Link
              href={
                slide.secondary_button_link ||
                '/gallery'
              }
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium px-8 py-4 rounded-xl transition-all duration-200 backdrop-blur-sm text-sm"
            >
              {slide.secondary_button_text}
            </Link>
          )}

        </div>

      </div>

      {/* =================================================
          PREVIOUS BUTTON
      ================================================= */}

      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={previousSlide}
            aria-label="Previous hero slide"
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* =================================================
              NEXT BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next hero slide"
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/20 hover:bg-black/40 border border-white/20 text-white flex items-center justify-center backdrop-blur-sm transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* =================================================
              DOTS
          ================================================= */}

          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">

            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setCurrent(index)
                }
                aria-label={`Go to slide ${
                  index + 1
                }`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === current
                    ? 'w-8 bg-green-400'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}

          </div>
        </>
      )}

      {/* =================================================
          SCROLL INDICATOR
      ================================================= */}

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-10">

        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">

          <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />

        </div>

      </div>

    </section>
  );
}