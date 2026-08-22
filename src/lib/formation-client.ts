/**
 * formation-client.ts — lecture des formations avec Noctura côté CLIENTE.
 * Sécurité : toutes les fonctions filtrent par clientId (la session) — une
 * cliente ne voit jamais l'inscription, les crédits ou les paiements d'une autre.
 */
import { prisma } from '@/lib/db';
import { creditBalance } from '@/lib/formation-service';

export interface EnrollmentSummary {
  id: string;
  formationCode: string;
  formationTitle: string;
  status: string;
  completed: number;
  total: number;
  currentCourse: { code: string; title: string } | null;
  credits: number;
  totalPaid: number;
  balance: number | null;
  nextAppointment: { startsAt: Date } | null;
}

/** Résumés des formations d'une cliente (cartes « Mes formations »). */
export async function getClientEnrollments(clientId: string): Promise<EnrollmentSummary[]> {
  const enrollments = await prisma.formationEnrollment.findMany({
    where: { clientId },
    include: {
      formation: { select: { code: true, title: true } },
      progress: {
        where: { course: { isOptional: false } },
        include: { course: { select: { code: true, title: true, sortOrder: true } } },
      },
      payments: { where: { status: 'PAID' }, select: { amount: true } },
      appointments: {
        where: { status: 'CONFIRMED', startsAt: { gt: new Date() } },
        orderBy: { startsAt: 'asc' },
        take: 1,
        select: { startsAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  if (!enrollments.length) return [];

  const credits = await creditBalance(clientId);

  return enrollments.map((e) => {
    const done = e.progress.filter((p) => p.state === 'COMPLETED').length;
    const current = e.progress
      .filter((p) => p.state === 'UNLOCKED')
      .sort((a, b) => a.course.sortOrder - b.course.sortOrder)[0];
    const totalPaid = e.payments.reduce((s, p) => s + p.amount, 0);
    return {
      id: e.id,
      formationCode: e.formation.code,
      formationTitle: e.formation.title,
      status: e.status,
      completed: done,
      total: e.progress.length,
      currentCourse: current ? { code: current.course.code, title: current.course.title } : null,
      credits,
      totalPaid,
      balance: e.totalPrice != null ? Math.max(0, e.totalPrice - totalPaid) : null,
      nextAppointment: e.appointments[0] ?? null,
    };
  });
}

/** Parcours complet d'une inscription — null si elle n'appartient pas à la cliente. */
export async function getClientEnrollmentDetail(clientId: string, enrollmentId: string) {
  const e = await prisma.formationEnrollment.findFirst({
    where: { id: enrollmentId, clientId }, // ← barrière d'appartenance
    include: {
      formation: { select: { code: true, title: true, subtitle: true } },
      progress: {
        include: {
          course: true,
          // Documents visibles UNIQUEMENT une fois le cours terminé (règle appliquée plus bas)
        },
        orderBy: { course: { sortOrder: 'asc' } },
      },
      payments: { orderBy: { paidAt: 'desc' } },
      appointments: {
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        orderBy: { startsAt: 'desc' },
        take: 6,
        select: { id: true, startsAt: true, status: true },
      },
    },
  });
  if (!e) return null;

  const [credits, documents] = await Promise.all([
    creditBalance(clientId),
    // Documents des cours TERMINÉS seulement (le contenu suit la validation de Noctura).
    prisma.formationCourseDocument.findMany({
      where: {
        isActive: true,
        course: {
          formationId: e.formationId,
          progress: { some: { enrollmentId, state: 'COMPLETED' } },
        },
      },
      select: { id: true, courseId: true, title: true, description: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const totalPaid = e.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  return {
    enrollment: e,
    credits,
    documents,
    totalPaid,
    balance: e.totalPrice != null ? Math.max(0, e.totalPrice - totalPaid) : null,
  };
}
