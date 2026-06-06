'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CatNode {
  id: string;
  name: string;
  emoji: string;
  parentId: string | null;
  children: CatNode[];
}
interface Slider {
  id: string;
  title: string;
  categoryIds: string[];
  sortOrder: number;
  isVisible: boolean;
}

export default function HomeSlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [tree, setTree] = useState<CatNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Création
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSel, setNewSel] = useState<Set<string>>(new Set());

  // Édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSel, setEditSel] = useState<Set<string>>(new Set());

  // DnD
  const [dragId, setDragId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/admin/home-sliders'),
        fetch('/api/admin/service-categories'),
      ]);
      if (!sRes.ok || !cRes.ok) throw new Error('Erreur de chargement');
      setSliders(await sRes.json());
      setTree(await cRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // Nom d'une catégorie par id (pour l'affichage)
  const nameOf = (id: string): string => {
    for (const r of tree) {
      if (r.id === id) return r.name;
      for (const c of r.children) if (c.id === id) return `${r.name} › ${c.name}`;
    }
    return '—';
  };

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  async function createSlider() {
    if (!newTitle.trim()) {
      setError('Le titre est requis.');
      return;
    }
    setSavingId('__new__');
    setError(null);
    try {
      const res = await fetch('/api/admin/home-sliders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, categoryIds: [...newSel] }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création');
      }
      setNewTitle('');
      setNewSel(new Set());
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  function startEdit(s: Slider) {
    setEditingId(s.id);
    setEditTitle(s.title);
    setEditSel(new Set(s.categoryIds));
  }
  function cancelEdit() {
    setEditingId(null);
  }
  async function saveEdit(id: string) {
    if (!editTitle.trim()) {
      setError('Le titre est requis.');
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/home-sliders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, categoryIds: [...editSel] }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      cancelEdit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function toggleVisible(s: Slider) {
    setSavingId(s.id);
    try {
      const res = await fetch(`/api/admin/home-sliders/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !s.isVisible }),
      });
      if (!res.ok) throw new Error('Erreur');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function removeSlider(s: Slider) {
    if (!confirm(`Supprimer le slider « ${s.title} » ?`)) return;
    setSavingId(s.id);
    try {
      const res = await fetch(`/api/admin/home-sliders/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  // DnD
  function onDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    const arr = [...sliders];
    const from = arr.findIndex((x) => x.id === dragId);
    const to = arr.findIndex((x) => x.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setSliders(arr);
  }
  async function onDragEnd() {
    if (!dragId) return;
    const orderedIds = sliders.map((x) => x.id);
    setDragId(null);
    try {
      const res = await fetch('/api/admin/home-sliders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Erreur');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      await load();
    }
  }

  // Cases à cocher sur l'arbre des catégories
  function CategoryPicker({ set, setter }: { set: Set<string>; setter: (s: Set<string>) => void }) {
    return (
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', maxHeight: '260px', overflowY: 'auto' }}>
        {tree.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>Aucune catégorie. Crée-en d&apos;abord dans « Catégories de services ».</p>
        ) : (
          tree.map((root) => (
            <div key={root.id} style={{ marginBottom: '6px' }}>
              <label style={chkLabel(true)}>
                <input type="checkbox" checked={set.has(root.id)} onChange={() => toggle(set, setter, root.id)} style={{ width: '16px', height: '16px' }} />
                <span style={{ color: '#C9A84C' }}>{root.emoji || '•'}</span> {root.name}
              </label>
              {root.children.map((child) => (
                <label key={child.id} style={{ ...chkLabel(false), paddingLeft: '26px' }}>
                  <input type="checkbox" checked={set.has(child.id)} onChange={() => toggle(set, setter, child.id)} style={{ width: '16px', height: '16px' }} />
                  <span style={{ color: '#C4B5FD' }}>↳</span> {child.name}
                </label>
              ))}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/site" style={{ fontSize: '0.8rem', color: '#6B3FA0', textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ← Gestion site web
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', margin: '8px 0 4px' }}>
          ᛜ Sliders de l&apos;accueil
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Chaque slider a un <strong>titre libre</strong> et affiche les services des <strong>catégories que tu coches</strong>.
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* Création */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowNew(!showNew)} style={{ ...btnStyle(showNew ? '#9CA3AF' : '#2D1B4E'), padding: '10px 18px', fontSize: '0.9rem' }}>
          {showNew ? '✕ Annuler' : '+ Nouveau slider'}
        </button>
        {showNew && (
          <div style={{ marginTop: '12px', background: '#FFF', border: '2px solid #C9A84C', borderRadius: '12px', padding: '18px', maxWidth: '560px' }}>
            <label style={labelStyle}>Titre du slider</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Nos soins énergétiques" style={{ ...inputStyle, marginBottom: '14px' }} />
            <label style={labelStyle}>Catégories / sous-catégories affichées</label>
            <CategoryPicker set={newSel} setter={setNewSel} />
            <button onClick={createSlider} disabled={savingId === '__new__'} style={{ ...btnStyle('#2D1B4E'), padding: '9px 18px', marginTop: '14px' }}>
              {savingId === '__new__' ? 'Création…' : 'Créer le slider'}
            </button>
          </div>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Chargement…</div>
      ) : sliders.length === 0 ? (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          Aucun slider. Crée ton premier slider ci-dessus.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {sliders.map((s) => {
            const isEditing = editingId === s.id;
            const isSaving = savingId === s.id;
            return (
              <div
                key={s.id}
                draggable={!isEditing}
                onDragStart={() => setDragId(s.id)}
                onDragOver={(e) => onDragOver(e, s.id)}
                onDragEnd={onDragEnd}
                style={{
                  background: '#FFF',
                  border: dragId === s.id ? '1px solid #C9A84C' : '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  padding: '16px 18px',
                  opacity: isSaving ? 0.5 : s.isVisible ? 1 : 0.6,
                }}
              >
                {isEditing ? (
                  <div>
                    <label style={labelStyle}>Titre</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
                    <label style={labelStyle}>Catégories affichées</label>
                    <CategoryPicker set={editSel} setter={setEditSel} />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => saveEdit(s.id)} disabled={isSaving} style={btnStyle('#065F46')}>✓ Sauver</button>
                      <button onClick={cancelEdit} disabled={isSaving} style={btnStyle('#9CA3AF')}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#C4B5FD', fontSize: '1.1rem', cursor: 'grab', userSelect: 'none' }} title="Glisser pour réordonner">⋮⋮</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#1F2937', fontSize: '1rem', margin: 0, fontFamily: 'var(--font-cinzel, serif)' }}>{s.title}</p>
                      <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '4px 0 0' }}>
                        {s.categoryIds.length === 0 ? <em>Aucune catégorie sélectionnée</em> : s.categoryIds.map(nameOf).join(' · ')}
                      </p>
                    </div>
                    {!s.isVisible && (
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 600, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>Masqué</span>
                    )}
                    <button onClick={() => toggleVisible(s)} disabled={isSaving} title={s.isVisible ? 'Visible — cliquer pour masquer' : 'Masqué — cliquer pour afficher'} style={iconBtn(s.isVisible ? '#059669' : '#9CA3AF', s.isVisible ? '#6EE7B7' : '#D1D5DB')}>
                      {s.isVisible ? <EyeOpen /> : <EyeOff />}
                    </button>
                    <button onClick={() => startEdit(s)} disabled={isSaving} style={btnStyle('#2D1B4E')} title="Modifier">✎</button>
                    <button onClick={() => removeSlider(s)} disabled={isSaving} style={btnStyle('#991B1B')} title="Supprimer">🗑</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '16px' }}>
        💡 Glisse-dépose les sliders (poignée ⋮⋮) pour changer leur ordre sur l&apos;accueil. Coche une catégorie
        principale pour inclure aussi ses sous-catégories. L&apos;œil 👁 masque un slider sans le supprimer.
      </p>
    </div>
  );
}

/* ─── Icônes ─── */
function EyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ─── Styles ─── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
  fontFamily: 'var(--font-cinzel, serif)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.9rem',
  color: '#1F2937',
  background: '#FFF',
};
function chkLabel(bold: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: bold ? 600 : 400,
    color: '#1F2937',
  };
}
function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#FFF',
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };
}
function iconBtn(color: string, borderColor: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    background: '#FFF',
    color,
    padding: 0,
    cursor: 'pointer',
  };
}
