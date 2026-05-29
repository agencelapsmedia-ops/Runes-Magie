import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.practitioner.findUnique({
    where: { id, status: 'APPROVED' },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      availabilities: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
      reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
    },
  });
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Charge les RDV qui occupent un créneau dans les 60 prochains jours
  // (CONFIRMED = paiement reçu, ou PENDING < 1h = en cours de paiement)
  const now = new Date();
  const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const bookedAppointments = await prisma.holisticAppointment.findMany({
    where: {
      practitionerId: id,
      startsAt: { gte: now, lt: future },
      OR: [
        { status: 'CONFIRMED' },
        { status: 'PENDING', createdAt: { gte: oneHourAgo } }, // ignore les vieux PENDING fantômes
      ],
    },
    select: { startsAt: true, endsAt: true, status: true },
  });

  return NextResponse.json({ ...p, bookedAppointments });
}
