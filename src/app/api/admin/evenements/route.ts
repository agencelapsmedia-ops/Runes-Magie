import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Transforme un titre en identifiant d'URL : « Rituel de Lughnasadh » → « rituel-de-lughnasadh ». */
function versSlug(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const evenements = await prisma.event.findMany({
    orderBy: { startsAt: 'desc' },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });
  return NextResponse.json({ evenements });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const corps = (await req.json()) as Record<string, unknown>;

  const titre = typeof corps.title === 'string' ? corps.title.trim() : '';
  const description = typeof corps.description === 'string' ? corps.description.trim() : '';
  const lieu = typeof corps.location === 'string' ? corps.location.trim() : '';
  const capacite = Number(corps.capacity);
  const debut = corps.startsAt ? new Date(String(corps.startsAt)) : null;

  if (!titre) return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'La description est requise.' }, { status: 400 });
  if (!lieu) return NextResponse.json({ error: 'Le lieu est requis.' }, { status: 400 });
  if (!debut || Number.isNaN(debut.getTime())) {
    return NextResponse.json({ error: 'La date de début est invalide.' }, { status: 400 });
  }
  if (!Number.isInteger(capacite) || capacite < 1) {
    return NextResponse.json({ error: 'Le nombre de places doit être un entier positif.' }, { status: 400 });
  }

  // Alignée sur PATCH ([id]/route.ts) : une date de fin invalide est refusée,
  // jamais mise à `null` en silence.
  const fin = corps.endsAt ? new Date(String(corps.endsAt)) : null;
  if (corps.endsAt && (!fin || Number.isNaN(fin.getTime()))) {
    return NextResponse.json({ error: 'La date de fin est invalide.' }, { status: 400 });
  }
  if (fin && fin.getTime() <= debut.getTime()) {
    return NextResponse.json({ error: 'La fin doit suivre le début.' }, { status: 400 });
  }

  // Slug unique : on suffixe si le titre est déjà pris.
  const base = versSlug(titre) || 'evenement';
  let slug = base;
  for (let n = 2; await prisma.event.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  const evenement = await prisma.event.create({
    data: {
      slug,
      title: titre,
      excerpt: typeof corps.excerpt === 'string' ? corps.excerpt.trim() || null : null,
      description,
      imageUrl: typeof corps.imageUrl === 'string' ? corps.imageUrl.trim() || null : null,
      startsAt: debut,
      endsAt: fin,
      location: lieu,
      isOnline: corps.isOnline === true,
      onlineUrl: typeof corps.onlineUrl === 'string' ? corps.onlineUrl.trim() || null : null,
      capacity: capacite,
      bringItems: typeof corps.bringItems === 'string' ? corps.bringItems.trim() || null : null,
      isPublished: corps.isPublished === true,
    },
  });

  return NextResponse.json({ evenement }, { status: 201 });
}
