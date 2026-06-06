import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMemberCourse } from '@/lib/courses';
import CoursePlayer from '@/components/membre/CoursePlayer';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const data = userId ? await getMemberCourse(userId, slug) : null;

  // Pas d'accès (cours inexistant, non publié, ou non acheté) → retour à la liste.
  if (!data) {
    redirect('/compte/formations');
  }

  const completedLessonIds = data.progress
    .filter((p) => p.status === 'COMPLETED')
    .map((p) => p.lessonId);

  return (
    <CoursePlayer
      courseTitle={data.course.title}
      lessons={data.course.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        videoUrl: l.videoUrl,
        content: l.content,
        durationMin: l.durationMin,
      }))}
      completedLessonIds={completedLessonIds}
    />
  );
}
