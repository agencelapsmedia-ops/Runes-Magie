import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** GET /api/admin/recus — tous les reçus, du plus récent au plus ancien. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const recus = await prisma.receipt.findMany({
    orderBy: { paidAt: 'desc' },
    take: 500,
    select: {
      id: true, number: true, description: true, amount: true, method: true, kind: true, paidAt: true,
      client: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json({ recus });
}
