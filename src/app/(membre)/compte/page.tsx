import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CARDS = [
  {
    href: '/compte/formations',
    emoji: '🎓',
    title: 'Mes formations',
    desc: 'Reprenez vos cours là où vous les avez laissés.',
  },
  {
    href: '/compte/merestegere',
    emoji: '📖',
    title: 'Le Merestegere',
    desc: 'Notre grimoire des membres, à lire et à télécharger.',
  },
  {
    href: '/compte/veillees',
    emoji: '🌙',
    title: 'Les Veillées de Noctura',
    desc: 'La diffusion de la semaine et ses replays.',
  },
  {
    href: '/compte/achats',
    emoji: '🛒',
    title: 'Achats & factures',
    desc: 'Votre historique de commandes et vos factures.',
  },
  {
    href: '/compte/bibliotheque',
    emoji: '📚',
    title: 'Bibliothèque',
    desc: 'Ressources, ebooks et méditations des membres.',
  },
];

export default async function CompteDashboardPage() {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const member = sessionUserId
    ? await prisma.holisticUser.findUnique({
        where: { id: sessionUserId },
        select: { firstName: true },
      })
    : null;

  const firstName = member?.firstName ?? 'cher membre';

  return (
    <div>
      <header className="mb-10">
        <div aria-hidden className="mb-3 font-cinzel-decorative text-3xl text-or-ancien/30">
          ᚹ
        </div>
        <h1 className="font-cinzel-decorative text-2xl text-or-ancien sm:text-3xl">
          Bienvenue, {firstName}
        </h1>
        <p className="mt-2 font-cormorant text-lg italic text-parchemin/50">
          Votre espace personnel chez Runes &amp; Magie
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col rounded-sm border p-6 transition-all duration-200"
            style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
          >
            <span aria-hidden className="mb-3 text-2xl">
              {card.emoji}
            </span>
            <span className="font-cinzel text-sm uppercase tracking-widest text-parchemin transition-colors duration-200 group-hover:text-or-ancien">
              {card.title}
            </span>
            <span className="mt-2 font-cormorant text-base text-parchemin/50">{card.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
