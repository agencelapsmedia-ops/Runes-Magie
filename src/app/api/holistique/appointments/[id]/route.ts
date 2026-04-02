import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  const role = (session.user as any).role;

  const appointment = await prisma.holisticAppointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const updated = await prisma.holisticAppointment.update({
    where: { id },
    data: {
      status,
      ...(status === 'CANCELLED' ? { cancelledAt: new Date(), cancelledBy: role } : {}),
    },
  });

  return NextResponse.json(updated);
}
