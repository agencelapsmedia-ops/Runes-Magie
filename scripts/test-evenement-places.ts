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
  // Identifiants des donnees creees par ce script, accumules au fur et a
  // mesure : c'est sur QUOI le nettoyage se base, jamais un filtre large.
  let idEvenement: string | null = null;
  const idsMembres: string[] = [];

  try {
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
    idEvenement = evenement.id;

    // Promise.allSettled plutot que Promise.all : si la creation d'un membre
    // echoue (pooler instable), on garde trace des membres reellement crees
    // pour pouvoir les nettoyer, au lieu de perdre leurs identifiants.
    const creations = await Promise.allSettled(
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
    const membres = creations
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof prisma.holisticUser.create>>>).value);
    idsMembres.push(...membres.map((m) => m.id));

    const echecsCreation = creations.filter((r) => r.status === 'rejected');
    if (echecsCreation.length > 0) {
      console.log(`Echec de creation de ${echecsCreation.length} membre(s) de test.`);
    }

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
          showPublicly: false,
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

    const succes =
      echecsCreation.length === 0 &&
      reussies === CAPACITE &&
      enBase === CAPACITE &&
      autresErreurs.length === 0;
    console.log(succes ? '\nRESULTAT : SUCCES' : '\nRESULTAT : ECHEC');
    process.exitCode = succes ? 0 : 1;
  } finally {
    // Nettoyage : execute meme si une etape ci-dessus a echoue en cours de
    // route, et strictement borne aux identifiants crees par CE script.
    try {
      if (idEvenement) {
        await prisma.eventRegistration.deleteMany({ where: { eventId: idEvenement } });
        await prisma.event.delete({ where: { id: idEvenement } });
      }
      if (idsMembres.length > 0) {
        await prisma.holisticUser.deleteMany({ where: { id: { in: idsMembres } } });
      }
    } catch (erreurNettoyage) {
      console.error(
        'ERREUR DE NETTOYAGE — des donnees de test peuvent subsister en production :',
        erreurNettoyage,
      );
      if (idEvenement) console.error(`  evenement id : ${idEvenement}`);
      if (idsMembres.length > 0) console.error(`  membres ids  : ${idsMembres.join(', ')}`);
      process.exitCode = 1;
    }
  }
}

main()
  .catch((e) => {
    console.error('ERREUR :', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
