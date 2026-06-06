'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export interface PlayerLesson {
  id: string;
  title: string;
  videoUrl: string | null;
  content: string;
  durationMin: number | null;
}

function LessonMedia({ lesson }: { lesson: PlayerLesson }) {
  if (!lesson.videoUrl) return null;
  const isFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(lesson.videoUrl);

  return (
    <div
      className="relative w-full overflow-hidden rounded-sm border"
      style={{ aspectRatio: '16 / 9', borderColor: 'rgba(74, 45, 122, 0.4)', background: '#000' }}
    >
      {isFile ? (
        <video src={lesson.videoUrl} controls className="h-full w-full" />
      ) : (
        <iframe
          src={lesson.videoUrl}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}

export default function CoursePlayer({
  courseTitle,
  lessons,
  completedLessonIds,
}: {
  courseTitle: string;
  lessons: PlayerLesson[];
  completedLessonIds: string[];
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedLessonIds));
  const [saving, setSaving] = useState(false);

  // Leçon courante : première non terminée, sinon la première.
  const firstUndone = lessons.find((l) => !completed.has(l.id))?.id ?? lessons[0]?.id ?? '';
  const [currentId, setCurrentId] = useState<string>(firstUndone);

  const current = useMemo(
    () => lessons.find((l) => l.id === currentId) ?? lessons[0],
    [lessons, currentId],
  );

  // Enregistre la consultation (IN_PROGRESS) à l'ouverture d'une leçon non terminée.
  const ping = useCallback(async (lessonId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await fetch('/api/membre/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, status }),
      });
    } catch {
      // silencieux : la progression n'est pas critique
    }
  }, []);

  useEffect(() => {
    if (current && !completed.has(current.id)) {
      ping(current.id, 'IN_PROGRESS');
    }
    // on ne veut déclencher qu'au changement de leçon courante
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const markComplete = useCallback(async () => {
    if (!current || completed.has(current.id)) return;
    setSaving(true);
    await ping(current.id, 'COMPLETED');
    setCompleted((prev) => new Set(prev).add(current.id));
    setSaving(false);
    // Avance automatiquement à la leçon suivante non terminée.
    const idx = lessons.findIndex((l) => l.id === current.id);
    const next = lessons.slice(idx + 1).find((l) => !completed.has(l.id));
    if (next) setCurrentId(next.id);
  }, [current, completed, lessons, ping]);

  const doneCount = completed.size;
  const total = lessons.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (!current) {
    return (
      <div>
        <Link
          href="/compte/formations"
          className="font-cinzel text-[0.68rem] uppercase tracking-widest text-parchemin/45 hover:text-or-ancien"
        >
          ← Mes formations
        </Link>
        <p className="mt-8 font-cormorant text-lg italic text-parchemin/50">
          Ce cours n&apos;a pas encore de leçon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/compte/formations"
        className="font-cinzel text-[0.68rem] uppercase tracking-widest text-parchemin/45 transition-colors hover:text-or-ancien"
      >
        ← Mes formations
      </Link>

      <h1 className="mt-4 font-cinzel-decorative text-2xl text-or-ancien sm:text-3xl">
        {courseTitle}
      </h1>

      {/* Progression globale */}
      <div className="mt-4">
        <div className="flex items-center justify-between font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/45">
          <span>
            {doneCount}/{total} leçons terminées
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sommaire des leçons */}
        <aside className="order-2 lg:order-1">
          <p className="mb-3 font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/40">
            Programme
          </p>
          <ol className="flex flex-col gap-1">
            {lessons.map((lesson, i) => {
              const isCurrent = lesson.id === current.id;
              const isDone = completed.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentId(lesson.id)}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-all duration-200"
                    style={{
                      background: isCurrent ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
                      borderLeft: `2px solid ${isCurrent ? 'var(--or-ancien)' : 'transparent'}`,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[0.6rem]"
                      style={{
                        background: isDone ? 'rgba(34,197,94,0.15)' : 'rgba(74, 45, 122, 0.35)',
                        color: isDone ? '#4ade80' : 'var(--parchemin)',
                        border: `1px solid ${isDone ? 'rgba(34,197,94,0.4)' : 'rgba(74, 45, 122, 0.6)'}`,
                      }}
                    >
                      {isDone ? '✓' : i + 1}
                    </span>
                    <span
                      className="font-cormorant text-base leading-tight"
                      style={{ color: isCurrent ? 'var(--or-ancien)' : 'rgba(232, 220, 190, 0.7)' }}
                    >
                      {lesson.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Leçon courante */}
        <div className="order-1 lg:order-2">
          <LessonMedia lesson={current} />

          <h2 className="mt-6 font-cinzel text-lg uppercase tracking-wide text-parchemin">
            {current.title}
          </h2>
          {current.durationMin != null && (
            <p className="mt-1 font-cormorant text-sm text-parchemin/40">
              {current.durationMin} min
            </p>
          )}

          {current.content && (
            <div className="mt-4 whitespace-pre-wrap font-cormorant text-lg leading-relaxed text-parchemin/75">
              {current.content}
            </div>
          )}

          <div className="mt-8">
            {completed.has(current.id) ? (
              <span className="inline-flex items-center gap-2 font-cinzel text-xs uppercase tracking-widest text-[#4ade80]">
                ✓ Leçon terminée
              </span>
            ) : (
              <button
                type="button"
                onClick={markComplete}
                disabled={saving}
                className="inline-flex items-center rounded-sm border px-6 py-3 font-cinzel text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
                  borderColor: 'rgba(201, 168, 76, 0.3)',
                  color: 'var(--or-ancien)',
                }}
              >
                {saving ? 'Enregistrement…' : 'Marquer comme terminé'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
