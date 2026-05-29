/**
 * Crée les praticiennes Eiraween et Bohemia comme placeholder (compte minimal).
 *
 * Chacune obtient :
 *  - Un email placeholder (à modifier ensuite via /admin/praticiens/[id]/edit)
 *  - Un mot de passe auto-généré (affiché en console à la fin)
 *  - Status APPROVED, visible publiquement avec ses initiales tant que pas de photo
 *  - Bio/spécialités vides — à compléter via l'admin
 *
 * Idempotent — skip si déjà créée.
 *
 * Exécution :
 *   cd runes-et-magie
 *   npx tsx scripts/create-practitioners-from-excel.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

interface NewPractitioner {
  firstName: string;
  lastName: string;
  slug: string;
  email: string;
}

const PRACTITIONERS: NewPractitioner[] = [
  {
    firstName: 'Eiraween',
    lastName: '',
    slug: 'eiraween',
    email: 'eiraween@runesetmagie.ca',
  },
  {
    firstName: 'Bohemia',
    lastName: '',
    slug: 'bohemia',
    email: 'bohemia@runesetmagie.ca',
  },
];

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

async function main() {
  console.log('\n🌙 Création des praticiennes placeholder\n');
  const generatedCreds: { name: string; email: string; password: string }[] = [];

  for (const p of PRACTITIONERS) {
    const existing = await prisma.holisticUser.findUnique({ where: { email: p.email } });
    if (existing) {
      console.log(`   ⏭  ${p.firstName} — existe déjà (skip)`);
      continue;
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.holisticUser.create({
      data: {
        email: p.email,
        hashedPassword,
        firstName: p.firstName,
        lastName: p.lastName,
        role: 'PRACTITIONER',
        practitioner: {
          create: {
            slug: p.slug,
            status: 'APPROVED',
            bio: '',
            specialties: [],
            yearsExperience: 0,
            hourlyRate: 86.66, // 129.99 / 1.5 = même tarif "par défaut" que Noctura
            photoUrl: null,
            approvedAt: new Date(),
          },
        },
      },
    });

    console.log(`   ✓  ${p.firstName} créée (slug: ${p.slug}, email: ${p.email})`);
    generatedCreds.push({ name: p.firstName, email: p.email, password });
  }

  if (generatedCreds.length > 0) {
    console.log('\n══════════════════════════════════════════');
    console.log('⚠️  MOTS DE PASSE GÉNÉRÉS — À TRANSMETTRE');
    console.log('══════════════════════════════════════════');
    for (const c of generatedCreds) {
      console.log(`\n  ${c.name}`);
      console.log(`  Email     : ${c.email}`);
      console.log(`  Mot de passe : ${c.password}`);
    }
    console.log('\n══════════════════════════════════════════');
    console.log('Ces mots de passe ne seront PAS réaffichés. Copie-les MAINTENANT.\n');
  } else {
    console.log('\n✨ Tout est déjà en place.\n');
  }
}

main()
  .catch((e) => { console.error('\n❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
