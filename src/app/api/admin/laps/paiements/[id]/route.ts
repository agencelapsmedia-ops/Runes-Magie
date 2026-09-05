import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { METHODES_PAIEMENT } from '@/lib/laps-facturation';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/laps/paiements/[id] — corrige un versement. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 });

  const data: Record<string, unknown> = {};

  if ('amount' in body) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Le montant doit être supérieur à zéro.' }, { status: 400 });
    }
    data.amount = Math.round(amount * 100) / 100;
  }

  if ('paidOn' in body) {
    const paidOn = body.paidOn ? new Date(body.paidOn) : null;
    if (!paidOn || Number.isNaN(paidOn.getTime())) {
      return NextResponse.json({ error: 'La date du paiement est invalide.' }, { status: 400 });
    }
    data.paidOn = paidOn;
  }

  if (METHODES_PAIEMENT.includes(body.method)) data.method = body.method;
  if (typeof body.note === 'string') data.note = body.note;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à modifier.' }, { status: 400 });
  }

  try {
    const paiement = await prisma.lapsPayment.update({ where: { id }, data });
    return NextResponse.json(paiement);
  } catch {
    return NextResponse.json({ error: 'Paiement introuvable.' }, { status: 404 });
  }
}

/** DELETE /api/admin/laps/paiements/[id] — suppression définitive. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  try {
    await prisma.lapsPayment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Paiement introuvable.' }, { status: 404 });
  }
}
