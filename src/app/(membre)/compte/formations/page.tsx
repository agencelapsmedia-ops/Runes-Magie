import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getMemberCourses } from '@/lib/courses';
import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/45">
        <span>
          {done}/{total} leçons
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(74, 45, 122, 0.3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(to right, var(--or-ancien), var(--or-clair))',
          }}
        />
      </div>
    </div>
  );
}

export default async function FormationsPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? '';
  const courses = userId ? await getMemberCourses(userId) : [];

  return (
    <div>
      <MembreHeader
        emoji="🎓"
        title="Mes formations"
        subtitle="Les cours que vous avez achetés et votre progression"
      />

      {courses.length === 0 ? (
        <ComingSoon message="Vous n'avez pas encore de formation. Vos cours achetés apparaîtront ici.">
          <Link
            href="/ecole"
            className="inline-flex items-center font-cinzel text-xs uppercase tracking-widest text-turquoise-cristal transition-colors duration-200 hover:text-or-ancien"
          >
            Voir l&apos;École de Sorcellerie →
          </Link>
        </ComingSoon>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const done = course.completedLessons >= course.totalLessons && course.totalLessons > 0;
            return (
              <Link
                key={course.id}
                href={`/compte/formations/${course.slug}`}
                className="group flex flex-col rounded-sm border p-6 transition-all duration-200"
                style={{
                  background: 'var(--charbon-mystere)',
                  borderColor: 'rgba(74, 45, 122, 0.3)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-cinzel text-sm uppercase tracking-widest text-parchemin transition-colors duration-200 group-hover:text-or-ancien">
                    {course.title}
                  </span>
                  {done && (
                    <span
                      className="whitespace-nowrap rounded-full px-2.5 py-0.5 font-cinzel text-[0.58rem] uppercase tracking-widest"
                      style={{
                        color: '#4ade80',
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.3)',
                      }}
                    >
                      Terminé
                    </span>
                  )}
                </div>
                {course.description && (
                  <span className="mt-2 line-clamp-2 font-cormorant text-base text-parchemin/50">
                    {course.description}
                  </span>
                )}
                <ProgressBar done={course.completedLessons} total={course.totalLessons} />
                <span className="mt-4 font-cinzel text-[0.65rem] uppercase tracking-widest text-turquoise-cristal transition-colors duration-200 group-hover:text-or-ancien">
                  {course.completedLessons > 0 ? 'Reprendre' : 'Commencer'} →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
