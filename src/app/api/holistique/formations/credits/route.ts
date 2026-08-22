import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';
import { creditBalance } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/holistique/formations/credits — solde de jetons de la cliente
 * connectée + si elle a une formation active. Utilisé par la page de
 * réservation pour offrir « Réserver avec 1 jeton ».
 */
export async function GET() {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ credits: 0, hasEnrollment: false });

  const enrollment = await prisma.formationEnrollment.findFirst({
    where: { clientId: user.id, status: { in: ['ACTIVE', 'PAYMENT_DUE'] } },
    select: { id: true },
  });
  const credits = enrollment ? await creditBalance(user.id) : 0;
  return NextResponse.json({ credits, hasEnrollment: !!enrollment });
}
