import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo

/** GET — formations → cours → documents (pour l'admin de gestion). */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const formations = await prisma.formation.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
    select: {
      id: true, code: true, title: true,
      courses: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, code: true, title: true, isOptional: true,
          documents: { orderBy: { sortOrder: 'asc' }, select: { id: true, title: true, sizeBytes: true, createdAt: true } },
        },
      },
    },
  });
  return NextResponse.json({ formations });
}

/** POST (multipart) — téléverse un document PDF pour un cours. Champs : courseId, title?, file. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });
  const courseId = String(form.get('courseId') ?? '');
  const file = form.get('file');
  if (!courseId || !(file instanceof File)) {
    return NextResponse.json({ error: 'courseId et fichier requis.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Seuls les PDF sont acceptés.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 10 Mo).' }, { status: 400 });
  }
  const course = await prisma.formationCourse.findUnique({ where: { id: courseId }, select: { id: true, code: true } });
  if (!course) return NextResponse.json({ error: 'Cours introuvable.' }, { status: 404 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const title = String(form.get('title') ?? '').trim() || `Document du cours ${course.code}`;

  const doc = await prisma.formationCourseDocument.create({
    data: { courseId, title, data: bytes, mimeType: 'application/pdf', sizeBytes: bytes.length },
    select: { id: true, title: true },
  });
  return NextResponse.json({ ok: true, document: doc }, { status: 201 });
}
