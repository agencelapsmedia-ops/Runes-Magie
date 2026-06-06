'use client';

import { useCallback, useEffect, useState } from 'react';

interface ProductRef {
  id: string;
  name: string;
}

interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  productId: string;
  product: ProductRef;
  _count: { lessons: number };
}

interface Lesson {
  id: string;
  slug: string;
  title: string;
  videoUrl: string | null;
  content: string;
  durationMin: number | null;
  sortOrder: number;
  isPreview: boolean;
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  isPublished: boolean;
  product: ProductRef;
  lessons: Lesson[];
}

export default function FormationsAdminPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Création
  const [newProductId, setNewProductId] = useState('');
  const [newTitle, setNewTitle] = useState('');

  // Édition d'un cours sélectionné
  const [selected, setSelected] = useState<CourseDetail | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);

  // Nouvelle leçon
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setCourses(data.courses ?? []);
      setAvailableProducts(data.availableProducts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function loadCourse(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/courses/${id}`);
    if (res.ok) setSelected(await res.json());
  }

  async function createCourse() {
    if (!newProductId || !newTitle.trim()) {
      setError('Choisissez un produit et un titre.');
      return;
    }
    setError(null);
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: newProductId, title: newTitle.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Erreur de création');
      return;
    }
    const course = await res.json();
    setNewTitle('');
    setNewProductId('');
    await load();
    await loadCourse(course.id);
  }

  async function saveCourse() {
    if (!selected) return;
    setSavingCourse(true);
    setError(null);
    const res = await fetch(`/api/admin/courses/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: selected.title,
        description: selected.description,
        coverUrl: selected.coverUrl,
        isPublished: selected.isPublished,
      }),
    });
    setSavingCourse(false);
    if (!res.ok) {
      setError('Erreur de sauvegarde');
      return;
    }
    await load();
  }

  async function deleteCourse() {
    if (!selected) return;
    if (!confirm('Supprimer ce cours et toutes ses leçons ?')) return;
    await fetch(`/api/admin/courses/${selected.id}`, { method: 'DELETE' });
    setSelected(null);
    await load();
  }

  async function addLesson() {
    if (!selected || !lessonTitle.trim()) return;
    const res = await fetch(`/api/admin/courses/${selected.id}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: lessonTitle.trim(),
        videoUrl: lessonVideo.trim() || null,
        content: lessonContent,
        durationMin: lessonDuration ? Number(lessonDuration) : null,
      }),
    });
    if (res.ok) {
      setLessonTitle('');
      setLessonVideo('');
      setLessonContent('');
      setLessonDuration('');
      await loadCourse(selected.id);
    }
  }

  async function updateLesson(lesson: Lesson, patch: Partial<Lesson>) {
    if (!selected) return;
    await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await loadCourse(selected.id);
  }

  async function deleteLesson(lessonId: string) {
    if (!selected) return;
    if (!confirm('Supprimer cette leçon ?')) return;
    await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' });
    await loadCourse(selected.id);
  }

  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 font-cinzel text-2xl font-bold text-violet-profond">Formations</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Création d'un cours */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-cinzel text-sm font-semibold uppercase tracking-wide text-gray-700">
          Nouveau cours
        </h2>
        {availableProducts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun produit de type <strong>COURSE</strong> disponible. Créez d&apos;abord un produit
            (type « COURSE ») dans l&apos;inventaire, puis revenez ici.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs font-medium text-gray-600">
              Produit (COURSE)
              <select
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— Choisir —</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col text-xs font-medium text-gray-600">
              Titre du cours
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ex : Les Runes pour débutants"
              />
            </label>
            <button
              type="button"
              onClick={createCourse}
              className="rounded-lg bg-violet-profond px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Créer
            </button>
          </div>
        )}
      </section>

      {/* Liste des cours */}
      <section className="mb-8">
        <h2 className="mb-3 font-cinzel text-sm font-semibold uppercase tracking-wide text-gray-700">
          Cours existants
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun cours pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {courses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => loadCourse(c.id)}
                className={`rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-violet-profond ${
                  selected?.id === c.id ? 'border-violet-profond ring-1 ring-violet-profond' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-800">{c.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                      c.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.isPublished ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {c.product.name} · {c._count.lessons} leçon{c._count.lessons > 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Éditeur du cours sélectionné */}
      {selected && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-cinzel text-lg font-semibold text-violet-profond">
              Éditer : {selected.product.name}
            </h2>
            <button
              type="button"
              onClick={deleteCourse}
              className="text-sm text-red-600 hover:underline"
            >
              Supprimer le cours
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-xs font-medium text-gray-600">
              Titre
              <input
                value={selected.title}
                onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-gray-600">
              Image de couverture (URL)
              <input
                value={selected.coverUrl ?? ''}
                onChange={(e) => setSelected({ ...selected, coverUrl: e.target.value })}
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://…"
              />
            </label>
          </div>
          <label className="mt-3 flex flex-col text-xs font-medium text-gray-600">
            Description
            <textarea
              value={selected.description}
              onChange={(e) => setSelected({ ...selected, description: e.target.value })}
              rows={2}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.isPublished}
                onChange={(e) => setSelected({ ...selected, isPublished: e.target.checked })}
              />
              Publié (visible par les membres)
            </label>
            <button
              type="button"
              onClick={saveCourse}
              disabled={savingCourse}
              className="rounded-lg bg-violet-profond px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {savingCourse ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>

          {/* Leçons */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="mb-3 font-cinzel text-sm font-semibold uppercase tracking-wide text-gray-700">
              Leçons ({selected.lessons.length})
            </h3>

            <ul className="mb-4 flex flex-col gap-2">
              {selected.lessons.map((lesson, i) => (
                <li
                  key={lesson.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400">#{i + 1}</span>
                    <input
                      value={lesson.title}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          lessons: selected.lessons.map((l) =>
                            l.id === lesson.id ? { ...l, title: e.target.value } : l,
                          ),
                        })
                      }
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      value={lesson.videoUrl ?? ''}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          lessons: selected.lessons.map((l) =>
                            l.id === lesson.id ? { ...l, videoUrl: e.target.value } : l,
                          ),
                        })
                      }
                      placeholder="URL vidéo"
                      className="w-48 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateLesson(lesson, {
                          title: lesson.title,
                          videoUrl: lesson.videoUrl,
                          content: lesson.content,
                        })
                      }
                      className="rounded bg-gray-800 px-2.5 py-1 text-xs text-white hover:opacity-90"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLesson(lesson.id)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:underline"
                    >
                      Suppr.
                    </button>
                  </div>
                  <textarea
                    value={lesson.content}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        lessons: selected.lessons.map((l) =>
                          l.id === lesson.id ? { ...l, content: e.target.value } : l,
                        ),
                      })
                    }
                    placeholder="Contenu / notes de la leçon"
                    rows={2}
                    className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-sm"
                  />
                </li>
              ))}
            </ul>

            {/* Ajout d'une leçon */}
            <div className="rounded-lg border border-dashed border-gray-300 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ajouter une leçon
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Titre de la leçon"
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  value={lessonVideo}
                  onChange={(e) => setLessonVideo(e.target.value)}
                  placeholder="URL vidéo (optionnel)"
                  className="w-56 rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="Durée (min)"
                  type="number"
                  className="w-28 rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <textarea
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="Contenu / notes (optionnel)"
                rows={2}
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={addLesson}
                className="mt-2 rounded-lg bg-violet-profond px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Ajouter la leçon
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
