import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = {
  gold: 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40',
  alert: 'bg-[#FCD34D]/15 text-[#FCD34D] border-[#FCD34D]/40',
  muted: 'bg-white/5 text-parchemin-vieilli/60 border-white/10',
  teal: 'bg-[#2EC4B6]/15 text-[#2EC4B6] border-[#2EC4B6]/40',
};

export default async function ServicesHubPage() {
  const now = new Date();
  const [offeringsCount, pendingPractitioners, pendingChanges, revenue, categoriesCount, upcomingCount, toCollectCount] =
    await Promise.all([
      prisma.offering.count(),
      prisma.practitioner.count({ where: { status: 'PENDING' } }),
      prisma.pendingPractitionerChange.count({ where: { status: 'PENDING' } }),
      prisma.holisticPayment.aggregate({ _sum: { amountTotal: true }, where: { status: 'PAID' } }),
      prisma.serviceCategory.count(),
      prisma.holisticAppointment.count({ where: { status: 'CONFIRMED', startsAt: { gte: now } } }),
      prisma.holisticAppointment.count({
        where: { status: 'CONFIRMED', paymentMode: { in: ['INTERAC', 'STRIPE_LINK'] }, payment: { status: 'PENDING' } },
      }),
    ]);
  const totalRevenue = revenue._sum.amountTotal ?? 0;

  const cards = [
    {
      rune: 'ᛒ',
      label: 'Calendrier',
      href: '/admin/calendrier',
      desc: 'Tous les rendez-vous — vues mois, semaine et jour.',
      badge: `${upcomingCount} à venir`,
      tone: 'teal' as const,
    },
    {
      rune: 'ᛜ',
      label: 'Consultations',
      href: '/admin/consultations',
      desc: 'Liste des rendez-vous, statuts et paiements.',
      badge: toCollectCount > 0 ? `${toCollectCount} à encaisser` : 'À jour',
      tone: toCollectCount > 0 ? ('alert' as const) : ('muted' as const),
    },
    {
      rune: 'ᚹ',
      label: 'Services & Soins',
      href: '/admin/offerings',
      desc: 'Soins, séances, cours et formations.',
      badge: `${offeringsCount} service${offeringsCount > 1 ? 's' : ''}`,
      tone: 'gold' as const,
    },
    {
      rune: 'ᚻ',
      label: 'Praticiens',
      href: '/admin/praticiens',
      desc: 'Profils, approbations et statuts.',
      badge: pendingPractitioners > 0 ? `${pendingPractitioners} en attente` : 'À jour',
      tone: pendingPractitioners > 0 ? ('alert' as const) : ('muted' as const),
    },
    {
      rune: 'ᛪ',
      label: 'Formations',
      href: '/admin/formations',
      desc: 'Cours et formations en ligne pour les membres.',
      badge: 'Cours',
      tone: 'muted' as const,
    },
    {
      rune: 'ᚦ',
      label: 'Modifications',
      href: '/admin/praticiens/modifications',
      desc: 'Demandes de modification de profil des praticiennes.',
      badge: pendingChanges > 0 ? `${pendingChanges} en attente` : 'À jour',
      tone: pendingChanges > 0 ? ('alert' as const) : ('muted' as const),
    },
    {
      rune: 'ᚴ',
      label: 'Revenus',
      href: '/admin/revenus-holistique',
      desc: 'Paiements, commissions et versements.',
      badge: `${totalRevenue.toFixed(2)} $`,
      tone: 'teal' as const,
    },
    {
      rune: 'ᛃ',
      label: 'Catégories de services',
      href: '/admin/services/categories',
      desc: 'Catégories et sous-catégories — onglets de Services & Soins.',
      badge: `${categoriesCount} catégorie${categoriesCount > 1 ? 's' : ''}`,
      tone: 'gold' as const,
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
        <h1 className="font-cinzel-decorative text-3xl text-violet-profond mt-2 mb-1">Soins &amp; Cours</h1>
        <p className="font-cormorant italic text-lg text-gray-500">
          Rendez-vous, services, praticiennes, formations et revenus
        </p>
      </div>

      {/* Grille des 4 sections */}
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
            <span
              className={`shrink-0 self-start font-cinzel text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${TONE[c.tone]}`}
            >
              {c.badge}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
