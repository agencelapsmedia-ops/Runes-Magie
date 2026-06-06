/**
 * courses.ts — Lecture des cours côté membre (espace /compte/formations).
 * L'accès est conditionné à un MemberEntitlement (kind=COURSE) sur le produit
 * du cours. Voir src/lib/entitlements.ts.
 */

import { prisma } from "@/lib/db";
import { hasEntitlement } from "@/lib/entitlements";

export interface MemberCourseSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  productName: string;
  totalLessons: number;
  completedLessons: number;
}

/** Cours auxquels le membre a accès (entitlement COURSE actif), avec progression. */
export async function getMemberCourses(userId: string): Promise<MemberCourseSummary[]> {
  const entitlements = await prisma.memberEntitlement.findMany({
    where: {
      userId,
      kind: "COURSE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { productId: true },
  });

  const productIds = entitlements
    .map((e) => e.productId)
    .filter((id): id is string => Boolean(id));
  if (productIds.length === 0) return [];

  const courses = await prisma.course.findMany({
    where: { productId: { in: productIds }, isPublished: true },
    include: {
      product: { select: { name: true } },
      lessons: { select: { id: true } },
    },
    orderBy: { title: "asc" },
  });
  if (courses.length === 0) return [];

  const completed = await prisma.courseProgress.findMany({
    where: { userId, courseId: { in: courses.map((c) => c.id) }, status: "COMPLETED" },
    select: { courseId: true },
  });
  const completedByCourse = new Map<string, number>();
  for (const p of completed) {
    completedByCourse.set(p.courseId, (completedByCourse.get(p.courseId) ?? 0) + 1);
  }

  return courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    coverUrl: c.coverUrl,
    productName: c.product.name,
    totalLessons: c.lessons.length,
    completedLessons: completedByCourse.get(c.id) ?? 0,
  }));
}

/** Détail d'un cours (leçons + progression) si le membre y a accès, sinon null. */
export async function getMemberCourse(userId: string, slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { lessons: { orderBy: { sortOrder: "asc" } } },
  });
  if (!course || !course.isPublished) return null;

  const allowed = await hasEntitlement(userId, course.productId);
  if (!allowed) return null;

  const progress = await prisma.courseProgress.findMany({
    where: { userId, courseId: course.id },
    select: { lessonId: true, status: true },
  });

  return { course, progress };
}

/**
 * Vérifie que le membre a accès à la leçon donnée (via l'entitlement du cours).
 * Renvoie { courseId } si OK, sinon null. Utilisé par l'API de progression.
 */
export async function getAccessibleLesson(
  userId: string,
  lessonId: string,
): Promise<{ courseId: string } | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true, course: { select: { productId: true } } },
  });
  if (!lesson) return null;
  const allowed = await hasEntitlement(userId, lesson.course.productId);
  if (!allowed) return null;
  return { courseId: lesson.courseId };
}
