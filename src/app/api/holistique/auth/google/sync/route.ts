import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncFutureConfirmedAppointments } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

/**
 * POST /api/holistique/auth/google/sync
 * Resynchronise (rattrapage) les RDV futurs déjà confirmés de la praticienne
 * connectée vers son Google Agenda. Retourne { synced, total }.
 */
export async function POST() {
  const session = await auth();
  const practitionerId = (session?.user as { practitionerId?: string } | undefined)?.practitionerId;
  if (!practitionerId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const result = await syncFutureConfirmedAppointments(practitionerId);
  return NextResponse.json(result);
}
