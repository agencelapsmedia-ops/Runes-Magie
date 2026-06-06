import Link from 'next/link';

export const dynamic = 'force-dynamic';

/**
 * Module « Gestion site web » — hub extensible.
 * Pour ajouter une future carte (bannières, pages, SEO…), ajoute une
 * entrée dans le tableau `cards` ci-dessous.
 */
const cards = [
  {
    rune: 'ᛟ',
    label: 'Pages du site',
    href: '/admin/site/pages',
    desc: 'Créer des pages à partir d’un modèle et modifier les textes (héros de l’accueil, à-propos…).',
  },
  {
    rune: 'ᛗ',
    label: 'Gestion du menu',
    href: '/admin/site/menu',
    desc: 'Liens du menu du haut et du pied de page : ajouter, réordonner, masquer.',
  },
  {
    rune: 'ᛜ',
    label: 'Sliders de l’accueil',
    href: '/admin/site/sliders',
    desc: 'Carrousels de l’accueil : titre libre + catégories à afficher.',
  },
];

export default function SiteHubPage() {
  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="font-cinzel text-xs tracking-widest uppercase text-violet-profond/50 hover:text-violet-profond transition-colors"
        >
          ← Tableau de bord
        </Link>
        <h1 className="font-cinzel-decorative text-3xl text-violet-profond mt-2 mb-1">Gestion site web</h1>
        <p className="font-cormorant italic text-lg text-gray-500">
          Navigation et structure du site public
        </p>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex items-start gap-4 bg-charbon-mystere border border-violet-royal/40 rounded-lg p-6 transition-all duration-300 hover:border-or-ancien/60 hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]"
          >
            <span className="text-4xl text-or-ancien select-none leading-none">{c.rune}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-cinzel text-lg text-parchemin group-hover:text-or-ancien transition-colors">
                {c.label}
              </h3>
              <p className="font-cormorant text-sm text-parchemin-vieilli/70 mt-1">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
