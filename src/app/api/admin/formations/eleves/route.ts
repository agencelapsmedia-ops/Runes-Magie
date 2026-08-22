import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { auth } from '@/lib/auth';
import { createEnrollment, creditBalance } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

async function actorName(): Promise<string> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session?.user as any;
  return u?.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : (u?.name ?? 'Admin');
}

/** GET /api/admin/formations/eleves — liste des inscriptions + formations disponibles. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const [enrollments, formations] = await Promise.all([
    prisma.formationEnrollment.findMany({
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        formation: { select: { code: true, title: true } },
        progress: { select: { state: true, course: { select: { isOptional: true, isExam: true, countsInProgress: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.formation.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true, pricePerCourse: true, pricePerBlock10: true, defaultPrice: true },
      orderBy: { code: 'asc' },
    }),
  ]);

  const rows = await Promise.all(
    enrollments.map(async (e) => {
      const base = e.progress.filter((p) => !p.course.isOptional && p.course.countsInProgress);
      return {
        id: e.id,
        client: e.client,
        formation: e.formation,
        status: e.status,
        completed: base.filter((p) => p.state === 'COMPLETED').length,
        total: base.length,
        credits: await creditBalance(e.clientId),
        startedAt: e.startedAt,
      };
    }),
  );

  return NextResponse.json({ eleves: rows, formations });
}

/** POST /api/admin/formations/eleves — inscrit une cliente { clientId, formationId, totalPrice?, adminNotes? }. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => ({}));
  const { clientId, formationId, totalPrice, adminNotes } = body ?? {};
  if (!clientId || !formationId) {
    return NextResponse.json({ error: 'clientId et formationId requis.' }, { status: 400 });
  }
  const client = await prisma.holisticUser.findUnique({ where: { id: clientId }, select: { role: true } });
  if (!client || client.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Cliente introuvable.' }, { status: 404 });
  }
  try {
    const enrollment = await createEnrollment({
      formationId,
      clientId,
      totalPrice: typeof totalPrice === 'number' ? totalPrice : null,
      adminNotes: typeof adminNotes === 'string' ? adminNotes : '',
      actor: await actorName(),
    });
    return NextResponse.json({ ok: true, enrollmentId: enrollment.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
