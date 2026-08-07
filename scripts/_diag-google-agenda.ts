/**
 * Diagnostic ponctuel (LECTURE SEULE) : état réel du lien Google Agenda de
 * chaque praticienne. N'écrit rien en base — se contente de demander un jeton
 * d'accès à Google avec le refresh token stocké, et de rapporter le verdict.
 */
import { google } from 'googleapis';
import { prisma } from '../src/lib/db';

(async () => {
  const envOk =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
    Boolean(process.env.GOOGLE_REDIRECT_URI);
  console.log('--- Variables d\'environnement Google ---');
  console.log(`GOOGLE_CLIENT_ID      : ${process.env.GOOGLE_CLIENT_ID ? 'présent' : 'MANQUANT'}`);
  console.log(`GOOGLE_CLIENT_SECRET  : ${process.env.GOOGLE_CLIENT_SECRET ? 'présent' : 'MANQUANT'}`);
  console.log(`GOOGLE_REDIRECT_URI   : ${process.env.GOOGLE_REDIRECT_URI ?? 'MANQUANT'}`);
  if (!envOk) {
    console.log('\n⚠️  Identifiants absents en local (ils ne vivent que sur Vercel) :');
    console.log('    le test en direct auprès de Google sera sauté, mais on lit quand même');
    console.log('    le verdict enregistré en base par le monitoring de production.');
  }

  const praticiennes = await prisma.practitioner.findMany({
    select: {
      id: true,
      slug: true,
      isOwner: true,
      user: { select: { firstName: true, lastName: true } },
      googleRefreshToken: true,
      googleCalendarEmail: true,
      googleCalendarConnectedAt: true,
      googleSyncError: true,
      googleSyncCheckedAt: true,
    },
    orderBy: { slug: 'asc' },
  });

  console.log(`\n--- ${praticiennes.length} praticienne(s) ---`);
  for (const p of praticiennes) {
    const nom = `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.trim() || p.slug;
    console.log(`\n● ${nom}${p.isOwner ? ' (propriétaire)' : ''}`);
    if (!p.googleRefreshToken) {
      console.log('  Agenda Google : jamais connecté');
      continue;
    }
    console.log(`  Compte Google   : ${p.googleCalendarEmail ?? '(inconnu)'}`);
    console.log(`  Connecté le     : ${p.googleCalendarConnectedAt?.toISOString() ?? '(inconnu)'}`);
    console.log(`  Dernier verdict : ${p.googleSyncError ?? 'sain'} (vérifié ${p.googleSyncCheckedAt?.toISOString() ?? 'jamais'})`);

    if (envOk) {
      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      );
      oauth2.setCredentials({ refresh_token: p.googleRefreshToken });
      try {
        await oauth2.getAccessToken();
        console.log('  ➜ TEST EN DIRECT : ✅ Google accepte encore le jeton');
      } catch (err) {
        const e = err as { response?: { data?: { error?: string; error_description?: string } }; message?: string };
        const code = e?.response?.data?.error ?? e?.message ?? 'erreur inconnue';
        const desc = e?.response?.data?.error_description ?? '';
        console.log(`  ➜ TEST EN DIRECT : ❌ Google refuse le jeton — ${code}${desc ? ` (${desc})` : ''}`);
      }
    }

    const enAttente = await prisma.holisticAppointment.count({
      where: {
        practitionerId: p.id,
        status: 'CONFIRMED',
        googleEventId: null,
        startsAt: { gte: new Date() },
      },
    });
    console.log(`  RDV futurs confirmés non synchronisés : ${enAttente}`);
  }
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
