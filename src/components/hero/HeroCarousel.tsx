'use client';

import Image from 'next/image';
import Button from '../ui/Button';

export default function HeroCarousel() {
  return (
    <section className="relative w-full h-screen overflow-hidden select-none">
      {/* ---- Background image (déesse cosmique sur la droite) ----
              next/image avec priority : préchargée + haute priorité + AVIF,
              au lieu d'un background-image CSS découvert tard (mauvais LCP). */}
      <Image
        src="/images/hero/hero-8.webp"
        alt="Déesse cosmique — Runes & Magie"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover object-right"
      />

      {/* ---- Voile dégradé : sombre à gauche (lisibilité du texte),
              transparent au centre, fondu vers le bas pour la section suivante ---- */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(90deg, rgba(10,10,18,0.85) 0%, rgba(10,10,18,0.55) 35%, rgba(10,10,18,0.05) 65%, rgba(10,10,18,0) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,18,0) 0%, rgba(10,10,18,0.85) 100%)',
        }}
      />

      {/* ══════ DESKTOP ══════ */}
      <div className="hidden lg:flex absolute inset-0 z-20 items-center">
        <div className="flex flex-col items-start text-left pl-[7%] pr-8 max-w-[760px]">
          <h1
            className="font-cinzel font-bold text-gradient-gold leading-[0.95] drop-shadow-[0_0_40px_rgba(201,168,76,0.35)]"
            style={{ fontSize: 'clamp(4rem, 8vw, 7.5rem)' }}
          >
            Runes&nbsp;&amp;
            <br />
            Magie
          </h1>

          <p
            className="mt-6 font-cinzel uppercase text-turquoise-cristal tracking-[0.35em]"
            style={{ fontSize: '1.05rem' }}
          >
            Savoir Ancestral&nbsp;&middot;&nbsp;Pouvoir Int&eacute;rieur
          </p>

          <p className="mt-5 font-philosopher text-parchemin/90 text-xl max-w-lg">
            Cours, outils et guidance pour &eacute;veiller ta magie.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Button variant="or" size="lg" href="/ecole">
              D&eacute;couvrir l&apos;&Eacute;cole &amp; les Cours
            </Button>
            <Button variant="secondary" size="lg" href="/boutique">
              Explorer la Boutique&nbsp;&rarr;
            </Button>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE ══════ */}
      <div className="lg:hidden relative z-20 flex h-full flex-col items-center justify-center px-6 text-center gap-4">
        <h1
          className="font-cinzel font-bold text-gradient-gold leading-[0.95] drop-shadow-[0_0_30px_rgba(201,168,76,0.4)]"
          style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}
        >
          Runes&nbsp;&amp;
          <br />
          Magie
        </h1>

        <p className="font-cinzel uppercase text-turquoise-cristal tracking-[0.3em] text-sm">
          Savoir Ancestral&nbsp;&middot;&nbsp;Pouvoir Int&eacute;rieur
        </p>

        <p className="font-philosopher text-parchemin/90 text-lg max-w-xs">
          Cours, outils et guidance pour &eacute;veiller ta magie.
        </p>

        <div className="mt-3 flex flex-col gap-3 w-full max-w-xs">
          <Button variant="or" size="lg" href="/ecole">
            D&eacute;couvrir l&apos;&Eacute;cole &amp; les Cours
          </Button>
          <Button variant="secondary" size="lg" href="/boutique">
            Explorer la Boutique&nbsp;&rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
