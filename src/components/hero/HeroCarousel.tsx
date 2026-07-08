// Composant serveur : aucun état ni événement côté client → pas d'hydratation
// inutile, donc moins de JavaScript envoyé au navigateur (meilleur TBT).
import Image from 'next/image';
import Button from '../ui/Button';

// Ornement doré : lignes effilées, losanges, points et étoile à 8 branches
// (encadre le sous-titre « La voie des arcanes », flip = version miroir)
function OrnementDore({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 560 48"
      aria-hidden="true"
      className={className}
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path d="M16 24 C 60 21.2, 110 21.2, 152 24 C 110 26.8, 60 26.8, 16 24 Z" fill="#C9A84C" />
      <path d="M544 24 C 500 21.2, 450 21.2, 408 24 C 450 26.8, 500 26.8, 544 24 Z" fill="#C9A84C" />
      <rect x="166" y="18" width="12" height="12" transform="rotate(45 172 24)" fill="none" stroke="#C9A84C" strokeWidth="1.1" />
      <circle cx="172" cy="24" r="1.4" fill="#E8CE7E" />
      <rect x="382" y="18" width="12" height="12" transform="rotate(45 388 24)" fill="none" stroke="#C9A84C" strokeWidth="1.1" />
      <circle cx="388" cy="24" r="1.4" fill="#E8CE7E" />
      <line x1="184" y1="24" x2="234" y2="24" stroke="#C9A84C" strokeWidth="0.7" opacity="0.8" />
      <line x1="326" y1="24" x2="376" y2="24" stroke="#C9A84C" strokeWidth="0.7" opacity="0.8" />
      <circle cx="196" cy="24" r="1.3" fill="#E0BD62" />
      <circle cx="208" cy="24" r="1.8" fill="#E0BD62" />
      <circle cx="220" cy="24" r="2.3" fill="#E0BD62" />
      <circle cx="364" cy="24" r="1.3" fill="#E0BD62" />
      <circle cx="352" cy="24" r="1.8" fill="#E0BD62" />
      <circle cx="340" cy="24" r="2.3" fill="#E0BD62" />
      <path d="M243 24 L248.5 22 L250.5 16.5 L252.5 22 L258 24 L252.5 26 L250.5 31.5 L248.5 26 Z" fill="#F3DD96" />
      <path d="M317 24 L311.5 22 L309.5 16.5 L307.5 22 L302 24 L307.5 26 L309.5 31.5 L311.5 26 Z" fill="#F3DD96" />
      <circle cx="280" cy="24" r="14" fill="none" stroke="#C9A84C" strokeWidth="1.2" />
      <circle cx="280" cy="24" r="10.5" fill="none" stroke="#C9A84C" strokeWidth="0.6" opacity="0.6" />
      <path d="M280 13.5 L282.6 21.4 L290.5 24 L282.6 26.6 L280 34.5 L277.4 26.6 L269.5 24 L277.4 21.4 Z" fill="#E8CE7E" />
      <path d="M274 18 L286 30 M286 18 L274 30" stroke="#C9A84C" strokeWidth="0.8" opacity="0.7" />
      <circle cx="280" cy="6.5" r="1.2" fill="#E8CE7E" />
      <circle cx="280" cy="41.5" r="1.2" fill="#E8CE7E" />
    </svg>
  );
}

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

          {/* Bloc aligné à gauche dans le hero, contenu centré sur la largeur de l'ornement */}
          <div className="mt-5 flex w-[560px] max-w-full flex-col items-center text-center">
            <OrnementDore className="w-full" />
            <p
              className="my-2 font-cinzel font-bold uppercase text-gradient-gold tracking-[0.28em]"
              style={{ fontSize: 'clamp(1.5rem, 2.1vw, 1.85rem)', textIndent: '0.28em' }}
            >
              La voie des arcanes
            </p>
            <OrnementDore flip className="w-full" />
          </div>

          <p
            className="mt-5 font-cinzel uppercase text-turquoise-cristal tracking-[0.35em]"
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

        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <OrnementDore className="w-full" />
          <p
            className="my-1 font-cinzel font-bold uppercase text-gradient-gold tracking-[0.26em] text-xl"
            style={{ textIndent: '0.26em' }}
          >
            La voie des arcanes
          </p>
          <OrnementDore flip className="w-full" />
        </div>

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
