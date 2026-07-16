import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { chiffrerToken, chiffrementConfigure } from '@/lib/social-crypto';
import { ORGANIZATION_ID, RESEAUX } from '@/lib/social-constants';
import { serialiserCompte } from '@/lib/social-accounts';

export const dynamic = 'force-dynamic';

/** GET /api/admin/social/accounts — liste des comptes (jetons masqués). */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const comptes = await prisma.socialAccount.findMany({
    where: { organizationId: ORGANIZATION_ID },
    orderBy: [{ network: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(comptes.map(serialiserCompte));
}

/** POST /api/admin/social/accounts — ajoute un compte (jeton chiffré). */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  if (!chiffrementConfigure()) {
    return NextResponse.json(
      { error: "Le chiffrement des jetons n'est pas configuré (SOCIAL_TOKEN_ENCRYPTION_KEY absente dans Vercel)." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const network = typeof body.network === 'string' ? body.network.trim().toUpperCase() : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const externalId = typeof body.externalId === 'string' ? body.externalId.trim() : '';
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
  const parentAccountId = typeof body.parentAccountId === 'string' && body.parentAccountId ? body.parentAccountId : null;

  if (!(RESEAUX as readonly string[]).includes(network)) {
    return NextResponse.json({ error: 'Réseau invalide (FACEBOOK ou INSTAGRAM).' }, { status: 400 });
  }
  if (!label || !externalId || !accessToken) {
    return NextResponse.json({ error: 'Libellé, identifiant et jeton sont requis.' }, { status: 400 });
  }
  if (parentAccountId) {
    const parent = await prisma.socialAccount.findUnique({ where: { id: parentAccountId } });
    if (!parent) return NextResponse.json({ error: 'Compte parent introuvable.' }, { status: 400 });
  }

  try {
    const compte = await prisma.socialAccount.create({
      data: {
        organizationId: ORGANIZATION_ID,
        network,
        label,
        externalId,
        encryptedAccessToken: chiffrerToken(accessToken),
        tokenLastFour: accessToken.slice(-4),
        parentAccountId,
      },
    });
    return NextResponse.json(serialiserCompte(compte), { status: 201 });
  } catch (e) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ce compte (réseau + identifiant) existe déjà.' }, { status: 409 });
    }
    throw e;
  }
}
