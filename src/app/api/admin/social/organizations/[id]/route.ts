import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { ORGANIZATION_ID } from '@/lib/social-constants';
import { getOrganisation, normaliserCharte } from '@/lib/organizations';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/social/organizations/[id] — { name?, charte?, isActive? }.
 * La charte reçue est fusionnée avec la charte actuelle (champ par champ).
 * Crée la ligne au passage si la marque n'existait que virtuellement (R&M).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const actuelle = await getOrganisation(id);
  if (!actuelle) return NextResponse.json({ error: 'Marque introuvable.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name =
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : actuelle.name;
  const charte =
    'charte' in body ? normaliserCharte(body.charte, actuelle.charte) : actuelle.charte;
  const isActive =
    typeof body.isActive === 'boolean'
      ? body.isActive || id === ORGANIZATION_ID // la marque par défaut reste active
      : actuelle.isActive;

  const org = await prisma.organization.upsert({
    where: { id },
    update: { name, charte: JSON.parse(JSON.stringify(charte)), isActive },
    create: { id, name, charte: JSON.parse(JSON.stringify(charte)), isActive },
  });

  return NextResponse.json({ id: org.id, name: org.name, charte, isActive: org.isActive });
}
