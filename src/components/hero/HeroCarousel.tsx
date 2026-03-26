'use client';

import Button from '../ui/Button';

export default function HeroCarousel() {
  return (
    <section className="relative w-full h-screen overflow-hidden select-none">
      {/* ---- Background image ---- */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hero/hero-7.png')" }} />

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
          <Button variant="secondary" size="lg" href="/reserver">
            R&eacute;server un Soin
          </Button>
        </div>
      </div>

      {/* ---- Inline keyframes ---- */}
      <style jsx global>{`
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
