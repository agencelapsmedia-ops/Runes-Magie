/**
 * Marque Noctura comme praticienne PROPRIÉTAIRE (Practitioner.isOwner = true).
 *
 * But : une seule connexion (le compte de Noctura) donne accès à la fois à son
 * espace praticienne ET au back-office admin. L'accès admin est accordé au
 * praticien `isOwner` (voir src/lib/auth.ts + src/lib/admin-guard.ts). Le rôle
 * de Noctura reste PRACTITIONER (son espace praticienne n'est pas modifié).
 *
 * Sécurité : garantit l'EXCLUSIVITÉ — met isOwner=false sur tous les autres
 * praticiens, pour qu'aucune autre praticienne n'obtienne les droits admin.
 *
 * Exécution (avec DATABASE_URL de prod) :
 *   cd runes-et-magie
 *   npx tsx scripts/promote-noctura-owner.ts
 *
 * Idempotent : safe à re-exécuter.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NOCTURA_EMAIL = 'noctura@runesetmagie.ca';
const NOCTURA_SLUG = 'noctura';

async function main() {
  console.log('\n🌙 Promotion de Noctura en praticienne propriétaire\n');

  // 1) Retrouver la fiche Practitioner de Noctura : d'abord par le HolisticUser
  //    (email), sinon par le slug de la fiche.
  const holistic = await prisma.holisticUser.findUnique({
    where: { email: NOCTURA_EMAIL },
    include: { practitioner: true },
  });

  let practitioner = holistic?.practitioner ?? null;
  if (!practitioner) {
    practitioner = await prisma.practitioner.findUnique({ where: { slug: NOCTURA_SLUG } });
  }

  if (!practitioner) {
    console.error(
      `❌ Fiche praticienne introuvable (ni via HolisticUser "${NOCTURA_EMAIL}", ni via slug "${NOCTURA_SLUG}"). Aucune modification.`,
    );
    process.exit(1);
  }

  console.log(`   Fiche cible : ${practitioner.slug} (id ${practitioner.id})`);

  // 2) Exclusivité : retirer isOwner de tous les AUTRES praticiens.
  const cleared = await prisma.practitioner.updateMany({
    where: { id: { not: practitioner.id }, isOwner: true },
    data: { isOwner: false },
  });
  if (cleared.count > 0) {
    console.log(`   ⚠️  isOwner retiré de ${cleared.count} autre(s) praticien(s) (exclusivité).`);
  }

  // 3) Marquer Noctura comme propriétaire.
  await prisma.practitioner.update({
    where: { id: practitioner.id },
    data: { isOwner: true },
  });
  console.log(`   ✅ isOwner=true posé sur ${practitioner.slug}.`);

  // 4) Récapitulatif : lister tous les propriétaires (doit être exactement 1).
  const owners = await prisma.practitioner.findMany({
    where: { isOwner: true },
    select: { id: true, slug: true },
  });
  console.log(`\n   Propriétaires (isOwner=true) : ${owners.length}`);
  for (const o of owners) console.log(`     • ${o.slug} (${o.id})`);
  if (owners.length !== 1) {
    console.warn('   ⚠️  Attendu : exactement 1 propriétaire.');
  }

  console.log('\n✨ Terminé.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
