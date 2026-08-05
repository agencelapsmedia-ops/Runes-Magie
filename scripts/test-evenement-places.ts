/**
 * Test de concurrence sur la limite de places.
 *
 * Cree un evenement de test a 15 places, lance 20 inscriptions SIMULTANEES,
 * et verifie qu'il en passe exactement 15. Nettoie tout a la fin.
 *
 * Usage : npx tsx scripts/test-evenement-places.ts
 */
import { PrismaClient } from '@prisma/client';
import { inscrire, EvenementComplet } from '../src/lib/evenements';

const prisma = new PrismaClient();

const CAPACITE = 15;
const TENTATIVES = 20;

async function main() {
  const evenement = await prisma.event.create({
    data: {
      slug: `test-concurrence-${Date.now()}`,
      title: 'Test de concurrence',
      description: 'Evenement temporaire de test.',
      location: 'Nulle part',
      capacity: CAPACITE,
      startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      isPublished: true,
    },
  });

  const membres = await Promise.all(
    Array.from({ length: TENTATIVES }, (_, i) =>
      prisma.holisticUser.create({
        data: {
          email: `test-concurrence-${Date.now()}-${i}@exemple.test`,
          hashedPassword: 'x'.repeat(60),
          firstName: 'Test',
          lastName: `Numero${i}`,
        },
      }),
    ),
  );

  const resultats = await Promise.allSettled(
    membres.map((m) =>
      inscrire({
        eventId: evenement.id,
        userId: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: null,
        note: null,
      }),
    ),
  );

  const reussies = resultats.filter((r) => r.status === 'fulfilled').length;
  const complets = resultats.filter(
    (r) => r.status === 'rejected' && r.reason instanceof EvenementComplet,
  ).length;
  const autresErreurs = resultats.filter(
    (r) => r.status === 'rejected' && !(r.reason instanceof EvenementComplet),
  );

  const enBase = await prisma.eventRegistration.count({
    where: { eventId: evenement.id, status: 'CONFIRMED' },
  });

  console.log(`Inscriptions reussies   : ${reussies}`);
  console.log(`Refus « complet »       : ${complets}`);
  console.log(`Confirmees en base      : ${enBase}`);
  if (autresErreurs.length > 0) {
    console.log('Erreurs inattendues :');
    for (const e of autresErreurs) {
      console.log('  -', (e as PromiseRejectedResult).reason);
    }
  }

  // Nettoyage
  await prisma.eventRegistration.deleteMany({ where: { eventId: evenement.id } });
  await prisma.event.delete({ where: { id: evenement.id } });
  await prisma.holisticUser.deleteMany({ where: { id: { in: membres.map((m) => m.id) } } });

  const succes = reussies === CAPACITE && enBase === CAPACITE && autresErreurs.length === 0;
  console.log(succes ? '\nRESULTAT : SUCCES' : '\nRESULTAT : ECHEC');
  process.exitCode = succes ? 0 : 1;
}

main()
  .catch((e) => {
    console.error('ERREUR :', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
