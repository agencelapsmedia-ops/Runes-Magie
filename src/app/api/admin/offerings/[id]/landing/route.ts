import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

const EDITABLE_FIELDS = ['name', 'description', 'longDescription', 'imageUrl', 'features'] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const data: Record<string, string | string[] | null> = {};

  for (const field of EDITABLE_FIELDS) {
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
