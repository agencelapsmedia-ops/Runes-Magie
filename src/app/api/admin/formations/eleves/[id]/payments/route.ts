import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { auth } from '@/lib/auth';
import { addPayment } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

/** POST — ajoute un paiement { amount, paidAt, method, status?, installmentNo?, note? }. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const exists = await prisma.formationEnrollment.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
  const METHODS = ['INTERAC', 'CARD', 'CASH', 'OTHER'];
  const method = METHODS.includes(body.method) ? body.method : null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
  }
  if (!method) return NextResponse.json({ error: 'Mode de paiement invalide (INTERAC, CARD, CASH, OTHER).' }, { status: 400 });
  if (Number.isNaN(paidAt.getTime())) return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });

  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session?.user as any;
  const actor = u?.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : (u?.name ?? 'Admin');

  const payment = await addPayment({
    enrollmentId: id,
    amount,
    paidAt,
    method,
    status: ['PAID', 'PENDING', 'FAILED'].includes(body.status) ? body.status : 'PAID',
    installmentNo: Number.isInteger(body.installmentNo) ? body.installmentNo : null,
    note: typeof body.note === 'string' ? body.note.trim() : '',
    actor,
  });
  return NextResponse.json({ ok: true, paymentId: payment.id }, { status: 201 });
}
