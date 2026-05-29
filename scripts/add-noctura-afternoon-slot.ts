/**
 * Ajoute la plage 15h00 → 16h30 à Noctura pour ses 5 jours de travail (mar-sam).
 * Idempotent : skip si déjà ajouté.
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/add-noctura-afternoon-slot.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('\n🌙 Ajout du créneau 15h00-16h30 pour Noctura\n');

  const practitioner = await prisma.practitioner.findUnique({
    where: { slug: 'noctura' },
  });

  if (!practitioner) {
    console.error('❌ Noctura introuvable (slug: noctura)');
    process.exit(1);
  }

  // Mardi(2) → Samedi(6)
  const days = [2, 3, 4, 5, 6];
  let added = 0;
  let skipped = 0;

  for (const dayOfWeek of days) {
    // Vérifier si la plage existe déjà
    const existing = await prisma.holisticAvailability.findFirst({
      where: {
        practitionerId: practitioner.id,
        dayOfWeek,
        startTime: '15:00',
        endTime: '16:30',
      },
    });

    if (existing) {
      console.log(`   ⏭  Jour ${dayOfWeek} — créneau 15h-16h30 déjà présent`);
      skipped++;
      continue;
    }

    await prisma.holisticAvailability.create({
      data: {
        practitionerId: practitioner.id,
        dayOfWeek,
        startTime: '15:00',
        endTime: '16:30',
        isActive: true,
      },
    });
    console.log(`   ✓  Jour ${dayOfWeek} — créneau 15h-16h30 ajouté`);
    added++;
  }

  // Vérif finale
  const allAvailabilities = await prisma.holisticAvailability.findMany({
    where: { practitionerId: practitioner.id, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  console.log('\n📅 Disponibilités finales de Noctura :');
  for (const a of allAvailabilities) {
    console.log(`   • ${dayNames[a.dayOfWeek]}  ${a.startTime} → ${a.endTime}`);
  }

  console.log(`\n✨ Terminé — ${added} créneaux ajoutés, ${skipped} déjà présents.\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Erreur :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
