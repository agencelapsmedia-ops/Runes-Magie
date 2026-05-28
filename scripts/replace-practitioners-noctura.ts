/**
 * Migration : Supprime les 6 praticiens fictifs (seed-holistique.ts)
 * et crée Noctura comme unique praticienne réelle.
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/replace-practitioners-noctura.ts
 *
 * Idempotent : safe à re-exécuter (skip si Noctura existe déjà).
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FAKE_EMAILS = [
  'seraphine@example.com',
  'marc-andre@example.com',
  'luna@example.com',
  'etienne@example.com',
  'isabelle@example.com',
  'naomie@example.com',
];

async function main() {
  console.log('\n🌙 Migration Noctura — démarrage\n');

  // 1) Supprimer les 6 faux praticiens
  console.log('1. Suppression des praticiens fictifs…');
  for (const email of FAKE_EMAILS) {
    const user = await prisma.holisticUser.findUnique({ where: { email } });
    if (!user) {
      console.log(`   ⏭  ${email} — n'existe pas (déjà supprimé ?)`);
      continue;
    }
    // Cascade delete via Practitioner.userId → HolisticAvailability → etc.
    await prisma.holisticUser.delete({ where: { email } });
    console.log(`   ✓  ${email} — supprimé`);
  }

  // 2) Créer Noctura
  console.log('\n2. Création de Noctura…');
  const existing = await prisma.holisticUser.findUnique({
    where: { email: 'noctura@runesetmagie.ca' },
  });

  if (existing) {
    console.log('   ⏭  Noctura existe déjà — skip création');
  } else {
    const hashedPassword = await bcrypt.hash('Runes2024!Noctura', 12);
    await prisma.holisticUser.create({
      data: {
        email: 'noctura@runesetmagie.ca',
        hashedPassword,
        firstName: 'Noctura',
        lastName: '',
        role: 'PRACTITIONER',
        practitioner: {
          create: {
            slug: 'noctura',
            status: 'APPROVED',
            bio: "Depuis ma tendre enfance, mes yeux perçoivent un monde au-delà de celui qu'on nous décrit. Depuis 2015, j'ai la chance de poursuivre une mission qui me fait totalement vibrer : contribuer au bien-être à long terme des âmes dotées de capacités incroyables, mais que notre société qualifie malheureusement de « trouble ». Runes & Magie s'engage à redonner foi, confiance et estime aux hypersensibles de ce monde, à celles et ceux qui n'ont jamais eu de sanctuaire pour se réunir. Et moi, Noctura, je vous vois. On vous attend. Car c'est avec nous, et ici, que commence votre magie…",
            specialties: ['Accompagnement Hypersensibles', 'Guidance Spirituelle', 'Soins Énergétiques'],
            yearsExperience: 11, // depuis 2015 → 11 ans en 2026
            // 129,99 $ pour 90 min → 86,66 $/h (le système multiplie par durationHours)
            hourlyRate: 86.66,
            photoUrl: '/images/praticiens/noctura.jpg',
            approvedAt: new Date(),
            availabilities: {
              // Séances de 90 min, 2 par jour, pause dîner 11h30 → 13h00
              // Mardi(2) → Samedi(6) : matin 10h00–11h30 (1 séance) + après-midi 13h00–14h30 (1 séance)
              create: [
                { dayOfWeek: 2, startTime: '10:00', endTime: '11:30', isActive: true },
                { dayOfWeek: 2, startTime: '13:00', endTime: '14:30', isActive: true },
                { dayOfWeek: 3, startTime: '10:00', endTime: '11:30', isActive: true },
                { dayOfWeek: 3, startTime: '13:00', endTime: '14:30', isActive: true },
                { dayOfWeek: 4, startTime: '10:00', endTime: '11:30', isActive: true },
                { dayOfWeek: 4, startTime: '13:00', endTime: '14:30', isActive: true },
                { dayOfWeek: 5, startTime: '10:00', endTime: '11:30', isActive: true },
                { dayOfWeek: 5, startTime: '13:00', endTime: '14:30', isActive: true },
                { dayOfWeek: 6, startTime: '10:00', endTime: '11:30', isActive: true },
                { dayOfWeek: 6, startTime: '13:00', endTime: '14:30', isActive: true },
              ],
            },
          },
        },
      },
    });
    console.log('   ✓  Noctura créée (slug: noctura, status: APPROVED)');
  }

  // 3) Vérification finale
  console.log('\n3. Vérification — praticiens APPROVED actuels :');
  const practitioners = await prisma.practitioner.findMany({
    where: { status: 'APPROVED' },
    include: { user: true },
  });
  for (const p of practitioners) {
    console.log(`   • ${p.user.firstName} ${p.user.lastName} (${p.slug}) — ${p.hourlyRate} $/h`);
  }

  console.log(`\n✨ Migration terminée — ${practitioners.length} praticien(s) approuvé(s).\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Erreur :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
