import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { creditBalance } from '@/lib/formation-service';

export const dynamic = 'force-dynamic';

/** GET /api/admin/formations/eleves/[id] — fiche complète d'une inscription. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const e = await prisma.formationEnrollment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      formation: { select: { id: true, code: true, title: true, pricePerCourse: true, pricePerBlock10: true } },
      progress: {
        include: { course: true },
        orderBy: { course: { sortOrder: 'asc' } },
      },
      payments: { orderBy: { paidAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      appointments: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { startsAt: 'desc' },
        take: 10,
        select: { id: true, startsAt: true, status: true, formationCourseId: true },
      },
    },
  });
  if (!e) return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });

  const [credits, creditHistory, optionalCourses] = await Promise.all([
    creditBalance(e.clientId),
    prisma.formationCreditTransaction.findMany({
      where: { clientId: e.clientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.formationCourse.findMany({
      where: { formationId: e.formationId, isOptional: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, title: true },
    }),
  ]);

  const totalPaid = e.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({
    enrollment: e,
    credits,
    creditHistory,
    optionalCourses,
    totalPaid,
    balance: e.totalPrice != null ? Math.max(0, e.totalPrice - totalPaid) : null,
  });
}

/** PATCH — met à jour statut / prix / notes de l'inscription. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const STATUTS = ['ACTIVE', 'PAYMENT_DUE', 'SUSPENDED', 'COMPLETED', 'DIPLOMA_ELIGIBLE', 'DIPLOMA_AWARDED'];
  if (typeof body.status === 'string' && STATUTS.includes(body.status)) data.status = body.status;
  if (typeof body.totalPrice === 'number' || body.totalPrice === null) data.totalPrice = body.totalPrice;
  if (typeof body.adminNotes === 'string') data.adminNotes = body.adminNotes;
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });

  const updated = await prisma.formationEnrollment.update({ where: { id }, data });
  return NextResponse.json({ ok: true, status: updated.status });
}
