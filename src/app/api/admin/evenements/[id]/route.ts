import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Accorde « personne(s) est/sont inscrite(s) » selon le nombre. */
function accordInscrits(n: number): string {
  return n > 1 ? `${n} personnes sont` : `${n} personne est`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const evenement = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ evenement });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const existant = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });
  if (!existant) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  const corps = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (corps.title !== undefined) {
    const titre = typeof corps.title === 'string' ? corps.title.trim() : '';
    if (!titre) return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 });
    data.title = titre;
  }

  if (corps.description !== undefined) {
    const description = typeof corps.description === 'string' ? corps.description.trim() : '';
    if (!description) return NextResponse.json({ error: 'La description est requise.' }, { status: 400 });
    data.description = description;
  }

  if (corps.location !== undefined) {
    const lieu = typeof corps.location === 'string' ? corps.location.trim() : '';
    if (!lieu) return NextResponse.json({ error: 'Le lieu est requis.' }, { status: 400 });
    data.location = lieu;
  }

  if (corps.excerpt !== undefined) {
    data.excerpt = typeof corps.excerpt === 'string' ? corps.excerpt.trim() || null : null;
  }

  if (corps.imageUrl !== undefined) {
    data.imageUrl = typeof corps.imageUrl === 'string' ? corps.imageUrl.trim() || null : null;
  }

  if (corps.isOnline !== undefined) {
    data.isOnline = corps.isOnline === true;
  }

  if (corps.onlineUrl !== undefined) {
    data.onlineUrl = typeof corps.onlineUrl === 'string' ? corps.onlineUrl.trim() || null : null;
  }

  if (corps.bringItems !== undefined) {
    data.bringItems = typeof corps.bringItems === 'string' ? corps.bringItems.trim() || null : null;
  }

  if (corps.isPublished !== undefined) {
    data.isPublished = corps.isPublished === true;
  }

  // Dates : on valide contre la valeur finale (fournie ou existante), pas seulement
  // entre elles deux prises isolément.
  let debut = existant.startsAt;
  if (corps.startsAt !== undefined) {
    const d = corps.startsAt ? new Date(String(corps.startsAt)) : null;
    if (!d || Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'La date de début est invalide.' }, { status: 400 });
    }
    debut = d;
    data.startsAt = d;
  }

  let fin = existant.endsAt;
  if (corps.endsAt !== undefined) {
    const f = corps.endsAt ? new Date(String(corps.endsAt)) : null;
    if (corps.endsAt && (!f || Number.isNaN(f.getTime()))) {
      return NextResponse.json({ error: 'La date de fin est invalide.' }, { status: 400 });
    }
    fin = f;
    data.endsAt = f;
  }

  if (fin && fin.getTime() <= debut.getTime()) {
    return NextResponse.json({ error: 'La fin doit suivre le début.' }, { status: 400 });
  }

  // Capacité : jamais sous le nombre d'inscrits déjà confirmés.
  if (corps.capacity !== undefined) {
    const capacite = Number(corps.capacity);
    if (!Number.isInteger(capacite) || capacite < 1) {
      return NextResponse.json({ error: 'Le nombre de places doit être un entier positif.' }, { status: 400 });
    }
    const inscrits = existant._count.registrations;
    if (capacite < inscrits) {
      return NextResponse.json(
        {
          error: `${accordInscrits(inscrits)} déjà inscrite${inscrits > 1 ? 's' : ''}, le nombre de places ne peut pas descendre sous ${inscrits}.`,
        },
        { status: 409 },
      );
    }
    data.capacity = capacite;
  }

  const evenement = await prisma.event.update({ where: { id }, data });

  return NextResponse.json({ evenement });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const evenement = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  const inscrits = evenement._count.registrations;
  if (inscrits > 0) {
    return NextResponse.json(
      {
        error: `Annulez l'événement plutôt que de le supprimer : ${inscrits} personne${inscrits > 1 ? 's' : ''} inscrite${inscrits > 1 ? 's' : ''}.`,
      },
      { status: 409 },
    );
  }

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
