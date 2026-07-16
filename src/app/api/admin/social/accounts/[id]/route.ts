import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { chiffrerToken, chiffrementConfigure } from '@/lib/social-crypto';
import { serialiserCompte } from '@/lib/social-accounts';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/social/accounts/[id] — modification champ par champ. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ('label' in body && typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if ('externalId' in body && typeof body.externalId === 'string' && body.externalId.trim()) {
    data.externalId = body.externalId.trim();
  }
  if ('isActive' in body && typeof body.isActive === 'boolean') data.isActive = body.isActive;
  if ('parentAccountId' in body) {
    data.parentAccountId = typeof body.parentAccountId === 'string' && body.parentAccountId ? body.parentAccountId : null;
  }
  if ('accessToken' in body && typeof body.accessToken === 'string' && body.accessToken.trim()) {
    if (!chiffrementConfigure()) {
      return NextResponse.json(
        { error: "Le chiffrement des jetons n'est pas configuré (SOCIAL_TOKEN_ENCRYPTION_KEY absente)." },
        { status: 503 },
      );
    }
    const token = body.accessToken.trim();
    data.encryptedAccessToken = chiffrerToken(token);
    data.tokenLastFour = token.slice(-4);
    // Nouveau jeton = état de connexion à re-vérifier
    data.connectionStatus = 'CONNECTED';
    data.lastTestedAt = null;
    data.lastTestSucceeded = null;
    data.lastTestError = null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à modifier.' }, { status: 400 });
  }

  try {
    const compte = await prisma.socialAccount.update({ where: { id }, data });
    return NextResponse.json(serialiserCompte(compte));
  } catch {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }
}

/** DELETE /api/admin/social/accounts/[id] — suppression (refusée si historique publié). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const jobsPublies = await prisma.socialPublishJob.count({ where: { accountId: id, status: 'PUBLIE' } });
  if (jobsPublies > 0) {
    return NextResponse.json(
      { error: `Ce compte a ${jobsPublies} publication(s) dans l'historique — désactive-le plutôt que de le supprimer.` },
      { status: 409 },
    );
  }

  try {
    // Les jobs non publiés rattachés (ERREUR/EN_ATTENTE) sont retirés d'abord (FK RESTRICT).
    await prisma.$transaction([
      prisma.socialPublishJob.deleteMany({ where: { accountId: id } }),
      prisma.socialAccount.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }
}
