import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { dechiffrerToken, chiffrementConfigure } from '@/lib/social-crypto';
import { GRAPH_VERSION } from '@/lib/social-constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social/accounts/[id]/test — « Tester la connexion ».
 * Interroge l'API Graph (?fields=name) et met à jour l'état de connexion.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const compte = await prisma.socialAccount.findUnique({ where: { id } });
  if (!compte) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  if (!chiffrementConfigure()) {
    return NextResponse.json(
      { error: "Le chiffrement des jetons n'est pas configuré (SOCIAL_TOKEN_ENCRYPTION_KEY absente)." },
      { status: 503 },
    );
  }

  let ok = false;
  let name: string | null = null;
  let erreur: string | null = null;
  let connectionStatus = compte.connectionStatus;

  try {
    const token = dechiffrerToken(compte.encryptedAccessToken);
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(compte.externalId)}?fields=name&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.name) {
      ok = true;
      name = data.name as string;
      connectionStatus = 'CONNECTED';
    } else {
      const graphErr = data?.error ?? {};
      erreur = graphErr.message ?? `Réponse inattendue de Meta (HTTP ${res.status}).`;
      // Classement de l'état selon le code Graph (190 = jeton, 10/200-299 = permissions)
      if (graphErr.code === 190) {
        connectionStatus = graphErr.error_subcode === 463 ? 'EXPIRED' : 'INVALID';
      } else if (graphErr.code === 10 || (graphErr.code >= 200 && graphErr.code <= 299)) {
        connectionStatus = 'PERMISSION_MISSING';
      } else {
        connectionStatus = 'INVALID';
      }
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'Impossible de joindre l’API de Meta.';
  }

  const maj = await prisma.socialAccount.update({
    where: { id },
    data: {
      lastTestedAt: new Date(),
      lastTestSucceeded: ok,
      lastTestError: erreur,
      connectionStatus,
    },
  });

  return NextResponse.json({
    ok,
    name,
    error: erreur,
    connectionStatus: maj.connectionStatus,
  });
}
