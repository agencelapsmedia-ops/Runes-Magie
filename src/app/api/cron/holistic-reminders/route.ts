import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  buildBookingEmailData,
  sendReminderToClient,
  sendDailyAgendaToPractitioner,
  type AgendaItem,
} from '@/lib/holistic-booking-email';
import { isInternalEmail } from '@/lib/holistic-clients';
import { releaseExpiredInteracHolds } from '@/lib/holistic-interac-release';

/**
 * GET /api/cron/holistic-reminders
 *
 * Envoie deux rappels au client : 3 jours avant et 24h avant le RDV.
 * Dédoublonné par `reminder3dSentAt` / `reminder24hSentAt`.
 * Auth : header x-cron-secret OU authorization: Bearer == process.env.CRON_SECRET.
 *
 * Cron QUOTIDIEN (vercel.json, plan Vercel gratuit = 1 passage/jour).
 * Fenêtres LARGES avec rattrapage : si un passage échoue (cron raté, erreur),
 * le rappel part au passage suivant au lieu d'être perdu — ce sont les flags
 * `reminder3dSentAt` / `reminder24hSentAt` qui garantissent l'unicité, pas la
 * largeur des fenêtres. Les deux fenêtres ne se chevauchent pas (bornées à 36h) :
 * un RDV reçoit d'abord le rappel « 3 jours », puis le rappel « demain ».
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
  const h = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);
  // Fenêtres larges (rattrapage inclus), sans chevauchement entre elles :
  const lo3d = h(36), hi3d = h(84);  // « dans 3 jours » : RDV à 36–84h (rattrape un passage manqué)
  const lo24h = h(2), hi24h = h(36); // « demain/aujourd'hui » : RDV à 2–36h (libellé adapté à l'envoi)

  let sent3d = 0;
  let sent24h = 0;
  let failed = 0;

  // Rappel 3 jours : RDV dans (60h, 84h], pas encore envoyé
  const due3d = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminder3dSentAt: null,
      startsAt: { gt: lo3d, lte: hi3d },
    },
    select: { id: true },
  });
  for (const a of due3d) {
    try {
      const data = await buildBookingEmailData(a.id);
      if (data) {
        if (isInternalEmail(data.clientEmail)) {
          // Compte interne (sans courriel) → on marque comme traité sans envoyer.
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder3dSentAt: new Date() } });
        } else {
          await sendReminderToClient(data, '3d');
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder3dSentAt: new Date() } });
          sent3d++;
        }
      }
    } catch (err) {
      failed++;
      console.error('[cron rappel 3j] échec', { appointmentId: a.id, err });
    }
  }

  // Rappel « demain » : RDV dans (12h, 36h], pas encore envoyé
  const due24h = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminder24hSentAt: null,
      startsAt: { gt: lo24h, lte: hi24h },
    },
    select: { id: true },
  });
  for (const a of due24h) {
    try {
      const data = await buildBookingEmailData(a.id);
      if (data) {
        if (isInternalEmail(data.clientEmail)) {
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder24hSentAt: new Date() } });
        } else {
          await sendReminderToClient(data, '24h');
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder24hSentAt: new Date() } });
          sent24h++;
        }
      }
    } catch (err) {
      failed++;
      console.error('[cron rappel 24h] échec', { appointmentId: a.id, err });
    }
  }

  // Récap quotidien PRATICIENNE : un courriel par praticienne listant ses RDV de
  // « demain » (fenêtre 12–36h dédiée — indépendante du rattrapage client pour que
  // le mot « demain » reste exact). Un seul passage/jour → pas de flag nécessaire.
  let sentAgenda = 0;
  try {
    const tomorrow = await prisma.holisticAppointment.findMany({
      where: { status: 'CONFIRMED', startsAt: { gt: h(12), lte: h(36) } },
      include: {
        client: { select: { firstName: true, lastName: true } },
        practitioner: { include: { user: { select: { firstName: true, email: true } } } },
      },
      orderBy: { startsAt: 'asc' },
    });
    const byPractitioner = new Map<string, { email: string; firstName: string; items: AgendaItem[] }>();
    for (const a of tomorrow) {
      const key = a.practitionerId;
      const entry = byPractitioner.get(key) ?? {
        email: a.practitioner.user.email,
        firstName: a.practitioner.user.firstName,
        items: [],
      };
      entry.items.push({
        when: a.startsAt,
        clientName: `${a.client.firstName} ${a.client.lastName}`.trim(),
        durationMin: Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60000),
      });
      byPractitioner.set(key, entry);
    }
    for (const p of byPractitioner.values()) {
      if (isInternalEmail(p.email)) continue;
      await sendDailyAgendaToPractitioner(p.email, p.firstName, p.items);
      sentAgenda++;
    }
  } catch (err) {
    failed++;
    console.error('[cron agenda praticienne] échec', err);
  }

  // Filet quotidien : libère les RDV Interac impayés > 30 min (le ménage paresseux
  // de la page de réservation fait la même chose en continu).
  let interacReleased = 0;
  try {
    interacReleased = await releaseExpiredInteracHolds();
  } catch (err) {
    failed++;
    console.error('[cron interac-release] échec', err);
  }

  return NextResponse.json({ sent3d, sent24h, sentAgenda, interacReleased, failed });
}
