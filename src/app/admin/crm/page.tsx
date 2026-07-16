import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TONE: Record<string, string> = {
  gold: 'bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40',
  alert: 'bg-[#FCD34D]/15 text-[#FCD34D] border-[#FCD34D]/40',
  muted: 'bg-white/5 text-parchemin-vieilli/60 border-white/10',
  teal: 'bg-[#2EC4B6]/15 text-[#2EC4B6] border-[#2EC4B6]/40',
};

/** Hub CRM / Clients : clients, infolettre, conversations du chat, to-do du projet. */
export default async function CrmHubPage() {
  const now = new Date();
  const [clientCount, subscriberCount, conversationCount, activeTasks, lateTasks, postsProgrammes, postsEnErreur] =
    await Promise.all([
      prisma.holisticUser.count({ where: { role: 'CLIENT' } }),
      prisma.newsletterSubscriber.count(),
      prisma.chatConversation.count(),
      prisma.todoTask.count({ where: { archivedAt: null, status: { not: 'TERMINE' } } }),
      prisma.todoTask.count({ where: { archivedAt: null, status: { not: 'TERMINE' }, dueOn: { lt: now } } }),
      prisma.socialPost.count({ where: { status: 'PROGRAMMEE' } }),
      prisma.socialPost.count({ where: { status: 'ERREUR' } }),
    ]);

  const cards = [
    {
      rune: 'ᛗ',
      label: 'Clients',
      href: '/admin/clients',
      desc: 'Comptes clients inscrits, fiches et historique de réservations.',
      badge: `${clientCount} client${clientCount > 1 ? 's' : ''}`,
      tone: 'gold' as const,
    },
    {
      rune: 'ᛃ',
      label: 'Infolettre',
      href: '/admin/clients?tab=infolettre',
      desc: 'Abonnés à l’infolettre. Processus d’envoi de campagnes à venir.',
      badge: `${subscriberCount} abonné${subscriberCount > 1 ? 's' : ''}`,
      tone: 'teal' as const,
    },
    {
      rune: 'ᛜ',
      label: 'Conversations du chat',
      href: '/admin/conversations',
      desc: 'Tout ce que les visiteuses ont échangé avec Noctura.',
      badge: `${conversationCount} conversation${conversationCount > 1 ? 's' : ''}`,
      tone: 'gold' as const,
    },
    {
      rune: 'ᛏ',
      label: 'To-do du projet',
      href: '/admin/todo',
      desc: 'Tableau kanban : À faire · En cours · En vérification · Terminé.',
      badge: lateTasks > 0 ? `${lateTasks} en retard` : `${activeTasks} active${activeTasks > 1 ? 's' : ''}`,
      tone: lateTasks > 0 ? ('alert' as const) : ('muted' as const),
    },
    {
      rune: 'ᛒ',
      label: 'Publications réseaux sociaux',
      href: '/admin/publications',
      desc: 'Prépare, programme et publie sur Facebook et Instagram.',
      badge: postsEnErreur > 0 ? `${postsEnErreur} en erreur` : `${postsProgrammes} programmée${postsProgrammes > 1 ? 's' : ''}`,
      tone: postsEnErreur > 0 ? ('alert' as const) : ('teal' as const),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin"
          className="font-cinzel text-xs tracking-widest uppercase text-violet-profond/50 hover:text-violet-profond transition-colors"
        >
          ← Tableau de bord
        </Link>
        <h1 className="font-cinzel-decorative text-3xl text-violet-profond mt-2 mb-1">CRM / Clients</h1>
        <p className="font-cormorant italic text-lg text-gray-500">
          Clients, infolettre, conversations et suivi du projet
        </p>
      </div>

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
            <span className={`shrink-0 self-start font-cinzel text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${TONE[c.tone]}`}>
              {c.badge}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
