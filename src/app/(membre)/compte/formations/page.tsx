import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getMemberCourses } from '@/lib/courses';
import { getClientEnrollments } from '@/lib/formation-client';
import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

const ENROLLMENT_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'En cours', color: '#4ade80' },
  PAYMENT_DUE: { label: 'Paiement à venir', color: '#d4a017' },
  SUSPENDED: { label: 'En pause', color: '#f87171' },
  COMPLETED: { label: 'Complétée', color: 'var(--or-ancien)' },
  DIPLOMA_ELIGIBLE: { label: 'Diplôme à venir', color: 'var(--or-ancien)' },
  DIPLOMA_AWARDED: { label: 'Diplômée 🎓', color: 'var(--or-ancien)' },
};

function fdate(d: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto', weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

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
  const [courses, enrollments] = userId
    ? await Promise.all([getMemberCourses(userId), getClientEnrollments(userId)])
    : [[], []];

  return (
    <div>
      <MembreHeader
        emoji="🎓"
        title="Mes formations"
        subtitle="Les cours que vous avez achetés et votre progression"
      />

      {enrollments.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-cinzel text-xs uppercase tracking-widest text-or-ancien">
            Mes formations avec Noctura
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {enrollments.map((e) => {
              const pct = e.total ? Math.round((e.completed / e.total) * 100) : 0;
              const st = ENROLLMENT_STATUS[e.status] ?? ENROLLMENT_STATUS.ACTIVE;
              return (
                <Link
                  key={e.id}
                  href={`/compte/formations/parcours/${e.id}`}
                  className="group flex flex-col rounded-sm border p-6 transition-all duration-200"
                  style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(201,168,76,0.35)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-cinzel text-sm uppercase tracking-widest text-parchemin transition-colors duration-200 group-hover:text-or-ancien">
                      {e.formationTitle}
                    </span>
                    <span
                      className="whitespace-nowrap rounded-full px-2.5 py-0.5 font-cinzel text-[0.58rem] uppercase tracking-widest"
                      style={{ color: st.color, border: `1px solid ${st.color}40`, background: `${st.color}14` }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/45">
                      <span>{e.completed}/{e.total} cours</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(74,45,122,0.3)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(to right, var(--or-ancien), var(--or-clair))' }} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-[0.8rem] text-parchemin/70">
                    {e.currentCourse && (
                      <p>📍 Cours actuel : <span className="text-turquoise-cristal">{e.currentCourse.code} — {e.currentCourse.title}</span></p>
                    )}
                    <p>🪙 Jetons de cours restants : <span className="text-or-ancien font-semibold">{e.credits}</span></p>
                    {e.nextAppointment && (
                      <p>📅 Prochaine rencontre : {fdate(e.nextAppointment.startsAt)}</p>
                    )}
                  </div>

                  <span
                    className="mt-5 inline-block self-start rounded-sm border px-6 py-3 text-center font-cinzel text-[0.68rem] uppercase tracking-widest text-or-ancien transition-all duration-200 group-hover:bg-or-ancien/10"
                    style={{ borderColor: 'rgba(201,168,76,0.5)', background: 'rgba(201,168,76,0.06)' }}
                  >
                    Voir mon parcours →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {enrollments.length > 0 && courses.length > 0 && (
        <h2 className="mb-4 font-cinzel text-xs uppercase tracking-widest text-or-ancien">
          Mes cours en ligne
        </h2>
      )}

      {courses.length === 0 && enrollments.length > 0 ? null : courses.length === 0 ? (
        <ComingSoon message="Vous n'avez pas encore de formation. Vos cours achetés apparaîtront ici.">
          <Link
            href="/ecole"
            className="inline-flex items-center font-cinzel text-xs uppercase tracking-widest text-turquoise-cristal transition-colors duration-200 hover:text-or-ancien"
          >
            Voir l&apos;École de Magie →
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
                  <span className="mt-2 line-clamp-2 whitespace-pre-line font-cormorant text-base text-parchemin/50">
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
