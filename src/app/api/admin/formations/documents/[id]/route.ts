import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

/** DELETE — supprime un document de cours. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  await prisma.formationCourseDocument.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
