import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { isInternalEmail } from '@/lib/holistic-clients';

/**
 * GET /api/admin/clients/search?q=…
 * Recherche de clients existants (HolisticUser role CLIENT) par prénom, nom,
 * courriel ou téléphone — pour pré-remplir le modal « Nouveau rendez-vous ».
 * Réservé admin / praticienne propriétaire. Max 8 résultats.
 */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ clients: [] });

  const clients = await prisma.holisticUser.findMany({
    where: {
      role: 'CLIENT',
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    take: 8,
  });

  return NextResponse.json({
    clients: clients.map((c) => ({
      ...c,
      // Les comptes créés sans courriel portent une adresse interne non routable :
      // on ne l'affiche pas (et on ne la pré-remplit pas) côté admin.
      email: isInternalEmail(c.email) ? '' : c.email,
    })),
  });
}
