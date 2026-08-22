import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { auth } from '@/lib/auth';
import { setCourseState } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

/** POST — change l'état d'un cours { courseId, action: complete|unlock|lock|uncomplete, note? }. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { courseId, action, note } = body ?? {};
  if (!courseId || !['complete', 'unlock', 'lock', 'uncomplete'].includes(action)) {
    return NextResponse.json({ error: 'courseId et action valide requis.' }, { status: 400 });
  }
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session?.user as any;
  const actor = u?.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : (u?.name ?? 'Admin');

  try {
    const journal = await setCourseState({
      enrollmentId: id,
      courseId,
      action,
      actor,
      note: typeof note === 'string' && note.trim() ? note.trim() : undefined,
    });
    return NextResponse.json({ ok: true, journal });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
