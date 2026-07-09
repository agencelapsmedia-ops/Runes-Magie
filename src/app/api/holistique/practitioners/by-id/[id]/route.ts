import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getBusyPeriods } from '@/lib/google-calendar';
import { releaseExpiredInteracHolds } from '@/lib/holistic-interac-release';

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

  // Charge les RDV CONFIRMÉS (paiement reçu) qui occupent un créneau dans les
  // 120 prochains jours. On ne masque PAS un créneau pour un simple « en attente »
  // (paiement non complété) : un créneau ne disparaît du calendrier que lorsqu'il
  // est réellement payé. La protection anti-double-réservation pendant le paiement
  // est gérée côté checkout. 120 j couvre la navigation par mois du calendrier.
  const now = new Date();
  const future = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

  // Ménage paresseux : supprime les réservations « en attente » abandonnées (> 30 min,
  // après expiration du lien Stripe). Paiement d'abord (FK) puis RDV — même ordre que
  // l'endpoint cancel-pending.
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const stale = await prisma.holisticAppointment.findMany({
    where: { status: 'PENDING', createdAt: { lt: thirtyMinAgo } },
    select: { id: true },
  });
  if (stale.length) {
    const staleIds = stale.map((s) => s.id);
    await prisma.holisticPayment.deleteMany({ where: { appointmentId: { in: staleIds } } });
    await prisma.holisticAppointment.deleteMany({ where: { id: { in: staleIds } } });
  }

  // Ménage paresseux Interac : les RDV Interac impayés depuis > 30 min sont annulés
  // (créneau libéré + courriel à la cliente). Best-effort, ne bloque jamais la page.
  try {
    await releaseExpiredInteracHolds();
  } catch (err) {
    console.error('[by-id] libération Interac échouée (non-bloquant)', err);
  }

  const bookedAppointments = await prisma.holisticAppointment.findMany({
    where: {
      practitionerId: id,
      startsAt: { gte: now, lt: future },
      status: 'CONFIRMED',
    },
    select: { startsAt: true, endsAt: true, status: true },
  });

  // Sens entrant Google → site : si la praticienne a connecté son agenda, on
  // retire aussi les créneaux où elle est occupée dans Google (perso, autre RDV…).
  // Horizon 90 j (limite raisonnable pour free/busy ; les RDV se prennent à court terme).
  let googleBusy: { startsAt: string; endsAt: string }[] = [];
  if (p.googleRefreshToken) {
    const busyHorizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const busy = await getBusyPeriods(id, now, busyHorizon);
    googleBusy = busy.map((b) => ({ startsAt: b.start, endsAt: b.end }));
  }

  // Sécurité : ne JAMAIS exposer le refresh token Google au navigateur.
  const { googleRefreshToken: _googleRefreshToken, ...safe } = p;
  return NextResponse.json({ ...safe, bookedAppointments, googleBusy });
}
