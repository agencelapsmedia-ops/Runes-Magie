import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET — sert le PDF d'un document de cours à la CLIENTE autorisée.
 * Conditions (vérifiées côté serveur, jamais confiées au frontend) :
 *  1) session valide ;
 *  2) la cliente a une inscription à la formation du cours ;
 *  3) SON cours est COMPLETED (le contenu suit la validation de Noctura).
 * En-têtes anti-cache + affichage inline (pas de téléchargement proposé).
 * Les admins/propriétaire y ont aussi accès (prévisualisation).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.formationCourseDocument.findUnique({
    where: { id },
    select: { data: true, mimeType: true, title: true, courseId: true, isActive: true },
  });
  if (!doc || !doc.data || !doc.isActive) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  const isAdmin = user.role === 'ADMIN' || user.isOwner === true;
  if (!isAdmin) {
    const access = await prisma.enrollmentCourseProgress.findFirst({
      where: {
        courseId: doc.courseId,
        state: 'COMPLETED',
        enrollment: { clientId: user.id },
      },
      select: { id: true },
    });
    if (!access) {
      return NextResponse.json(
        { error: 'Ce document sera disponible quand le cours sera complété avec Noctura.' },
        { status: 403 },
      );
    }
  }

  return new NextResponse(new Uint8Array(doc.data), {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
