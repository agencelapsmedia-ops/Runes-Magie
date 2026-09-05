import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { METHODES_PAIEMENT } from '@/lib/laps-facturation';

export const dynamic = 'force-dynamic';

/** GET /api/admin/laps/paiements — paiements versés, du plus récent au plus ancien. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const paiements = await prisma.lapsPayment.findMany({
    orderBy: [{ paidOn: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json(paiements);
}

/** POST /api/admin/laps/paiements — enregistre un versement (réduit le solde dû). */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 });

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Le montant doit être supérieur à zéro.' }, { status: 400 });
  }

  const paidOn = body.paidOn ? new Date(body.paidOn) : null;
  if (!paidOn || Number.isNaN(paidOn.getTime())) {
    return NextResponse.json({ error: 'La date du paiement est invalide.' }, { status: 400 });
  }

  const paiement = await prisma.lapsPayment.create({
    data: {
      amount: Math.round(amount * 100) / 100,
      paidOn,
      method: METHODES_PAIEMENT.includes(body.method) ? body.method : 'INTERAC',
      note: typeof body.note === 'string' ? body.note : '',
    },
  });
  return NextResponse.json(paiement, { status: 201 });
}
