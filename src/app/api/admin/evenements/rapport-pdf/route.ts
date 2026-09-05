import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { requireAdmin } from '@/lib/admin-guard';
import { construireRapportEvenements } from '@/lib/rapports-evenements';
import { RapportEvenementsPdf } from '@/lib/pdf/RapportEvenementsPdf';

export const dynamic = 'force-dynamic';
// Rendu PDF côté serveur : au-delà de la dizaine de rituels, on dépasse
// facilement les 10 s par défaut.
export const maxDuration = 60;

/**
 * GET /api/admin/evenements/rapport-pdf?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ
 *
 * Rapport de participation en PDF. Les mêmes bornes que la page
 * /admin/evenements/rapports, pour que le document imprimé corresponde
 * exactement à ce qui est affiché à l'écran.
 */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const params = new URL(req.url).searchParams;
  const lire = (cle: string): Date | null => {
    const brut = params.get(cle);
    if (!brut) return null;
    const date = new Date(brut);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const debut = lire('debut');
  // `fin` est une date sans heure : la pousser en fin de journée, sinon un
  // rituel tenu à 13 h le dernier jour de la période serait exclu.
  const finBrute = lire('fin');
  const fin = finBrute ? new Date(finBrute.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

  const rapport = await construireRapportEvenements({ debut, fin });
  const buffer = await renderToBuffer(RapportEvenementsPdf({ rapport }));

  const maintenant = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const horodatage = `${maintenant.getFullYear()}${pad(maintenant.getMonth() + 1)}${pad(maintenant.getDate())}-${pad(maintenant.getHours())}${pad(maintenant.getMinutes())}`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-rituels-${horodatage}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
