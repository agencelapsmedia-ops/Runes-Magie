// Composant serveur : aucun état ni événement → pas d'hydratation inutile.
import Image from 'next/image';
import OrnementDore from './OrnementDore';
import BoutonTelechargerApp from '@/components/pwa/BoutonTelechargerApp';

/**
 * Hero de l'accueil « application ».
 *
 * Deux différences avec HeroCarousel, qui reste en réserve :
 *
 * 1. **Pas de `h-screen`.** La grille de tuiles doit être visible dès le
 *    premier écran — c'est tout l'intérêt de la refonte. Un hero pleine
 *    hauteur la repousserait sous la ligne de flottaison.
 * 2. **Pas de boutons d'appel.** Les tuiles jouent ce rôle, et bien mieux :
 *    neuf destinations lisibles d'un coup d'œil au lieu de deux.
 *    Seule exception : le bouton « Télécharger l'application » (PWA) — une
 *    affordance d'installation, pas une navigation, rendue nulle quand le
 *    navigateur n'offre pas l'installation.
 *
 * La marge négative compense la navbar transparente du layout ; le `pt`
 * interne empêche le titre de passer dessous.
 */
export default function HeroCompact() {
  return (
    <section className="relative min-h-[58vh] w-full select-none overflow-hidden lg:min-h-[64vh]">
      {/* Image de fond (déesse cosmique à droite). `priority` : c'est le LCP. */}
      <Image
        src="/images/hero/hero-8.webp"
        alt="Déesse cosmique — Runes & Magie"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover object-right"
      />

      {/* Voile : sombre à gauche pour la lisibilité, fondu vers le bas pour
          enchaîner sans couture avec la grille de tuiles. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,18,0.55)_0%,rgba(10,10,18,0.35)_40%,rgba(10,10,18,0.95)_100%)] lg:bg-[linear-gradient(90deg,rgba(10,10,18,0.92)_0%,rgba(10,10,18,0.65)_45%,rgba(10,10,18,0.15)_80%),linear-gradient(180deg,transparent_60%,rgba(10,10,18,0.9)_100%)]" />

      {/* ══════ ORDINATEUR ══════ */}
      <div className="absolute inset-0 z-20 hidden items-center lg:flex">
        <div className="flex max-w-[760px] flex-col items-start pl-[7%] pr-8 pt-20 text-left">
          <h1
            className="font-cinzel font-bold leading-[0.95] text-gradient-gold drop-shadow-[0_0_40px_rgba(201,168,76,0.35)]"
            style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
          >
            Runes&nbsp;&amp;
            <br />
            Magie
          </h1>

          <div className="mt-4 flex w-[520px] max-w-full flex-col items-center text-center">
            <OrnementDore className="w-full" />
            <p
              className="my-2 font-cinzel font-bold uppercase tracking-[0.28em] text-gradient-gold"
              style={{ fontSize: 'clamp(1.2rem, 1.7vw, 1.5rem)', textIndent: '0.28em' }}
            >
              La voie des arcanes
            </p>
            <OrnementDore flip className="w-full" />
          </div>

          <p className="mt-4 font-cinzel text-[0.95rem] uppercase tracking-[0.35em] text-turquoise-cristal">
            Savoir Ancestral&nbsp;&middot;&nbsp;Pouvoir Int&eacute;rieur
          </p>

          <p className="mt-4 max-w-lg font-philosopher text-lg text-parchemin/90">
            Cours, outils et guidance pour &eacute;veiller ta magie.
          </p>

          <div className="mt-6">
            <BoutonTelechargerApp />
          </div>
        </div>
      </div>

      {/* ══════ TÉLÉPHONE ══════ */}
      <div className="relative z-20 flex min-h-[58vh] flex-col items-center justify-center gap-3 px-6 pt-20 text-center lg:hidden">
        <h1
          className="font-cinzel font-bold leading-[0.95] text-gradient-gold drop-shadow-[0_0_30px_rgba(201,168,76,0.4)]"
          style={{ fontSize: 'clamp(2.6rem, 12vw, 4rem)' }}
        >
          Runes&nbsp;&amp;
          <br />
          Magie
        </h1>

        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <OrnementDore className="w-full" />
          <p
            className="my-1 font-cinzel text-lg font-bold uppercase tracking-[0.26em] text-gradient-gold"
            style={{ textIndent: '0.26em' }}
          >
            La voie des arcanes
          </p>
          <OrnementDore flip className="w-full" />
        </div>

        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-turquoise-cristal">
          Savoir Ancestral&nbsp;&middot;&nbsp;Pouvoir Int&eacute;rieur
        </p>

        <p className="max-w-xs font-philosopher text-base text-parchemin/90">
          Cours, outils et guidance pour &eacute;veiller ta magie.
        </p>

        <div className="mt-2">
          <BoutonTelechargerApp />
        </div>
      </div>
    </section>
  );
}
