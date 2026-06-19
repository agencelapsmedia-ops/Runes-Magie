import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import {
  LANDING_TEXT_FIELDS,
  LANDING_LIST_FIELDS,
  FONT_FIELDS,
  TITLE_FONT_FIELDS,
  parseLandingOverrides,
} from '@/lib/service-landing';

// Champs stockés directement comme colonnes de l'Offering (partagés ailleurs :
// cartes de service, menus, méta SEO).
const COLUMN_FIELDS = ['name', 'description', 'longDescription', 'imageUrl', 'features'] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const data: Prisma.OfferingUpdateInput = {};

  // 1) Champs-colonnes
  for (const field of COLUMN_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];

    if (field === 'features') {
      if (!Array.isArray(value)) {
        return NextResponse.json({ error: 'Le champ features doit etre une liste.' }, { status: 400 });
      }
      data.features = value.map((item) => String(item).trim()).filter(Boolean);
      continue;
    }

    if (value === null && field === 'imageUrl') {
      data.imageUrl = null;
      continue;
    }

    if (typeof value !== 'string') {
      return NextResponse.json({ error: `Le champ ${field} doit etre du texte.` }, { status: 400 });
    }

    data[field] = value.trim();
  }

  // 2) Textes personnalisés de la page (stockés dans landingContent JSON)
  const landingPatch: Record<string, unknown> = {};
  for (const field of LANDING_TEXT_FIELDS) {
    if (!(field in body)) continue;
    if (typeof body[field] !== 'string') {
      return NextResponse.json({ error: `Le champ ${field} doit etre du texte.` }, { status: 400 });
    }
    landingPatch[field] = body[field];
  }
  for (const field of LANDING_LIST_FIELDS) {
    if (!(field in body)) continue;
    if (!Array.isArray(body[field])) {
      return NextResponse.json({ error: `Le champ ${field} doit etre une liste.` }, { status: 400 });
    }
    landingPatch[field] = body[field];
  }
  for (const field of FONT_FIELDS) {
    if (!(field in body)) continue;
    if (typeof body[field] !== 'string') {
      return NextResponse.json({ error: `Le champ ${field} doit etre du texte.` }, { status: 400 });
    }
    landingPatch[field] = body[field];
  }
  // Polices par titre : une valeur vide (« par défaut ») fait hériter de la police globale.
  for (const field of TITLE_FONT_FIELDS) {
    if (!(field in body)) continue;
    if (typeof body[field] !== 'string') {
      return NextResponse.json({ error: `Le champ ${field} doit etre du texte.` }, { status: 400 });
    }
    landingPatch[field] = body[field];
  }

  if (Object.keys(landingPatch).length > 0) {
    const existing = await prisma.offering.findUnique({
      where: { id },
      select: { landingContent: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Service introuvable.' }, { status: 404 });
    }
    const existingOverrides = parseLandingOverrides(existing.landingContent);
    // Fusion puis nettoyage : un champ vidé revient au texte par défaut.
    const merged = parseLandingOverrides({ ...existingOverrides, ...landingPatch });
    data.landingContent = merged as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Aucun champ modifiable fourni.' }, { status: 400 });
  }

  const offering = await prisma.offering.update({
    where: { id },
    data,
    select: { slug: true },
  });

  revalidatePath('/seances');
  revalidatePath(`/seances/${offering.slug}`);
  revalidatePath('/ecole');
  revalidatePath(`/ecole/${offering.slug}`);
  revalidatePath('/admin/offerings');

  return NextResponse.json({ ok: true });
}
