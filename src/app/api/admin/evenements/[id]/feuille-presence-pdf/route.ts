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
    include: { guests: { orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] } },
  });

  // Chaque personne attendue a sa propre ligne à cocher : l'accompagnateur
  // suit immédiatement l'inscrite qui l'amène, pour qu'on les coche ensemble
  // à l'accueil.
  const lignes: LigneFeuille[] = [];
  for (const i of inscrits) {
    lignes.push({
      nom: `${i.firstName} ${i.lastName}`.trim(),
      courriel: i.email,
      telephone: i.phone,
      attendance: i.attendance,
    });
    for (const a of i.guests) {
      lignes.push({
        nom: `${a.firstName} ${a.lastName}`.trim(),
        courriel: a.email ?? '',
        telephone: null,
        attendance: a.attendance,
        amenePar: i.firstName,
      });
    }
  }
  const nbAccompagnateurs = inscrits.reduce((somme, i) => somme + i.guests.length, 0);

  const buffer = await renderToBuffer(
    FeuillePresencePdf({
      titre: evenement.title,
      dateFormatee: formaterDateEvenement(evenement.startsAt),
      lieu: evenement.isOnline ? 'En ligne' : evenement.location,
      capacite: evenement.capacity,
      inscrits: lignes,
      accompagnateurs: nbAccompagnateurs,
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
