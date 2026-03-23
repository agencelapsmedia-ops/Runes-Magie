'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../ui/Button';

const HERO_IMAGES = [
  '/images/hero/hero-7.png',
  '/images/hero/hero-1.png',
  '/images/hero/hero-2.png',
  '/images/hero/hero-3.png',
  '/images/hero/hero-4.png',
  '/images/hero/hero-5.png',
  '/images/hero/hero-6.png',
];
const SLIDE_INTERVAL = 6000;
const CROSSFADE_DURATION = 1500;

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), CROSSFADE_DURATION);
    },
    [currentIndex, isTransitioning],
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % HERO_IMAGES.length);
  }, [currentIndex, goToSlide]);

  /* Auto-advance */
  useEffect(() => {
    timerRef.current = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide]);

  /* Reset timer on manual navigation */
  const handleDotClick = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    goToSlide(index);
    timerRef.current = setInterval(nextSlide, SLIDE_INTERVAL);
  };

  return (
    <section className="relative w-full h-screen overflow-hidden select-none">
      {/* ---- Slide layers ---- */}
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== currentIndex}
          className="absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: i === currentIndex ? 1 : 0,
            transitionDuration: `${CROSSFADE_DURATION}ms`,
            zIndex: i === currentIndex ? 1 : 0,
          }}
        >
          {/* Background image with subtle parallax zoom */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              animation:
                i === currentIndex
                  ? 'heroZoom 8s ease-in-out forwards'
                  : 'none',
              transform: 'scale(1)',
            }}
          />
        </div>
      ))}

      {/* ---- Dark gradient overlay ---- */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: [
            'linear-gradient(to bottom, rgba(10,10,18,0.35) 0%, rgba(10,10,18,0.10) 35%, rgba(10,10,18,0.50) 70%, rgba(10,10,18,0.92) 100%)',
          ].join(', '),
        }}
      />

      {/* ---- Content overlay ---- */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center">
        {/* Rune banner */}
        <p
          className="mb-4 text-or-ancien tracking-[12px] animate-glow-runes"
          style={{ fontSize: 48, lineHeight: 1 }}
        >
          &#5765;&#5794;&#5799;&#5800;&#5809;&#5810;
        </p>

        {/* Main title */}
        <h1
          className="font-cinzel-decorative font-bold text-gradient-gold leading-none"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          }}
        >
          Runes &amp; Magie
        </h1>

        {/* Subtitle */}
        <p
          className="mt-4 font-cinzel uppercase text-turquoise-cristal tracking-[8px]"
          style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.125rem)' }}
        >
          Boutique-&Eacute;cole
        </p>

        {/* Gold divider */}
        <span
          aria-hidden="true"
          className="mt-6 mb-5 block h-px w-40"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--or-ancien), transparent)',
          }}
        />

        {/* Tagline */}
        <p
          className="max-w-xl font-cormorant italic text-parchemin/80"
          style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)' }}
        >
          Cristaux, Runes, Tarot &amp; Magie Naturelle&nbsp;&mdash; Votre
          Sorci&egrave;re, Noctura Anna
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button variant="primary" size="lg" href="/boutique">
            D&eacute;couvrir la Boutique
          </Button>
          <Button variant="secondary" size="lg" href="/soins">
            R&eacute;server un Soin
          </Button>
        </div>
      </div>

      {/* ---- Navigation dots ---- */}
      <nav
        aria-label="Carousel navigation"
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3"
      >
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === currentIndex ? 'true' : undefined}
            onClick={() => handleDotClick(i)}
            className={[
              'h-2.5 rounded-full transition-all duration-500',
              i === currentIndex
                ? 'w-8 bg-or-ancien shadow-[0_0_8px_rgba(201,168,76,0.6)]'
                : 'w-2.5 bg-parchemin/30 hover:bg-parchemin/60',
            ].join(' ')}
          />
        ))}
      </nav>

      {/* ---- Inline keyframes ---- */}
      <style jsx global>{`
        @keyframes heroZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }

        @keyframes glowRunes {
          0%,
          100% {
            text-shadow: 0 0 8px rgba(201, 168, 76, 0.5),
              0 0 20px rgba(201, 168, 76, 0.25);
          }
          50% {
            text-shadow: 0 0 16px rgba(201, 168, 76, 0.8),
              0 0 40px rgba(201, 168, 76, 0.4),
              0 0 60px rgba(201, 168, 76, 0.15);
          }
        }

        .animate-glow-runes {
          animation: glowRunes 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
