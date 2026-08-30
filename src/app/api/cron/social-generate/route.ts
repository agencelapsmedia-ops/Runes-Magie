import { NextResponse } from 'next/server';
import { traiterItemsGeneration } from '@/lib/social-generate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron externe de génération de masse (GitHub Actions / cron-job.org, toutes
 * les 15 min) : traite les items de lots en attente, 2 par passage.
 * Auth : `Authorization: Bearer <CRON_SECRET>` ou `x-cron-secret`.
 */
function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

export async function GET(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const resultat = await traiterItemsGeneration(2);
  return NextResponse.json(resultat);
}
