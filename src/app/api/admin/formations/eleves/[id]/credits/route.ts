import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { auth } from '@/lib/auth';
import { addCredits, creditBalance } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

/** POST — ajuste la banque de crédits { delta, type?, reason }. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const enrollment = await prisma.formationEnrollment.findUnique({
    where: { id },
    select: { clientId: true },
  });
  if (!enrollment) return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const delta = Number(body.delta);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const TYPES = ['ALLOCATION', 'REFUND', 'ADJUSTMENT', 'BONUS', 'CORRECTION'];
  const type = TYPES.includes(body.type) ? body.type : delta > 0 ? 'ALLOCATION' : 'ADJUSTMENT';
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100) {
    return NextResponse.json({ error: 'delta entier non nul requis (max ±100).' }, { status: 400 });
  }
  if (!reason) return NextResponse.json({ error: 'Un motif est requis.' }, { status: 400 });

  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session?.user as any;
  const actor = u?.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : (u?.name ?? 'Admin');

  try {
    await addCredits({ clientId: enrollment.clientId, enrollmentId: id, delta, type, reason, actor });
    return NextResponse.json({ ok: true, solde: await creditBalance(enrollment.clientId) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
