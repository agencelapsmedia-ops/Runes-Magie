import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { calculerCreneaux } from '@/lib/creneaux';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const params = new URL(req.url).searchParams;
  const practitionerId = params.get('practitionerId');
  const date = params.get('date');
  const offeringId = params.get('offeringId');

  if (!practitionerId || !date || !offeringId) {
    return NextResponse.json(
      { error: 'Paramètres requis : practitionerId, date, offeringId.' },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Date attendue au format AAAA-MM-JJ.' }, { status: 400 });
  }

  const resultat = await calculerCreneaux({ practitionerId, date, offeringId });
  return NextResponse.json(resultat);
}
