import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { holisticSession } from '@/lib/holistic-auth';

export async function POST(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await holisticSession();
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { appointmentId } = await params;
  const appointment = await prisma.holisticAppointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  if (appointment.dailyRoomUrl) {
    return NextResponse.json({ url: appointment.dailyRoomUrl });
  }

  const roomName = `rm-${appointmentId.slice(0, 12)}`;

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        exp: Math.round(appointment.endsAt.getTime() / 1000) + 3600,
        max_participants: 2,
        enable_screenshare: false,
        enable_chat: true,
        lang: 'fr',
      },
    }),
  });

  const room = await response.json();

  await prisma.holisticAppointment.update({
    where: { id: appointmentId },
    data: { dailyRoomUrl: room.url, dailyRoomName: roomName },
  });

  return NextResponse.json({ url: room.url });
}
