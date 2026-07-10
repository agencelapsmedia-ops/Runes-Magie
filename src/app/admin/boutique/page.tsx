import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = {
  gold: 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40',
  alert: 'bg-[#FCD34D]/15 text-[#FCD34D] border-[#FCD34D]/40',
  muted: 'bg-white/5 text-parchemin-vieilli/60 border-white/10',
  teal: 'bg-[#2EC4B6]/15 text-[#2EC4B6] border-[#2EC4B6]/40',
};

export default async function BoutiqueHubPage() {
  const [orderCount, productCount, inStockCount, categoryCount, syncedCategories, pendingQueue] =
    await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.product.count({ where: { inStock: true } }),
      prisma.category.count(),
      prisma.category.count({ where: { cloverCategoryId: { not: null } } }),
      prisma.cloverSyncQueue.count({ where: { status: 'PENDING' } }),
    ]);

  const cards = [
    {
      rune: 'ᚲ',
      label: 'Commandes',
      href: '/admin/commandes',
      desc: 'Commandes de la boutique, statuts et suivi.',
      badge: `${orderCount} commande${orderCount > 1 ? 's' : ''}`,
      tone: 'gold' as const,
    },
    {
      rune: 'ᚤ',
      label: 'Inventaire',
      href: '/admin/produits/grid',
      desc: `Catalogue, stock et édition des produits. ${inStockCount} en stock.`,
      badge: `${productCount} produit${productCount > 1 ? 's' : ''}`,
      tone: 'gold' as const,
    },
    {
      rune: 'ᛚ',
      label: 'Catégories',
      href: '/admin/categories',
      desc: 'Catégories de produits et synchronisation Clover.',
      badge: `${categoryCount} · ${syncedCategories} sync`,
      tone: 'teal' as const,
    },
    {
      rune: 'ᚷ',
      label: 'Clover (POS)',
      href: '/admin/clover',
      desc: 'Synchronisation avec la caisse Clover.',
      badge: pendingQueue > 0 ? `${pendingQueue} en attente` : 'À jour',
      tone: pendingQueue > 0 ? ('alert' as const) : ('muted' as const),
    },
  ];

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
        <h1 className="font-cinzel-decorative text-3xl text-violet-profond mt-2 mb-1">Boutique</h1>
        <p className="font-cormorant italic text-lg text-gray-500">
          E-commerce — inventaire, catégories et caisse Clover
        </p>
      </div>

      {/* Grille des sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <span
                className={`inline-block mt-3 font-cinzel text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${TONE[c.tone]}`}
              >
                {c.badge}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
