import { NextResponse } from 'next/server';
import { traiterJobsEchus } from '@/lib/social-publish';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Publie les publications échues. Trois déclencheurs, du plus fin au plus grossier :
 * 1. GitHub Actions `.github/workflows/cron-social.yml` (toutes les 15 min, best effort) ;
 * 2. un cron externe optionnel (ex. cron-job.org) toutes les 10 min ;
 * 3. le cron Vercel quotidien (14h UTC) en dernier filet — le plan Hobby
 *    n'autorise que du quotidien, une fréquence plus fine casse le build.
 * Auth : `Authorization: Bearer <CRON_SECRET>` (envoyé nativement par Vercel
 * Cron et par les déclencheurs externes) ; `x-cron-secret` accepté pour les
 * tests manuels. `?limite=` borne le nombre de jobs traités par passage (1-12).
 */
function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

const LIMITE_DEFAUT = 8;
const LIMITE_MAX = 12;

export async function GET(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const brute = Number(new URL(req.url).searchParams.get('limite'));
  const limite =
    Number.isFinite(brute) && brute >= 1 ? Math.min(Math.floor(brute), LIMITE_MAX) : LIMITE_DEFAUT;

  const resultat = await traiterJobsEchus(limite);
  return NextResponse.json(resultat);
}
