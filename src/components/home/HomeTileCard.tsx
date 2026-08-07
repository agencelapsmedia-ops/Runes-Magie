import Image from 'next/image';
import Link from 'next/link';
import IconeCategorie from '@/components/ui/IconeCategorie';
import { classeAncrage, type TuileVue } from '@/lib/home-tiles';

/**
 * Une carte de la grille de l'accueil : image de fond, voile, pastille d'icône,
 * titre, et une marque de clic — bouton « Découvrir » sur ordinateur, chevron
 * au pouce sur téléphone.
 *
 * Toute la carte est un lien : la cible de clic fait la surface entière, ce qui
 * compte beaucoup sur mobile.
 */
export default function HomeTileCard({ tuile }: { tuile: TuileVue }) {
  return (
    <Link
      href={tuile.href}
      className="group relative block overflow-hidden rounded-xl border border-or-ancien/45 transition-all duration-500 hover:border-or-ancien hover:shadow-[0_0_26px_rgba(201,168,76,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-ancien"
    >
      <div className="relative aspect-[16/10] w-full lg:aspect-[2/1]">
        {tuile.imageUrl ? (
          <Image
            src={tuile.imageUrl}
            alt={tuile.imageAlt}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            quality={80}
            className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${classeAncrage(tuile.imageFocus)}`}
          />
        ) : (
          <div
            className="h-full w-full bg-[linear-gradient(135deg,#1A1A2E_0%,#2D1B4E_100%)]"
            aria-hidden="true"
          />
        )}

        {/* Voile : dense à gauche, où vivent l'icône et le titre. */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,18,0.9)_0%,rgba(10,10,18,0.6)_45%,rgba(10,10,18,0.15)_100%)]" />
      </div>

      {/* Pastille d'icône */}
      <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-or-ancien/70 bg-noir-nuit/70 text-or-ancien backdrop-blur-sm lg:h-12 lg:w-12">
        <IconeCategorie nom={tuile.iconKey} taille={22} />
      </span>

      {/* Titre + marque de clic */}
      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-cinzel-decorative text-base font-bold leading-tight text-or-clair drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] lg:text-xl">
            {tuile.title}
          </h3>
          {tuile.subtitle && (
            <p className="mt-0.5 font-cinzel text-[0.58rem] uppercase leading-tight tracking-[0.16em] text-or-clair/75 lg:text-[0.68rem]">
              {tuile.subtitle}
            </p>
          )}

          {/* Ordinateur : bouton encadré. */}
          <span className="mt-2 hidden items-center gap-2 rounded-sm border border-or-ancien/60 px-3 py-1.5 font-cinzel text-[0.6rem] uppercase tracking-[0.16em] text-or-ancien transition-colors group-hover:border-or-ancien group-hover:bg-or-ancien/10 lg:inline-flex">
            Découvrir
            <span aria-hidden="true">→</span>
          </span>
        </div>

        {/* Téléphone : chevron rond, atteignable au pouce. */}
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-or-ancien/70 bg-noir-nuit/70 text-or-ancien backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
