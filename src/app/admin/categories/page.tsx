'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  cloverCategoryId: string | null;
  displayOrder: number;
  cloverSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Category>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createCategory() {
    if (!newName.trim()) {
      setError('Le nom est requis');
      return;
    }
    setError(null);
    setSavingId('__new__');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création');
      }
      setNewName('');
      setNewDescription('');
      setShowNewForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditValues({ name: cat.name, description: cat.description, slug: cat.slug });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur sauvegarde');
      }
      cancelEdit();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Supprimer la catégorie "${name}" ?\n\nCela vérifiera d'abord qu'aucun produit ne l'utilise.`)) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
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

  // Drag-and-drop reorder
  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setCategories(reordered);
    setDragIndex(index);
  }

  async function onDragEnd() {
    if (dragIndex === null) return;
    setDragIndex(null);
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: categories.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error('Erreur réordonnancement');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      await load(); // refetch pour reset l'ordre côté UI
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
            ᛚ Catégories de produits
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
            Gère les catégories de ta boutique. Les changements se propagent à Clover automatiquement.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          style={{
            background: showNewForm ? '#9CA3AF' : '#2D1B4E',
            color: '#FFF',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showNewForm ? '✕ Annuler' : '+ Nouvelle catégorie'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          ⚠ {error}
        </div>
      )}

      {showNewForm && (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px', border: '2px solid #C9A84C' }}>
          <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '16px' }}>
            Nouvelle catégorie
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Nom *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Encens de Yule"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brève description (optionnel)"
                style={inputStyle}
              />
            </div>
          </div>
          <button
            onClick={createCategory}
            disabled={savingId === '__new__'}
            style={{
              background: '#2D1B4E',
              color: '#FFF',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: savingId === '__new__' ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {savingId === '__new__' ? 'Création...' : 'Créer + pousser à Clover'}
          </button>
        </div>
      )}

      <div style={{ background: '#FFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            Aucune catégorie. Lance <code>npm run db:seed:categories</code> pour créer les 9 catégories de base.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['', 'Ordre', 'Nom', 'Slug', 'Description', 'Clover', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => {
                const isEditing = editingId === cat.id;
                const isSaving = savingId === cat.id;
                return (
                  <tr
                    key={cat.id}
                    draggable={!isEditing}
                    onDragStart={() => onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragEnd={onDragEnd}
                    style={{
                      borderBottom: '1px solid #F3F4F6',
                      background: dragIndex === index ? '#EDE9FE' : index % 2 === 0 ? '#FFF' : '#FAFAFA',
                      cursor: isEditing ? 'default' : 'move',
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: '1.2rem', cursor: 'grab' }}>⋮⋮</td>
                    <td style={tdStyle}>{cat.displayOrder}</td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.name ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          style={inputStyle}
                        />
                      ) : (
                        <strong style={{ color: '#2D1B4E' }}>{cat.name}</strong>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem', color: '#6B7280' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.slug ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, slug: e.target.value })}
                          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem' }}
                        />
                      ) : (
                        cat.slug
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.description ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          style={inputStyle}
                        />
                      ) : (
                        <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>{cat.description || '—'}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {cat.cloverCategoryId ? (
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>
                          ✓ Synchronisée
                        </span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>
                          ⏳ En attente
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => saveEdit(cat.id)} disabled={isSaving} style={btnStyle('#065F46')}>
                            ✓ Sauver
                          </button>
                          <button onClick={cancelEdit} disabled={isSaving} style={btnStyle('#9CA3AF')}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => startEdit(cat)} style={btnStyle('#2D1B4E')}>
                            ✎ Éditer
                          </button>
                          <button onClick={() => deleteCategory(cat.id, cat.name)} style={btnStyle('#991B1B')}>
                            🗑
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: '16px', color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6 }}>
        💡 Glisse-dépose les lignes pour réordonner. L&apos;ordre est synchronisé avec Clover.
        <br />
        ⚠ Une catégorie référencée par des produits ne peut pas être supprimée — il faut d&apos;abord réassigner ces produits.
      </p>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#4B5563',
  marginBottom: '6px',
  fontFamily: 'var(--font-cinzel, serif)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: '6px',
  fontSize: '0.9rem',
  color: '#1F2937',
  background: '#FFF',
};

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontFamily: 'var(--font-cinzel, serif)',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#6B3FA0',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '0.9rem',
  color: '#1F2937',
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#FFF',
    padding: '5px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
  };
}
