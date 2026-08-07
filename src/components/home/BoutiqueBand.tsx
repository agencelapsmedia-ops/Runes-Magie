import Image from 'next/image';
import Link from 'next/link';
import IconeCategorie from '@/components/ui/IconeCategorie';
import { classeAncrage, type TuileVue } from '@/lib/home-tiles';

/**
 * Bande Boutique pleine largeur, sous la grille de tuiles.
 *
 * Les pastilles sont des repères visuels : elles disent d'un coup d'œil ce
 * qu'on trouve en boutique. Elles mènent toutes à la boutique, qui n'a pas
 * encore de filtre par URL — le jour où elle en aura un, il suffira de changer
 * leur destination dans l'administration, sans toucher au code.
 */
export default function BoutiqueBand({ tuile }: { tuile: TuileVue }) {
  return (
    <div className="mx-auto mt-3 max-w-[1600px] px-4 lg:mt-5">
      <Link
        href={tuile.href}
        className="group relative block overflow-hidden rounded-xl border border-or-ancien/45 transition-all duration-500 hover:border-or-ancien hover:shadow-[0_0_30px_rgba(201,168,76,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-ancien"
      >
        <div className="relative min-h-[220px] w-full lg:min-h-[180px]">
          {tuile.imageUrl ? (
            <Image
              src={tuile.imageUrl}
              alt={tuile.imageAlt}
              fill
              sizes="100vw"
              quality={80}
              className={`object-cover transition-transform duration-700 group-hover:scale-[1.03] ${classeAncrage(tuile.imageFocus)}`}
            />
          ) : (
            <div
              className="h-full w-full bg-[linear-gradient(135deg,#1A1A2E_0%,#2D1B4E_100%)]"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,18,0.94)_0%,rgba(10,10,18,0.7)_50%,rgba(10,10,18,0.3)_100%)]" />

          <div className="relative flex min-h-[220px] flex-col justify-between gap-4 p-5 lg:min-h-[180px] lg:flex-row lg:items-center lg:p-7">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-or-ancien/70 bg-noir-nuit/60 text-or-ancien backdrop-blur-sm lg:h-16 lg:w-16">
                <IconeCategorie nom={tuile.iconKey} taille={28} />
              </span>
              <h3
                className="font-cinzel-decorative font-bold uppercase leading-none text-gradient-gold"
                style={{ fontSize: 'clamp(2rem, 5.5vw, 3.8rem)' }}
              >
                {tuile.title}
              </h3>
            </div>

            {tuile.chips.length > 0 && (
              <ul className="flex flex-wrap items-start gap-x-4 gap-y-3 lg:flex-1 lg:justify-center">
                {tuile.chips.map((pastille) => (
                  <li key={pastille.label} className="flex w-[68px] flex-col items-center text-center lg:w-[80px]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-or-ancien/45 text-or-ancien lg:h-11 lg:w-11">
                      <IconeCategorie nom={pastille.iconKey} taille={20} />
                    </span>
                    <span className="mt-1.5 font-cinzel text-[0.52rem] uppercase leading-tight tracking-[0.1em] text-or-clair/80 lg:text-[0.58rem]">
                      {pastille.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <span
              className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-or-ancien/70 text-or-ancien transition-colors group-hover:bg-or-ancien/10 lg:static lg:h-14 lg:w-14"
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
