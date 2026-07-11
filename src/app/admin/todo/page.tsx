'use client';

import { useEffect, useMemo, useState } from 'react';

interface Todo {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  label: string | null;
  assignee: string | null;
  startsOn: string | null;
  dueOn: string | null;
  sortOrder: number;
  archivedAt: string | null;
}

const COLUMNS = [
  { key: 'A_FAIRE', label: 'À faire', accent: '#6B3FA0' },
  { key: 'EN_COURS', label: 'En cours', accent: '#1D4ED8' },
  { key: 'EN_VERIFICATION', label: 'En vérification', accent: '#92400E' },
  { key: 'TERMINE', label: 'Terminé', accent: '#065F46' },
];

const PRIORITIES = [
  { key: 'URGENTE', label: '🔴 Urgente', color: '#DC2626', bg: '#FEE2E2' },
  { key: 'HAUTE', label: '🟠 Haute', color: '#C2410C', bg: '#FFEDD5' },
  { key: 'MOYENNE', label: '🟡 Moyenne', color: '#A16207', bg: '#FEF9C3' },
  { key: 'BASSE', label: '⚪ Basse', color: '#6B7280', bg: '#F3F4F6' },
];

const prioMeta = (key: string) => PRIORITIES.find((p) => p.key === key) ?? PRIORITIES[2];
const PRIO_RANK: Record<string, number> = { URGENTE: 0, HAUTE: 1, MOYENNE: 2, BASSE: 3 };

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Toronto', day: 'numeric', month: 'short' }).format(new Date(iso));
}

function isOverdue(t: Todo): boolean {
  if (!t.dueOn || t.status === 'TERMINE') return false;
  return new Date(t.dueOn).getTime() < Date.now() - 12 * 60 * 60 * 1000;
}

/** Valeur datetime → input type=date (YYYY-MM-DD). */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

const emptyForm = {
  title: '', description: '', priority: 'MOYENNE', label: '', assignee: '', startsOn: '', dueOn: '', status: 'A_FAIRE',
};

export default function TodoAdminPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState('toutes');
  const [filterPriority, setFilterPriority] = useState('toutes');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  // Formulaire (création ou édition)
  const [editing, setEditing] = useState<Todo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/admin/todos');
      if (!res.ok) throw new Error('Erreur de chargement');
      setTodos(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const labels = useMemo(
    () => [...new Set(todos.map((t) => t.label).filter(Boolean))] as string[],
    [todos],
  );

  const visible = useMemo(
    () =>
      todos
        .filter((t) => (filterLabel === 'toutes' ? true : t.label === filterLabel))
        .filter((t) => (filterPriority === 'toutes' ? true : t.priority === filterPriority)),
    [todos, filterLabel, filterPriority],
  );

  const byColumn = (status: string) =>
    visible
      .filter((t) => t.status === status)
      .sort((a, b) => PRIO_RANK[a.priority] - PRIO_RANK[b.priority] || a.sortOrder - b.sortOrder);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }
  function openEdit(t: Todo) {
    setEditing(t);
    setForm({
      title: t.title, description: t.description, priority: t.priority,
      label: t.label ?? '', assignee: t.assignee ?? '',
      startsOn: toDateInput(t.startsOn), dueOn: toDateInput(t.dueOn), status: t.status,
    });
    setShowForm(true);
  }

  async function saveForm() {
    if (!form.title.trim()) { setError('Le titre est requis.'); return; }
    setSaving(true); setError(null);
    const payload = {
      title: form.title, description: form.description, priority: form.priority,
      label: form.label, assignee: form.assignee, status: form.status,
      startsOn: form.startsOn || null, dueOn: form.dueOn || null,
    };
    try {
      const res = editing
        ? await fetch(`/api/admin/todos/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Échec'); }
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function archiveTask(id: string) {
    await fetch(`/api/admin/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) });
    setShowForm(false);
    await load();
  }
  async function deleteTask(id: string) {
    if (!confirm('Supprimer définitivement cette tâche ?')) return;
    await fetch(`/api/admin/todos/${id}`, { method: 'DELETE' });
    setShowForm(false);
    await load();
  }

  async function moveTo(id: string, status: string) {
    // Optimiste : la carte change de colonne immédiatement.
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch(`/api/admin/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await load();
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', marginTop: '4px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#1F2937', fontSize: '0.9rem' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: '#4B5563', fontWeight: 600, marginBottom: '10px' };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '6px' }}>
            ᛏ To-do du projet
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
            Glisse les cartes d&apos;une étape à l&apos;autre. Clique une carte pour la modifier.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ padding: '10px 20px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-cinzel, serif)' }}
        >
          + Nouvelle tâche
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
        <label style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>
          Étiquette :{' '}
          <select value={filterLabel} onChange={(e) => setFilterLabel(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}>
            <option value="toutes">Toutes</option>
            {labels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '0.82rem', color: '#374151', fontWeight: 600 }}>
          Priorité :{' '}
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem' }}>
            <option value="toutes">Toutes</option>
            {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        {error && <span style={{ color: '#DC2626', fontSize: '0.85rem' }}>{error}</span>}
      </div>

      {/* Kanban */}
      {loading ? (
        <p style={{ color: '#6B7280' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', alignItems: 'start' }}>
          {COLUMNS.map((col) => {
            const items = byColumn(col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => { if (dragId) moveTo(dragId, col.key); setDragId(null); setOverCol(null); }}
                style={{
                  background: overCol === col.key ? '#EDE9FE' : '#F3F4F6',
                  borderRadius: '12px',
                  padding: '12px',
                  minHeight: '220px',
                  border: `2px solid ${overCol === col.key ? '#6B3FA0' : 'transparent'}`,
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: col.accent, margin: '2px 4px 12px' }}>
                  {col.label} <span style={{ color: '#9CA3AF' }}>({items.length})</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map((t) => {
                    const prio = prioMeta(t.priority);
                    const late = isOverdue(t);
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        onClick={() => openEdit(t)}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '10px',
                          padding: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          borderLeft: `4px solid ${prio.color}`,
                          cursor: 'grab',
                          opacity: dragId === t.id ? 0.5 : 1,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#1F2937', lineHeight: 1.35 }}>{t.title}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: prio.bg, color: prio.color }}>{prio.label}</span>
                          {t.label && <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', background: '#EDE9FE', color: '#6B3FA0' }}>{t.label}</span>}
                          {late && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#FEE2E2', color: '#DC2626' }}>⚠ En retard</span>}
                        </div>
                        {(t.assignee || t.dueOn) && (
                          <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#6B7280' }}>
                            {t.assignee && <>👤 {t.assignee}</>}
                            {t.assignee && t.dueOn && ' · '}
                            {t.dueOn && <>📅 {t.startsOn ? `${fmtDate(t.startsOn)} → ` : 'échéance '}{fmtDate(t.dueOn)}</>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p style={{ fontSize: '0.78rem', color: '#9CA3AF', textAlign: 'center', padding: '18px 0', margin: 0 }}>Déposer une carte ici</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création/édition */}
      {showForm && (
        <div
          role="dialog" aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' }}
          onClick={() => !saving && setShowForm(false)}
        >
          <div style={{ background: '#fff', borderRadius: '12px', padding: '26px', width: '100%', maxWidth: '480px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.2rem', color: '#2D1B4E', margin: '0 0 18px' }}>
              {editing ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>

            <label style={labelStyle}>Titre *
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            </label>
            <label style={labelStyle}>Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ ...labelStyle, flex: 1 }}>Priorité
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                  {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </label>
              <label style={{ ...labelStyle, flex: 1 }}>Étape
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ ...labelStyle, flex: 1 }}>Étiquette
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Site web, Boutique…" style={inputStyle} list="todo-labels" />
                <datalist id="todo-labels">{labels.map((l) => <option key={l} value={l} />)}</datalist>
              </label>
              <label style={{ ...labelStyle, flex: 1 }}>Assignée à
                <input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Annabelle, Laps Media…" style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ ...labelStyle, flex: 1 }}>Date de début
                <input type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} style={inputStyle} />
              </label>
              <label style={{ ...labelStyle, flex: 1 }}>Échéance
                <input type="date" value={form.dueOn} onChange={(e) => setForm({ ...form, dueOn: e.target.value })} style={inputStyle} />
              </label>
            </div>

            {error && <p style={{ color: '#DC2626', fontSize: '0.85rem' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editing && (
                  <>
                    <button type="button" onClick={() => archiveTask(editing.id)} disabled={saving} style={{ padding: '9px 14px', background: '#fff', color: '#92400E', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      Archiver
                    </button>
                    <button type="button" onClick={() => deleteTask(editing.id)} disabled={saving} style={{ padding: '9px 14px', background: '#fff', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)} disabled={saving} style={{ padding: '9px 16px', background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={saveForm} disabled={saving} style={{ padding: '9px 18px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer la tâche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
