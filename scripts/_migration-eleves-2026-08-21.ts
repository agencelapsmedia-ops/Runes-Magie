/**
 * Migration ponctuelle (2026-08-21) — initialisation des élèves existantes.
 * Données fournies par Jonathan :
 *  - Nathalie Leprohon → Tarot, 6 premiers cours faits (TP00..TP05)
 *  - Brigitte Vaillancourt → Runes, 5 cours faits (RF01..RF05), paie à la carte
 *  - Anne-Marie Gagnon → Runes, 2 premiers cours faits (RF01..RF02)
 * (Chantal Bélanger : en attente de vérification.)
 * Progression seulement — paiements historiques et jetons à saisir ensuite.
 */
import { prisma } from '../src/lib/db';
import { createEnrollment, setCourseState } from '../src/lib/formation-service';

const ACTOR = 'Migration (Jonathan)';
const NOTE = 'Migration de l’ancienne formation vers le nouveau système (2026-08-21).';

async function migrate(email: string, formationCode: string, completedCodes: string[]) {
  const client = await prisma.holisticUser.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, role: 'CLIENT' },
  });
  if (!client) { console.error(`✗ Cliente introuvable : ${email}`); return; }
  const formation = await prisma.formation.findUnique({ where: { code: formationCode } });
  if (!formation) { console.error(`✗ Formation introuvable : ${formationCode}`); return; }

  let enrollment = await prisma.formationEnrollment.findUnique({
    where: { formationId_clientId: { formationId: formation.id, clientId: client.id } },
  });
  if (!enrollment) {
    enrollment = await createEnrollment({
      formationId: formation.id,
      clientId: client.id,
      adminNotes: NOTE,
      actor: ACTOR,
    });
  }

  for (const code of completedCodes) {
    const course = await prisma.formationCourse.findUnique({
      where: { formationId_code: { formationId: formation.id, code } },
    });
    if (!course) { console.error(`  ✗ Cours introuvable : ${code}`); continue; }
    const progress = await prisma.enrollmentCourseProgress.findUnique({
      where: { enrollmentId_courseId: { enrollmentId: enrollment.id, courseId: course.id } },
    });
    if (progress?.state === 'COMPLETED') { console.log(`  = ${code} déjà terminé`); continue; }
    const journal = await setCourseState({
      enrollmentId: enrollment.id,
      courseId: course.id,
      action: 'complete',
      actor: ACTOR,
      note: 'Migration historique',
    });
    console.log('  ', journal.join(' · '));
  }
  console.log(`✓ ${client.firstName} ${client.lastName} — ${formation.title}\n`);
}

async function main() {
  await migrate('nathalieleprohon@gmail.com', 'TP', ['TP00', 'TP01', 'TP02', 'TP03', 'TP04', 'TP05']);
  await migrate('brigittehorb@hotmail.com', 'RF', ['RF01', 'RF02', 'RF03', 'RF04', 'RF05']);
  await migrate('5147716885@interne.invalid', 'RF', ['RF01', 'RF02']); // Anne-Marie Gagnon
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
