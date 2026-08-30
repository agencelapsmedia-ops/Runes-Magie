import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { traiterItemsGeneration } from '@/lib/social-generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/social/batches/tick — relance de génération depuis l'admin
 * (l'interface l'appelle en tâche de fond tant qu'un lot est en cours ; le
 * cron externe /api/cron/social-generate finit le travail sinon).
 */
export async function POST() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const resultat = await traiterItemsGeneration(2);
  return NextResponse.json(resultat);
}
