'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { testimonials } from '@/data/testimonials';

/* ── Floating rune particle ─────────────────────────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  char: string;
  size: number;
  duration: number;
  delay: number;
}

const RUNE_CHARS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-or-ancien' : 'text-gris-fumee'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [expanded, setExpanded] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animatingCards, setAnimatingCards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const VISIBLE_COUNT = 6;
  const visibleTestimonials = expanded
    ? testimonials
    : testimonials.slice(0, VISIBLE_COUNT);

  /* ── Spawn rune particles on "reveal more" ─────────── */
  const spawnParticles = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const newParticles: Particle[] = Array.from({ length: 30 }).map(() => ({
      id: nextId.current++,
      x: Math.random() * rect.width,
      y: rect.height * 0.4 + Math.random() * rect.height * 0.3,
      char: RUNE_CHARS[Math.floor(Math.random() * RUNE_CHARS.length)],
      size: 14 + Math.random() * 22,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.6,
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up after animations finish
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 4500);
  }, []);

  /* ── Handle the magic reveal ───────────────────────── */
  function handleToggle() {
    if (!expanded) {
      // Expanding — trigger magic
      spawnParticles();
      setAnimatingCards(true);
      setTimeout(() => setExpanded(true), 200);
      setTimeout(() => setAnimatingCards(false), 1200);
    } else {
      setExpanded(false);
    }
  }

  /* ── Ambient floating particles ────────────────────── */
  const [ambientParticles, setAmbientParticles] = useState<Particle[]>([]);
  useEffect(() => {
    const ps: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: 1000 + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      char: RUNE_CHARS[Math.floor(Math.random() * RUNE_CHARS.length)],
      size: 12 + Math.random() * 14,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
    }));
    setAmbientParticles(ps);
  }, []);

  return (
    <section className="relative px-4 py-16 md:py-24 overflow-hidden">
      {/* Background mystical glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(107,63,160,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(26,138,125,0.06) 0%, transparent 50%)',
        }}
      />

      {/* Ambient floating rune particles */}
      {ambientParticles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none text-or-ancien/10 select-none animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.char}
        </span>
      ))}

      <div className="max-w-7xl mx-auto relative" ref={containerRef}>
        {/* Section title */}
        <div className="text-center mb-4">
          <h2 className="font-cinzel-decorative text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide text-gradient-gold">
            Paroles Enchant&eacute;es
          </h2>
          <p className="mt-4 text-parchemin-vieilli text-lg md:text-xl italic font-philosopher">
            Ce que nos visiteurs murmurent &agrave; propos de leur exp&eacute;rience
          </p>
        </div>

        {/* Google rating badge */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="flex items-center gap-2 bg-charbon-mystere/80 border border-or-ancien/20 rounded-full px-5 py-2.5 backdrop-blur-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-or-ancien font-cinzel font-bold text-lg">4.8</span>
            <StarRating rating={5} />
            <span className="text-parchemin-vieilli/60 text-sm">/ 5</span>
          </div>
        </div>

        {/* Testimonial grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTestimonials.map((t, i) => {
            const isNewCard = expanded && i >= VISIBLE_COUNT;
            return (
              <div
                key={`${t.name}-${i}`}
                className={`group relative rounded-xl p-6
                  bg-charbon-mystere/60 backdrop-blur-sm
                  border border-violet-royal/20
                  transition-all duration-700 ease-out
                  hover:border-or-ancien/30
                  hover:shadow-[0_0_30px_rgba(201,168,76,0.08),0_0_60px_rgba(107,63,160,0.06)]
                  hover:-translate-y-1
                  ${isNewCard && animatingCards
                    ? 'animate-card-reveal'
                    : isNewCard
                      ? 'animate-fade-in'
                      : ''
                  }`}
                style={
                  isNewCard
                    ? { animationDelay: `${(i - VISIBLE_COUNT) * 0.08}s` }
                    : undefined
                }
              >
                {/* Hover glow orb */}
                <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
                  }}
                />

                {/* Quote mark */}
                <span className="absolute top-3 right-4 text-4xl text-or-ancien/10 font-serif leading-none select-none">
                  &ldquo;
                </span>

                {/* Content */}
                <div className="relative">
                  <StarRating rating={t.rating} />
                  <p className="mt-3 text-parchemin/90 text-sm leading-relaxed font-philosopher line-clamp-4">
                    {t.text}
                  </p>
                  <div className="mt-4 pt-3 border-t border-violet-royal/15 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Avatar initial */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-mystique to-teal-magique flex items-center justify-center text-xs font-bold text-white">
                        {t.name.charAt(0)}
                      </div>
                      <span className="text-sm font-cinzel text-parchemin font-medium">
                        {t.name}
                      </span>
                    </div>
                    <span className="text-xs text-parchemin-vieilli/50">
                      {t.date}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Magic reveal button */}
        {testimonials.length > VISIBLE_COUNT && (
          <div className="mt-12 text-center relative">
            <button
              onClick={handleToggle}
              className="group relative inline-flex items-center gap-3 px-8 py-3.5
                font-cinzel font-semibold text-sm tracking-wider uppercase
                text-or-ancien
                border border-or-ancien/30
                rounded-full
                overflow-hidden
                transition-all duration-500
                hover:border-or-ancien/60
                hover:shadow-[0_0_30px_rgba(201,168,76,0.15),0_0_60px_rgba(201,168,76,0.08)]
                active:scale-95"
            >
              {/* Background sweep on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-violet-profond/40 via-or-ancien/10 to-violet-profond/40 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />

              {/* Inner glow pulse */}
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
                }}
              />

              {/* Rune decorations */}
              <span className="relative text-lg opacity-60 transition-all duration-500 group-hover:opacity-100 group-hover:rotate-12 group-hover:scale-110">
                {expanded ? 'ᛜ' : 'ᛟ'}
              </span>

              <span className="relative">
                {expanded ? 'Voiler les murmures' : 'Reveler plus de murmures'}
              </span>

              <span className="relative text-lg opacity-60 transition-all duration-500 group-hover:opacity-100 group-hover:-rotate-12 group-hover:scale-110">
                {expanded ? 'ᛜ' : 'ᛟ'}
              </span>
            </button>
          </div>
        )}

        {/* Explosion particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute pointer-events-none select-none text-or-ancien animate-rune-burst"
            style={{
              left: p.x,
              top: p.y,
              fontSize: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.char}
          </span>
        ))}
      </div>
    </section>
  );
}
