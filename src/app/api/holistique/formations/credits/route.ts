import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';
import { creditBalance } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/holistique/formations/credits — solde de jetons de la cliente
 * connectée + ses formations actives (pour que la page de réservation offre
 * « Réserver avec 1 jeton » en choisissant la bonne formation).
 */
export async function GET() {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ credits: 0, enrollments: [] });

  const enrollments = await prisma.formationEnrollment.findMany({
    where: { clientId: user.id, status: { in: ['ACTIVE', 'PAYMENT_DUE'] } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      formation: { select: { code: true, title: true } },
      progress: {
        where: { state: 'UNLOCKED', course: { isOptional: false } },
        orderBy: { course: { sortOrder: 'asc' } },
        take: 1,
        select: { course: { select: { code: true, title: true } } },
      },
    },
  });
  const credits = enrollments.length ? await creditBalance(user.id) : 0;
  return NextResponse.json({
    credits,
    enrollments: enrollments.map((e) => ({
      id: e.id,
      code: e.formation.code,
      title: e.formation.title,
      currentCourse: e.progress[0]?.course ?? null,
    })),
  });
}
