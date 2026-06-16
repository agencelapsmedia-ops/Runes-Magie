import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildBookingEmailData, sendReminderToClient } from '@/lib/holistic-booking-email';

/**
 * GET /api/cron/holistic-reminders
 *
 * Envoie deux rappels au client : 3 jours avant et 24h avant le RDV.
 * Dédoublonné par `reminder3dSentAt` / `reminder24hSentAt`.
 * Auth : header x-cron-secret OU authorization: Bearer == process.env.CRON_SECRET.
 * Cron horaire (vercel.json).
 */

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return !!secret && secret === process.env.CRON_SECRET;
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  let sent3d = 0;
  let sent24h = 0;
  let failed = 0;

  // Rappel 3 jours : commence dans (24h, 72h], pas encore envoyé
  const due3d = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminder3dSentAt: null,
      startsAt: { gt: in24h, lte: in72h },
    },
    select: { id: true },
  });
  for (const a of due3d) {
    try {
      const data = await buildBookingEmailData(a.id);
      if (data) {
        await sendReminderToClient(data, '3d');
        await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder3dSentAt: new Date() } });
        sent3d++;
      }
    } catch (err) {
      failed++;
      console.error('[cron rappel 3j] échec', { appointmentId: a.id, err });
    }
  }

  // Rappel 24h : commence dans (now, 24h], pas encore envoyé
  const due24h = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminder24hSentAt: null,
      startsAt: { gt: now, lte: in24h },
    },
    select: { id: true },
  });
  for (const a of due24h) {
    try {
      const data = await buildBookingEmailData(a.id);
      if (data) {
        await sendReminderToClient(data, '24h');
        await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder24hSentAt: new Date() } });
        sent24h++;
      }
    } catch (err) {
      failed++;
      console.error('[cron rappel 24h] échec', { appointmentId: a.id, err });
    }
  }

  return NextResponse.json({ sent3d, sent24h, failed });
}
