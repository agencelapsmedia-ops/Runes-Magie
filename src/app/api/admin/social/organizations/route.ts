import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import {
  CHARTE_NEUTRE,
  CHARTE_RUNES_ET_MAGIE,
  SLUG_MARQUE_REGEX,
  listeOrganisations,
} from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/** GET /api/admin/social/organizations — toutes les marques (chartes normalisées). */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  return NextResponse.json(await listeOrganisations());
}

/** POST /api/admin/social/organizations — { id (slug), name } → nouvelle marque. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (!SLUG_MARQUE_REGEX.test(id)) {
    return NextResponse.json(
      { error: 'Identifiant invalide : minuscules, chiffres et tirets (2 à 40 caractères).' },
      { status: 400 },
    );
  }
  if (!name) return NextResponse.json({ error: 'Le nom de la marque est requis.' }, { status: 400 });

  const charte = id === ORGANIZATION_ID ? CHARTE_RUNES_ET_MAGIE : CHARTE_NEUTRE;

  try {
    const org = await prisma.organization.create({
      data: { id, name, charte: JSON.parse(JSON.stringify(charte)) },
    });
    return NextResponse.json({ id: org.id, name: org.name, charte, isActive: org.isActive }, { status: 201 });
  } catch (e) {
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Cette marque existe déjà.' }, { status: 409 });
    }
    throw e;
  }
}
