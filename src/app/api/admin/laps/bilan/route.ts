import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { auCent, bilan, cleMois, montantAction } from '@/lib/laps-facturation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/laps/bilan — totaux (facturé, payé, solde dû) et rapport mensuel
 * des heures facturées vs non facturées. Les calculs sont faits ici pour que le
 * bandeau de la page n'ait pas à recharger toutes les lignes.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const [actions, paiements] = await Promise.all([
    prisma.lapsAction.findMany({
      select: { doneOn: true, minutes: true, hourlyRate: true, billable: true },
    }),
    prisma.lapsPayment.findMany({ select: { amount: true } }),
  ]);

  const totaux = bilan(actions, paiements);

  const parMois = new Map<
    string,
    { mois: string; minutesFacturables: number; minutesNonFacturables: number; montant: number }
  >();
  for (const a of actions) {
    const cle = cleMois(a.doneOn);
    const ligne = parMois.get(cle) ?? { mois: cle, minutesFacturables: 0, minutesNonFacturables: 0, montant: 0 };
    if (a.billable) {
      ligne.minutesFacturables += a.minutes;
      ligne.montant = auCent(ligne.montant + montantAction(a));
    } else {
      ligne.minutesNonFacturables += a.minutes;
    }
    parMois.set(cle, ligne);
  }

  return NextResponse.json({
    ...totaux,
    nbActions: actions.length,
    nbPaiements: paiements.length,
    parMois: [...parMois.values()].sort((a, b) => b.mois.localeCompare(a.mois)),
  });
}
