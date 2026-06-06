'use client';

import Button from '../ui/Button';

// Textes par défaut (identiques à l'historique). Ils sont surchargés par le
// contenu éditable de la page d'accueil (modèle « accueil »), passé en props
// depuis src/app/page.tsx.
export interface HeroContent {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroButton1Label?: string;
  heroButton1Href?: string;
  heroButton2Label?: string;
  heroButton2Href?: string;
}

const DEFAULTS = {
  heroTitle: 'Runes &\nMagie',
  heroSubtitle: 'Savoir Ancestral · Pouvoir Intérieur',
  heroDescription: 'Cours, outils et guidance pour éveiller ta magie.',
  heroButton1Label: 'Découvrir l’École & les Cours',
  heroButton1Href: '/ecole',
  heroButton2Label: 'Explorer la Boutique →',
  heroButton2Href: '/boutique',
};

export default function HeroCarousel(props: HeroContent) {
  const c = { ...DEFAULTS, ...stripUndefined(props) };

  return (
    <section className="relative w-full h-screen overflow-hidden select-none">
      {/* ---- Background image (déesse cosmique sur la droite) ---- */}
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: "url('/images/hero/hero-8.webp')",
          backgroundPosition: 'right center',
        }}
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
            className="font-cinzel font-bold text-gradient-gold leading-[0.95] whitespace-pre-line drop-shadow-[0_0_40px_rgba(201,168,76,0.35)]"
            style={{ fontSize: 'clamp(4rem, 8vw, 7.5rem)' }}
          >
            {c.heroTitle}
          </h1>

          <p
            className="mt-6 font-cinzel uppercase text-turquoise-cristal tracking-[0.35em]"
            style={{ fontSize: '1.05rem' }}
          >
            {c.heroSubtitle}
          </p>

          <p className="mt-5 font-philosopher text-parchemin/90 text-xl max-w-lg">
            {c.heroDescription}
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Button variant="or" size="lg" href={c.heroButton1Href}>
              {c.heroButton1Label}
            </Button>
            <Button variant="secondary" size="lg" href={c.heroButton2Href}>
              {c.heroButton2Label}
            </Button>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE ══════ */}
      <div className="lg:hidden relative z-20 flex h-full flex-col items-center justify-center px-6 text-center gap-4">
        <h1
          className="font-cinzel font-bold text-gradient-gold leading-[0.95] whitespace-pre-line drop-shadow-[0_0_30px_rgba(201,168,76,0.4)]"
          style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}
        >
          {c.heroTitle}
        </h1>

        <p className="font-cinzel uppercase text-turquoise-cristal tracking-[0.3em] text-sm">
          {c.heroSubtitle}
        </p>

        <p className="font-philosopher text-parchemin/90 text-lg max-w-xs">
          {c.heroDescription}
        </p>

        <div className="mt-3 flex flex-col gap-3 w-full max-w-xs">
          <Button variant="or" size="lg" href={c.heroButton1Href}>
            {c.heroButton1Label}
          </Button>
          <Button variant="secondary" size="lg" href={c.heroButton2Href}>
            {c.heroButton2Label}
          </Button>
        </div>
      </div>
    </section>
  );
}

// Évite que des props `undefined` n'écrasent les valeurs par défaut.
function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
