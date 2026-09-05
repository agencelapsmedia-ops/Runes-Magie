import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { TAUX_HORAIRE } from '@/lib/laps-facturation';

export const dynamic = 'force-dynamic';

const TITRE_MAX = 200;

/**
 * GET /api/admin/laps/actions — actions réalisées, de la plus récente à la plus
 * ancienne. Filtres : ?from=YYYY-MM-DD&to=YYYY-MM-DD&billable=1|0
 */
export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const params = new URL(req.url).searchParams;
  const from = params.get('from');
  const to = params.get('to');
  const billable = params.get('billable');

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.doneOn = {
      ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    };
  }
  if (billable === '1') where.billable = true;
  if (billable === '0') where.billable = false;

  const actions = await prisma.lapsAction.findMany({
    where,
    orderBy: [{ doneOn: 'desc' }, { createdAt: 'desc' }],
    include: { todoTask: { select: { id: true, title: true } } },
  });
  return NextResponse.json(actions);
}

/** POST /api/admin/laps/actions — enregistre une action réalisée. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 });

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return NextResponse.json({ error: 'Le nom de l’action est requis.' }, { status: 400 });
  if (title.length > TITRE_MAX) {
    return NextResponse.json({ error: `Le nom ne peut pas dépasser ${TITRE_MAX} caractères.` }, { status: 400 });
  }

  const minutes = Number(body.minutes);
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return NextResponse.json({ error: 'La durée doit être supérieure à zéro.' }, { status: 400 });
  }

  const doneOn = body.doneOn ? new Date(body.doneOn) : null;
  if (!doneOn || Number.isNaN(doneOn.getTime())) {
    return NextResponse.json({ error: 'La date de réalisation est invalide.' }, { status: 400 });
  }

  const hourlyRate = Number.isFinite(Number(body.hourlyRate)) && Number(body.hourlyRate) > 0
    ? Number(body.hourlyRate)
    : TAUX_HORAIRE;

  // La tâche d'origine est facultative : si elle a disparu du kanban, on garde
  // l'action sans lien plutôt que de refuser l'enregistrement.
  let todoTaskId: string | null = null;
  if (typeof body.todoTaskId === 'string' && body.todoTaskId) {
    const tache = await prisma.todoTask.findUnique({ where: { id: body.todoTaskId }, select: { id: true } });
    todoTaskId = tache?.id ?? null;
  }

  const action = await prisma.lapsAction.create({
    data: {
      title,
      description: typeof body.description === 'string' ? body.description : '',
      doneOn,
      minutes,
      billable: body.billable !== false,
      hourlyRate,
      todoTaskId,
    },
    include: { todoTask: { select: { id: true, title: true } } },
  });
  return NextResponse.json(action, { status: 201 });
}
