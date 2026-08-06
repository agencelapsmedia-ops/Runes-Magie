import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Neutralise l'injection de formule : une valeur commençant par = + - @
 * est exécutée par Excel à l'ouverture du fichier.
 */
function cellule(valeur: string): string {
  const sur = /^[=+\-@]/.test(valeur) ? `'${valeur}` : valeur;
  return `"${sur.replace(/"/g, '""')}"`;
}

/**
 * GET /api/admin/evenements/[id]/inscrits
 * GET /api/admin/evenements/[id]/inscrits?format=csv
 *
 * Liste les inscrits confirmés d'un événement, en JSON par défaut ou en CSV
 * (BOM UTF-8 + point-virgule) pour ouverture directe dans Excel en français.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const evenement = await prisma.event.findUnique({ where: { id } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  const inscrits = await prisma.eventRegistration.findMany({
    where: { eventId: id, status: 'CONFIRMED' },
    orderBy: { createdAt: 'asc' },
  });

  const url = new URL(req.url);
  if (url.searchParams.get('format') === 'csv') {
    const lignes = [
      ['Prénom', 'Nom', 'Courriel', 'Téléphone', 'Inscrit le', 'Message', 'Cercle public'],
      ...inscrits.map((i) => [
        i.firstName,
        i.lastName,
        i.email,
        i.phone ?? '',
        i.createdAt.toISOString().slice(0, 10),
        i.note ?? '',
        i.showPublicly ? 'Oui' : 'Non',
      ]),
    ];

    const csv = '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inscrits-${evenement.slug}.csv"`,
      },
    });
  }

  return NextResponse.json({ inscrits });
}
