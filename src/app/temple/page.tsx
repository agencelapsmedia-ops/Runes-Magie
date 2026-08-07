import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import RuneDivider from '@/components/ui/RuneDivider';

/**
 * « Le Temple de la Voie des Arcanes » — coquille.
 *
 * La carte du Temple existe sur l'accueil ; il fallait donc que cette adresse
 * réponde, sinon la carte mènerait à une page d'erreur. Le contenu sera
 * construit plus tard : d'ici là, `noindex` évite que Google référence une
 * page vide, et la route est volontairement absente du sitemap.
 */
export const metadata: Metadata = {
  title: 'Le Temple de la Voie des Arcanes',
  description:
    'Le Temple de la Voie des Arcanes ouvrira bientôt ses portes. Inscrivez-vous à l’infolettre pour être prévenue.',
  robots: { index: false, follow: false },
};

export default function TemplePage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 py-24">
      {/* Halo violet, même signature visuelle que les autres pages */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-violet-royal/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl text-center">
        <p className="font-cinzel-decorative text-5xl text-or-ancien/45 select-none" aria-hidden="true">
          ᛏ
        </p>

        <h1 className="mt-6 font-cinzel-decorative text-3xl font-bold uppercase leading-tight tracking-[0.06em] text-gradient-gold md:text-5xl">
          Le Temple de la Voie des Arcanes
        </h1>

        <RuneDivider symbols="ᚨ ᛊ ᚹ" className="my-10" />

        <p className="font-cormorant text-xl italic leading-relaxed text-parchemin-vieilli/80">
          Le Temple ouvrira bientôt ses portes. Sa page se construit en ce moment.
        </p>

        <p className="mt-4 font-cormorant text-lg leading-relaxed text-parchemin-vieilli/60">
          Inscris-toi à l’infolettre pour être prévenue la première, ou viens découvrir
          l’enseignement en attendant.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/infolettre" variant="or" size="lg">
            Être prévenue
          </Button>
          <Button href="/ecole" variant="secondary" size="lg">
            Découvrir l’école
          </Button>
        </div>
      </div>
    </div>
  );
}
