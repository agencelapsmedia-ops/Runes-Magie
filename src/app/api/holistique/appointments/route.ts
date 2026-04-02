import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';

export async function GET(req: Request) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role === 'CLIENT') {
    const appointments = await prisma.holisticAppointment.findMany({
      where: { clientId: userId },
      include: {
        practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
        payment: true,
      },
      orderBy: { startsAt: 'desc' },
    });
    return NextResponse.json(appointments);
  }

  if (role === 'PRACTITIONER') {
    const practitioner = await prisma.practitioner.findUnique({ where: { userId } });
    if (!practitioner) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 404 });

    const appointments = await prisma.holisticAppointment.findMany({
      where: { practitionerId: practitioner.id },
      include: {
        client: { select: { firstName: true, lastName: true, email: true } },
        payment: true,
      },
      orderBy: { startsAt: 'asc' },
    });
    return NextResponse.json(appointments);
  }

  return NextResponse.json({ error: 'Rôle invalide' }, { status: 403 });
}

export async function POST(req: Request) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { practitionerId, startsAt, endsAt, notes } = body;
  const clientId = (session.user as any).id;

  if (!practitionerId || !startsAt || !endsAt) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Vérifier disponibilité (pas de conflit)
  const conflict = await prisma.holisticAppointment.findFirst({
    where: {
      practitionerId,
      status: { not: 'CANCELLED' },
      startsAt: { lt: new Date(endsAt) },
      endsAt: { gt: new Date(startsAt) },
    },
  });
  if (conflict) return NextResponse.json({ error: 'Créneau non disponible' }, { status: 409 });

  const appointment = await prisma.holisticAppointment.create({
    data: {
      clientId,
      practitionerId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      notes,
      status: 'PENDING',
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
