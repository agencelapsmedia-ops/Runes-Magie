import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { annulerParMembre } from '@/lib/evenements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const inscriptions = await prisma.eventRegistration.findMany({
    where: { userId, status: 'CONFIRMED' },
    include: { event: true },
    orderBy: { event: { startsAt: 'asc' } },
  });
  return NextResponse.json({ inscriptions });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { registrationId } = (await req.json()) as { registrationId?: string };
  if (!registrationId) {
    return NextResponse.json({ error: 'Inscription non précisée.' }, { status: 400 });
  }

  const annulee = await annulerParMembre(registrationId, userId);
  if (!annulee) {
    return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
