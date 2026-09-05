import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { formaterDateEvenement } from '@/lib/evenements';
import { FeuillePresencePdf, type LigneFeuille } from '@/lib/pdf/FeuillePresencePdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/evenements/[id]/feuille-presence-pdf
 *
 * La liste des inscrits confirmés avec une case à cocher par personne, à
 * imprimer et emporter au Temple. Les personnes déjà pointées présentes
 * arrivent avec leur case noircie : la feuille reste utilisable après un
 * premier pointage à l'écran.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;

  const evenement = await prisma.event.findUnique({ where: { id } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  const inscrits = await prisma.eventRegistration.findMany({
    where: { eventId: id, status: 'CONFIRMED' },
    // Tri alphabétique et non par date d'inscription : au Temple, on cherche un
    // nom dans une liste, pas l'ordre dans lequel les gens se sont inscrits.
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });

  const lignes: LigneFeuille[] = inscrits.map((i) => ({
    nom: `${i.firstName} ${i.lastName}`.trim(),
    courriel: i.email,
    telephone: i.phone,
    attendance: i.attendance,
  }));

  const buffer = await renderToBuffer(
    FeuillePresencePdf({
      titre: evenement.title,
      dateFormatee: formaterDateEvenement(evenement.startsAt),
      lieu: evenement.isOnline ? 'En ligne' : evenement.location,
      capacite: evenement.capacity,
      inscrits: lignes,
    }),
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="feuille-presence-${evenement.slug}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
