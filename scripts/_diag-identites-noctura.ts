/** Diagnostic ponctuel (LECTURE SEULE) : identités de connexion vs agenda Google. */
import { prisma } from '../src/lib/db';

(async () => {
  const praticiennes = await prisma.practitioner.findMany({
    select: {
      slug: true,
      isOwner: true,
      googleCalendarEmail: true,
      googleCalendarConnectedAt: true,
      user: { select: { email: true, firstName: true, lastName: true, role: true } },
      userV2: { select: { email: true, role: true } },
    },
    orderBy: { slug: 'asc' },
  });

  for (const p of praticiennes) {
    console.log(`\n● ${p.slug}${p.isOwner ? ' (propriétaire)' : ''}`);
    console.log(`  Connexion au site (HolisticUser) : ${p.user?.email ?? '—'} [${p.user?.role ?? '—'}]`);
    console.log(`  Connexion au site (User v2)      : ${p.userV2?.email ?? '—'} [${p.userV2?.role ?? '—'}]`);
    console.log(`  Agenda Google connecté           : ${p.googleCalendarEmail ?? '— aucun —'}`);
  }
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
