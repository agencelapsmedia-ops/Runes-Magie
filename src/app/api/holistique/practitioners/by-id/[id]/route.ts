import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.practitioner.findUnique({
    where: { id, status: 'APPROVED' },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      availabilities: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
      reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
    },
  });
  if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(p);
}
