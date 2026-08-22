import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ProtectedPdfViewer from './ProtectedPdfViewer';

/**
 * Visionneuse protégée d'un document de cours. La vraie barrière d'accès est
 * la route API qui sert le PDF ; cette page vérifie aussi côté serveur pour
 * afficher un message clair plutôt qu'une visionneuse vide.
 */
export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user?.id) redirect('/soins/auth/login?callbackUrl=/compte/formations');

  const { id } = await params;
  const doc = await prisma.formationCourseDocument.findUnique({
    where: { id },
    select: {
      title: true, isActive: true, courseId: true,
      course: { select: { code: true, title: true, formation: { select: { title: true } } } },
    },
  });
  if (!doc || !doc.isActive) notFound();

  const isAdmin = user.role === 'ADMIN' || user.isOwner === true;
  if (!isAdmin) {
    const access = await prisma.enrollmentCourseProgress.findFirst({
      where: { courseId: doc.courseId, state: 'COMPLETED', enrollment: { clientId: user.id } },
      select: { id: true },
    });
    if (!access) notFound();
  }

  const watermark = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Membre';

  return (
    <div>
      <Link href="/compte/formations" className="font-cinzel text-[0.65rem] uppercase tracking-widest text-turquoise-cristal hover:text-or-ancien">
        ← Mes formations
      </Link>
      <h1 className="mt-4 font-cinzel text-lg uppercase tracking-widest text-or-ancien">
        {doc.course.code} — {doc.title}
      </h1>
      <p className="mb-6 mt-1 text-[0.8rem] text-parchemin/50">
        {doc.course.formation.title} · Document réservé à {watermark} — Runes &amp; Magie. Toute redistribution est interdite.
      </p>
      <ProtectedPdfViewer docId={id} watermark={`${watermark} — Runes & Magie`} />
    </div>
  );
}
