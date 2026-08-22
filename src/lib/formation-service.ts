/**
 * formation-service.ts — logique métier du module Formations avec Noctura.
 *
 * Règles clés (voir Vault Obsidian + mémoire projet) :
 *  - La banque de crédits appartient à la CLIENTE (partagée Runes/Tarot) :
 *    solde = somme des deltas de FormationCreditTransaction (clientId).
 *  - Toute opération de crédit est transactionnelle — jamais de décrément
 *    lu-puis-écrit hors transaction (anti double-débit).
 *  - La complétion d'un cours vient de Noctura/admin, jamais de la cliente.
 *  - Terminer un cours débloque automatiquement le cours suivant du parcours
 *    (hors cours optionnels), origine AUTO, et journalise tout.
 */
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/** Solde de crédits d'une cliente (partagé entre formations). */
export async function creditBalance(clientId: string, tx: Tx | typeof prisma = prisma): Promise<number> {
  const agg = await tx.formationCreditTransaction.aggregate({
    where: { clientId },
    _sum: { delta: true },
  });
  return agg._sum.delta ?? 0;
}

/** Ajoute une transaction de crédits (allocation, ajustement…) + journal. */
export async function addCredits(params: {
  clientId: string;
  enrollmentId?: string | null;
  delta: number;
  type: 'ALLOCATION' | 'USE' | 'REFUND' | 'ADJUSTMENT' | 'BONUS' | 'CORRECTION';
  reason: string;
  actor: string;
  appointmentId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    // Un débit ne doit jamais rendre le solde négatif.
    if (params.delta < 0) {
      const solde = await creditBalance(params.clientId, tx);
      if (solde + params.delta < 0) {
        throw new Error(`Solde insuffisant (${solde} crédit${solde > 1 ? 's' : ''} restant).`);
      }
    }
    const txn = await tx.formationCreditTransaction.create({
      data: {
        clientId: params.clientId,
        enrollmentId: params.enrollmentId ?? null,
        delta: params.delta,
        type: params.type,
        reason: params.reason,
        createdBy: params.actor,
        appointmentId: params.appointmentId ?? null,
      },
    });
    if (params.enrollmentId) {
      await tx.formationAuditLog.create({
        data: {
          enrollmentId: params.enrollmentId,
          actor: params.actor,
          action: 'CREDIT_' + params.type,
          detail: `${params.delta > 0 ? '+' : ''}${params.delta} crédit — ${params.reason}`,
        },
      });
    }
    return txn;
  });
}

/**
 * Inscrit une cliente à une formation : crée l'inscription + une ligne de
 * progression LOCKED par cours du parcours (hors optionnels), et débloque le
 * premier cours. Idempotent sur (formationId, clientId).
 */
export async function createEnrollment(params: {
  formationId: string;
  clientId: string;
  totalPrice?: number | null;
  adminNotes?: string;
  actor: string;
}) {
  const existing = await prisma.formationEnrollment.findUnique({
    where: { formationId_clientId: { formationId: params.formationId, clientId: params.clientId } },
  });
  if (existing) throw new Error('Cette cliente est déjà inscrite à cette formation.');

  const courses = await prisma.formationCourse.findMany({
    where: { formationId: params.formationId, isOptional: false },
    orderBy: { sortOrder: 'asc' },
  });
  if (!courses.length) throw new Error('Cette formation n’a aucun cours défini.');

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.formationEnrollment.create({
      data: {
        formationId: params.formationId,
        clientId: params.clientId,
        totalPrice: params.totalPrice ?? null,
        adminNotes: params.adminNotes ?? '',
      },
    });
    await tx.enrollmentCourseProgress.createMany({
      data: courses.map((c, i) => ({
        enrollmentId: enrollment.id,
        courseId: c.id,
        state: i === 0 ? 'UNLOCKED' : 'LOCKED',
        unlockedAt: i === 0 ? new Date() : null,
        origin: 'AUTO',
      })),
    });
    await tx.formationAuditLog.create({
      data: {
        enrollmentId: enrollment.id,
        actor: params.actor,
        action: 'ENROLLMENT_CREATED',
        detail: `Inscription créée — ${courses[0].code} débloqué automatiquement.`,
      },
    });
    return enrollment;
  });
}

/**
 * Change l'état d'un cours pour une inscription (action admin/Noctura).
 *  - complete : marque terminé + débloque automatiquement le cours suivant
 *  - unlock / lock / uncomplete : correctifs manuels
 * Tout est journalisé.
 */
export async function setCourseState(params: {
  enrollmentId: string;
  courseId: string;
  action: 'complete' | 'unlock' | 'lock' | 'uncomplete';
  actor: string;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const progress = await tx.enrollmentCourseProgress.findUnique({
      where: { enrollmentId_courseId: { enrollmentId: params.enrollmentId, courseId: params.courseId } },
      include: { course: true },
    });
    if (!progress) throw new Error('Cours introuvable pour cette inscription.');
    const now = new Date();
    const journal: string[] = [];

    if (params.action === 'complete') {
      await tx.enrollmentCourseProgress.update({
        where: { id: progress.id },
        data: {
          state: 'COMPLETED',
          completedAt: now,
          completedBy: params.actor,
          origin: 'MANUAL',
          note: params.note ?? progress.note,
          unlockedAt: progress.unlockedAt ?? now,
        },
      });
      journal.push(`${progress.course.code} marqué terminé`);

      // Déblocage automatique du prochain cours verrouillé du parcours.
      const next = await tx.enrollmentCourseProgress.findFirst({
        where: {
          enrollmentId: params.enrollmentId,
          state: 'LOCKED',
          course: { isOptional: false, sortOrder: { gt: progress.course.sortOrder } },
        },
        orderBy: { course: { sortOrder: 'asc' } },
        include: { course: true },
      });
      if (next) {
        await tx.enrollmentCourseProgress.update({
          where: { id: next.id },
          data: { state: 'UNLOCKED', unlockedAt: now, origin: 'AUTO' },
        });
        journal.push(`${next.course.code} débloqué automatiquement`);
      } else {
        // Plus rien à débloquer : parcours pédagogique complété.
        const remaining = await tx.enrollmentCourseProgress.count({
          where: { enrollmentId: params.enrollmentId, state: { not: 'COMPLETED' }, course: { isOptional: false } },
        });
        if (remaining === 0) {
          await tx.formationEnrollment.update({
            where: { id: params.enrollmentId },
            data: { status: 'COMPLETED' },
          });
          journal.push('Formation complétée 🎓');
        }
      }
    } else if (params.action === 'unlock') {
      await tx.enrollmentCourseProgress.update({
        where: { id: progress.id },
        data: { state: 'UNLOCKED', unlockedAt: now, origin: 'MANUAL', note: params.note ?? progress.note },
      });
      journal.push(`${progress.course.code} débloqué manuellement`);
    } else if (params.action === 'lock') {
      await tx.enrollmentCourseProgress.update({
        where: { id: progress.id },
        data: { state: 'LOCKED', origin: 'MANUAL', note: params.note ?? progress.note },
      });
      journal.push(`${progress.course.code} verrouillé manuellement`);
    } else {
      await tx.enrollmentCourseProgress.update({
        where: { id: progress.id },
        data: { state: 'UNLOCKED', completedAt: null, completedBy: null, origin: 'MANUAL', note: params.note ?? progress.note },
      });
      journal.push(`${progress.course.code} : statut terminé annulé`);
    }

    await tx.formationAuditLog.create({
      data: {
        enrollmentId: params.enrollmentId,
        actor: params.actor,
        action: 'COURSE_' + params.action.toUpperCase(),
        detail: journal.join(' · ') + (params.note ? ` — ${params.note}` : ''),
      },
    });
    return journal;
  });
}

/** Ajoute un paiement (versement ou historique) + journal. */
export async function addPayment(params: {
  enrollmentId: string;
  amount: number;
  paidAt: Date;
  method: 'INTERAC' | 'CARD' | 'CASH' | 'OTHER';
  status?: 'PAID' | 'PENDING' | 'FAILED';
  installmentNo?: number | null;
  note?: string;
  actor: string;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.formationPayment.create({
      data: {
        enrollmentId: params.enrollmentId,
        amount: params.amount,
        paidAt: params.paidAt,
        method: params.method,
        status: params.status ?? 'PAID',
        installmentNo: params.installmentNo ?? null,
        note: params.note ?? '',
        createdBy: params.actor,
      },
    });
    await tx.formationAuditLog.create({
      data: {
        enrollmentId: params.enrollmentId,
        actor: params.actor,
        action: 'PAYMENT_ADDED',
        detail: `${params.amount.toFixed(2)} $ (${params.method}) — ${params.note || 'paiement'}`,
      },
    });
    return payment;
  });
}
