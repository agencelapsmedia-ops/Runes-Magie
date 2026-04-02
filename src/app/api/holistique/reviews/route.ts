import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';

export async function POST(req: Request) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { appointmentId, rating, comment } = await req.json();
  const clientId = (session.user as any).id;

  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId, clientId, status: 'COMPLETED' },
  });
  if (!appointment) return NextResponse.json({ error: 'Consultation introuvable' }, { status: 404 });

  const review = await prisma.holisticReview.create({
    data: {
      appointmentId,
      clientId,
      practitionerId: appointment.practitionerId,
      rating: Math.min(5, Math.max(1, rating)),
      comment,
      status: 'PENDING',
    },
  });

  return NextResponse.json(review, { status: 201 });
}
