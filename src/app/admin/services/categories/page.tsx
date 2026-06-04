'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CatNode {
  id: string;
  name: string;
  slug: string;
  description: string;
  emoji: string;
  parentId: string | null;
  sortOrder: number;
  showOnHome: boolean;
  isActive: boolean;
  offeringCount: number;
  children: CatNode[];
}

const ROOT = '__root__';

export default function ServiceCategoriesPage() {
  const [tree, setTree] = useState<CatNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Création
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newParent, setNewParent] = useState(''); // '' = catégorie principale
  const [newShowOnHome, setNewShowOnHome] = useState(false);

  // Édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  // Glisser-déposer
  const [dragGroup, setDragGroup] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/service-categories');
      if (!res.ok) throw new Error('Erreur de chargement');
      setTree(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory() {
    if (!newName.trim()) {
      setError('Le nom est requis.');
      return;
    }
    setSavingId('__new__');
    setError(null);
    try {
      const res = await fetch('/api/admin/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          emoji: newEmoji,
          parentId: newParent || undefined,
          showOnHome: newShowOnHome,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création');
      }
      setNewName('');
      setNewEmoji('');
      setNewParent('');
      setNewShowOnHome(false);
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  function startEdit(node: CatNode) {
    setEditingId(node.id);
    setEditName(node.name);
    setEditEmoji(node.emoji);
  }
  function cancelEdit() {
    setEditingId(null);
  }
  async function saveEdit(id: string) {
    if (!editName.trim()) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/service-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, emoji: editEmoji }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur');
      }
      cancelEdit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function removeCategory(node: CatNode) {
    if (!confirm(`Supprimer la catégorie « ${node.name} » ?`)) return;
    setSavingId(node.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/service-categories/${node.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur suppression');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  // ─── glisser-déposer (par niveau) ───
  function groupArray(group: string): CatNode[] {
    return group === ROOT ? tree : tree.find((r) => r.id === group)?.children ?? [];
  }
  function onDragStart(group: string, id: string) {
    setDragGroup(group);
    setDragId(id);
  }
  function onDragOver(e: React.DragEvent, group: string, overId: string) {
    e.preventDefault();
    if (dragGroup !== group || !dragId || dragId === overId) return;
    const clone: CatNode[] = JSON.parse(JSON.stringify(tree));
    const arr = group === ROOT ? clone : clone.find((r) => r.id === group)?.children ?? [];
    const from = arr.findIndex((n) => n.id === dragId);
    const to = arr.findIndex((n) => n.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setTree(clone);
  }
  async function onDragEnd(group: string) {
    if (dragGroup !== group) {
      setDragGroup(null);
      setDragId(null);
      return;
    }
    const orderedIds = groupArray(group).map((n) => n.id);
    setDragGroup(null);
    setDragId(null);
    try {
      const res = await fetch('/api/admin/service-categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Erreur réordonnancement');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      await load();
    }
  }

  function renderRow(node: CatNode, group: string, depth: number) {
    const isEditing = editingId === node.id;
    const isSaving = savingId === node.id;
    return (
      <div
        key={node.id}
        draggable={!isEditing}
        onDragStart={() => onDragStart(group, node.id)}
        onDragOver={(e) => onDragOver(e, group, node.id)}
        onDragEnd={() => onDragEnd(group)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 16px',
          paddingLeft: `${16 + depth * 28}px`,
          borderBottom: '1px solid #F3F4F6',
          background: dragGroup === group && dragId === node.id ? '#EDE9FE' : depth > 0 ? '#FCFBFE' : '#FFF',
          opacity: isSaving ? 0.5 : node.isActive ? 1 : 0.6,
          cursor: isEditing ? 'default' : 'move',
        }}
      >
        <span style={{ color: '#C4B5FD', fontSize: '1.05rem', cursor: 'grab', userSelect: 'none' }} title="Glisser pour réordonner">⋮⋮</span>
        {depth > 0 && <span style={{ color: '#C4B5FD' }}>↳</span>}

        {isEditing ? (
          <>
            <input value={editEmoji} onChange={(e) => setEditEmoji(e.target.value)} maxLength={4} placeholder="icône" style={{ ...inputStyle, width: '60px', textAlign: 'center' }} />
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom" style={{ ...inputStyle, width: '240px' }} />
            <button onClick={() => saveEdit(node.id)} disabled={isSaving} style={btnStyle('#065F46')}>✓ Sauver</button>
            <button onClick={cancelEdit} disabled={isSaving} style={btnStyle('#9CA3AF')}>✕</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.3rem', width: '28px', textAlign: 'center', color: '#C9A84C' }}>{node.emoji || '•'}</span>
            <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.95rem', flex: 1 }}>{node.name}</span>

            <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 600, background: '#EDE9FE', color: '#6B3FA0' }}>
              {node.offeringCount} service{node.offeringCount > 1 ? 's' : ''}
            </span>

            <button onClick={() => startEdit(node)} disabled={isSaving} style={btnStyle('#2D1B4E')} title="Modifier">✎</button>
            <button onClick={() => removeCategory(node)} disabled={isSaving} style={btnStyle('#991B1B')} title="Supprimer">🗑</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/services" style={{ fontSize: '0.8rem', color: '#6B3FA0', textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ← Services
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', margin: '8px 0 4px' }}>
          ᛒ Catégories de services
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Organise tes services en catégories (et sous-catégories). Les carrousels de l’accueil se composent dans « Sliders de l’accueil ».
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* Bouton + formulaire de création */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowNew(!showNew)} style={{ ...btnStyle(showNew ? '#9CA3AF' : '#2D1B4E'), padding: '10px 18px', fontSize: '0.9rem' }}>
          {showNew ? '✕ Annuler' : '+ Nouvelle catégorie'}
        </button>
        {showNew && (
          <div style={{ marginTop: '12px', background: '#FFF', border: '2px solid #C9A84C', borderRadius: '12px', padding: '18px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Icône</label>
              <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={4} placeholder="ᛊ" style={{ ...inputStyle, width: '70px', textAlign: 'center', fontSize: '1.1rem' }} />
            </div>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Séances Rituels" style={{ ...inputStyle, width: '220px' }} />
            </div>
            <div>
              <label style={labelStyle}>Rattacher à</label>
              <select value={newParent} onChange={(e) => setNewParent(e.target.value)} style={{ ...inputStyle, width: '220px' }}>
                <option value="">— Catégorie principale (1er niveau) —</option>
                {tree.map((root) => (
                  <option key={root.id} value={root.id}>Sous-catégorie de : {root.name}</option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1F2937', fontWeight: 500, fontSize: '0.85rem', paddingBottom: '8px' }}>
              <input type="checkbox" checked={newShowOnHome} onChange={(e) => setNewShowOnHome(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              Slider sur l’accueil
            </label>
            <button onClick={createCategory} disabled={savingId === '__new__'} style={{ ...btnStyle('#2D1B4E'), padding: '9px 18px' }}>
              {savingId === '__new__' ? 'Création…' : 'Créer'}
            </button>
          </div>
        )}
      </div>

      {/* Arbre */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Chargement…</div>
      ) : tree.length === 0 ? (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          Aucune catégorie. Crée ta première catégorie ci-dessus.
        </div>
      ) : (
        <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {tree.map((root) => (
            <div key={root.id}>
              {renderRow(root, ROOT, 0)}
              {root.children.map((child) => renderRow(child, root.id, 1))}
            </div>
          ))}
        </div>
      )}

      <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '16px' }}>
        💡 Glisse-dépose (poignée ⋮⋮) pour réordonner au sein d’un niveau. Pour assigner un service à une catégorie,
        va dans la fiche du service (Services &amp; Soins). Les carrousels se composent dans « Sliders de l’accueil ».
        <br />
        ⚠ Une catégorie avec des sous-catégories ou des services assignés ne peut pas être supprimée — vide-la d’abord.
      </p>
    </div>
  );
}

/* ─── Styles ─── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  color: '#4B5563',
  marginBottom: '4px',
  fontFamily: 'var(--font-cinzel, serif)',
};
const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.9rem',
  color: '#1F2937',
  background: '#FFF',
};
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
