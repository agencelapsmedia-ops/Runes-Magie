import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

const STATUSES = ['A_FAIRE', 'EN_COURS', 'EN_VERIFICATION', 'TERMINE'];
const PRIORITIES = ['URGENTE', 'HAUTE', 'MOYENNE', 'BASSE'];

/** GET /api/admin/todos — tâches actives (ou archivées avec ?archived=1). */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const archived = new URL(req.url).searchParams.get('archived') === '1';
  const todos = await prisma.todoTask.findMany({
    where: archived ? { archivedAt: { not: null } } : { archivedAt: null },
    orderBy: archived ? [{ archivedAt: 'desc' }] : [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(todos);
}

/** POST /api/admin/todos — crée une tâche. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 });

  const status = STATUSES.includes(body.status) ? body.status : 'A_FAIRE';
  const priority = PRIORITIES.includes(body.priority) ? body.priority : 'MOYENNE';

  const last = await prisma.todoTask.findFirst({
    where: { status, archivedAt: null },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const todo = await prisma.todoTask.create({
    data: {
      title,
      description: typeof body.description === 'string' ? body.description : '',
      status,
      priority,
      label: typeof body.label === 'string' && body.label.trim() ? body.label.trim() : null,
      assignee: typeof body.assignee === 'string' && body.assignee.trim() ? body.assignee.trim() : null,
      startsOn: body.startsOn ? new Date(body.startsOn) : null,
      dueOn: body.dueOn ? new Date(body.dueOn) : null,
      sortOrder: (last?.sortOrder ?? 0) + 10,
    },
  });
  return NextResponse.json(todo, { status: 201 });
}
