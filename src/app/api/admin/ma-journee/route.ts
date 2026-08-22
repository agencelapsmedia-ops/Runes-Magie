import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ma-journee — données du poste de pilotage quotidien de Noctura :
 * RDV d'aujourd'hui et de demain, alertes actionnables (Interac à confirmer,
 * séances passées à compléter), compteurs du mois.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const now = new Date();
  const debutJour = new Date(now); debutJour.setHours(0, 0, 0, 0);
  const finDemain = new Date(debutJour.getTime() + 2 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

  const selectRdv = {
    id: true, startsAt: true, endsAt: true, status: true, notes: true,
    paymentMode: true, totalAmount: true, depositAmount: true, remainingAmount: true,
    depositPaidAt: true, completionOutcome: true,
    formationEnrollmentId: true,
    client: { select: { id: true, firstName: true, lastName: true, phone: true } },
    payment: { select: { status: true, amountTotal: true } },
  } as const;

  const [rdvJour, interacEnAttente, aCompleter, statsMois, rdvAVenir] = await Promise.all([
    // RDV aujourd'hui + demain (toutes praticiennes, non annulés)
    prisma.holisticAppointment.findMany({
      where: { startsAt: { gte: debutJour, lt: finDemain }, status: { not: 'CANCELLED' } },
      orderBy: { startsAt: 'asc' },
      select: selectRdv,
    }),
    // Interac non confirmés (argent peut-être jamais reçu)
    prisma.holisticAppointment.findMany({
      where: {
        paymentMode: { in: ['INTERAC', 'STRIPE_LINK'] },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        payment: { status: 'PENDING' },
      },
      orderBy: { startsAt: 'asc' },
      take: 10,
      select: selectRdv,
    }),
    // Séances passées confirmées jamais complétées (soldes à charger / cours à valider)
    prisma.holisticAppointment.findMany({
      where: { status: 'CONFIRMED', endsAt: { lt: now }, depositPaidAt: { not: null } },
      orderBy: { startsAt: 'asc' },
      take: 10,
      select: selectRdv,
    }),
    // Compteurs du mois
    prisma.holisticPayment.aggregate({
      where: { status: 'PAID', paidAt: { gte: debutMois } },
      _sum: { amountTotal: true },
    }),
    prisma.holisticAppointment.count({
      where: { status: 'CONFIRMED', startsAt: { gt: now } },
    }),
  ]);

  const completeesMois = await prisma.holisticAppointment.count({
    where: { status: 'COMPLETED', startsAt: { gte: debutMois } },
  });

  return NextResponse.json({
    rdvJour,
    interacEnAttente,
    aCompleter,
    stats: {
      revenusMois: statsMois._sum.amountTotal ?? 0,
      completeesMois,
      rdvAVenir,
    },
  });
}
