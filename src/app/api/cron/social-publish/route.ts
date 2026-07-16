import { NextResponse } from 'next/server';
import { traiterJobsEchus } from '@/lib/social-publish';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron Vercel (toutes les 10 minutes) : publie les publications échues.
 * Auth principale : `Authorization: Bearer <CRON_SECRET>` (envoyé nativement
 * par Vercel Cron) ; `x-cron-secret` accepté pour les tests manuels.
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

  const resultat = await traiterJobsEchus(8);
  return NextResponse.json(resultat);
}
