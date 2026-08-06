/** Lecture seule : liste les événements (à venir puis passés) avec leurs inscriptions. */
import { prisma } from '../src/lib/db';

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

(async () => {
  const maintenant = new Date();
  const evenements = await prisma.event.findMany({
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { registrations: true } }, registrations: { select: { status: true } } },
  });

  const aVenir = evenements.filter((e) => e.startsAt >= maintenant);
  const passes = evenements.filter((e) => e.startsAt < maintenant);

  const ligne = (e: (typeof evenements)[number]) => {
    const confirmes = e.registrations.filter((r) => r.status === 'CONFIRMED').length;
    const etat = e.cancelledAt ? 'ANNULÉ' : e.isPublished ? 'publié' : 'BROUILLON (non visible)';
    console.log(`\n• ${e.title}   [${etat}]`);
    console.log(`  ${fmt(e.startsAt)}`);
    console.log(`  Lieu : ${e.isOnline ? 'En ligne' : e.location}`);
    console.log(`  Inscriptions : ${confirmes} confirmée(s) / ${e.capacity} places   (total lignes : ${e._count.registrations})`);
    console.log(`  URL : /evenements/${e.slug}`);
  };

  console.log(`===== ÉVÉNEMENTS À VENIR (${aVenir.length}) =====`);
  if (aVenir.length === 0) console.log('(aucun)');
  aVenir.forEach(ligne);

  console.log(`\n\n===== ÉVÉNEMENTS PASSÉS (${passes.length}) =====`);
  passes.slice(-5).forEach(ligne);

  await prisma.$disconnect();
})();
