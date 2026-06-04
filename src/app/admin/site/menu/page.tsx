'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PUBLIC_PAGES } from '@/lib/site-pages';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  type: string; // PAGE | CUSTOM
  location: string; // HEADER | FOOTER
  isVisible: boolean;
  openInNewTab: boolean;
  sortOrder: number;
}

const LOCATIONS: { key: 'HEADER' | 'FOOTER'; title: string; desc: string }[] = [
  { key: 'HEADER', title: 'Menu du haut', desc: 'La barre de navigation en haut du site.' },
  { key: 'FOOTER', title: 'Pied de page — colonne « Navigation »', desc: 'Les liens de la colonne Navigation du pied de page.' },
];

export default function MenuManagerPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ label: string; href: string }>({ label: '', href: '' });

  // ajout (par location)
  const [selectedPage, setSelectedPage] = useState<Record<string, string>>({});
  const [customOpen, setCustomOpen] = useState<Record<string, boolean>>({});
  const [customLabel, setCustomLabel] = useState<Record<string, string>>({});
  const [customHref, setCustomHref] = useState<Record<string, string>>({});

  // glisser-déposer
  const [dragLoc, setDragLoc] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/menu');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createItem(payload: { label: string; href: string; location: string; type: string }) {
    setError(null);
    setSavingId('__new__');
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  function addPage(location: string) {
    const href = selectedPage[location];
    if (!href) {
      setError('Choisis une page à ajouter.');
      return;
    }
    const page = PUBLIC_PAGES.find((p) => p.href === href);
    if (!page) return;
    createItem({ label: page.label, href: page.href, location, type: 'PAGE' });
    setSelectedPage((s) => ({ ...s, [location]: '' }));
  }

  function addCustom(location: string) {
    const label = (customLabel[location] || '').trim();
    const href = (customHref[location] || '').trim();
    if (!label || !href) {
      setError('Libellé et URL sont requis pour un lien personnalisé.');
      return;
    }
    createItem({ label, href, location, type: 'CUSTOM' });
    setCustomLabel((s) => ({ ...s, [location]: '' }));
    setCustomHref((s) => ({ ...s, [location]: '' }));
    setCustomOpen((s) => ({ ...s, [location]: false }));
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditValues({ label: item.label, href: item.href });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({ label: '', href: '' });
  }

  async function saveEdit(id: string) {
    if (!editValues.label.trim() || !editValues.href.trim()) {
      setError('Libellé et URL ne peuvent pas être vides.');
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editValues.label, href: editValues.href }),
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

  async function toggleVisible(item: MenuItem) {
    setSavingId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !item.isVisible }),
      });
      if (!res.ok) throw new Error('Erreur');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function removeItem(item: MenuItem) {
    if (!confirm(`Supprimer définitivement « ${item.label} » du menu ?`)) return;
    setSavingId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  // ─── glisser-déposer (par location) ───
  function onDragStart(location: string, index: number) {
    setDragLoc(location);
    setDragIndex(index);
  }

  function onDragOver(e: React.DragEvent, location: string, index: number) {
    e.preventDefault();
    if (dragLoc !== location || dragIndex === null || dragIndex === index) return;
    const list = items.filter((i) => i.location === location);
    const others = items.filter((i) => i.location !== location);
    const [moved] = list.splice(dragIndex, 1);
    list.splice(index, 0, moved);
    setItems([...others, ...list]);
    setDragIndex(index);
  }

  async function onDragEnd(location: string) {
    if (dragLoc !== location || dragIndex === null) {
      setDragLoc(null);
      setDragIndex(null);
      return;
    }
    const orderedIds = items.filter((i) => i.location === location).map((i) => i.id);
    setDragLoc(null);
    setDragIndex(null);
    try {
      const res = await fetch('/api/admin/menu/reorder', {
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

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/site" style={{ fontSize: '0.8rem', color: '#6B3FA0', textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ← Gestion site web
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', margin: '8px 0 4px' }}>
          ᛗ Gestion du menu
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Ajoute des pages ou des liens, glisse-dépose pour réordonner, masque sans supprimer.
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Chargement…</div>
      ) : (
        LOCATIONS.map((loc) => {
          const sectionItems = items.filter((i) => i.location === loc.key);
          const usedHrefs = new Set(sectionItems.map((i) => i.href));
          const availablePages = PUBLIC_PAGES.filter((p) => !usedHrefs.has(p.href));
          return (
            <section key={loc.key} style={{ marginBottom: '40px', background: '#FFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {/* Titre de section */}
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #F3F4F6', background: '#FAF9FC' }}>
                <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.1rem', fontWeight: 700, color: '#2D1B4E', margin: 0 }}>{loc.title}</h2>
                <p style={{ color: '#9CA3AF', fontSize: '0.8rem', margin: '4px 0 0' }}>{loc.desc}</p>
              </div>

              {/* Zone d'ajout */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <select
                  value={selectedPage[loc.key] || ''}
                  onChange={(e) => setSelectedPage((s) => ({ ...s, [loc.key]: e.target.value }))}
                  style={{ ...inputStyle, width: 'auto', minWidth: '220px' }}
                >
                  <option value="">— Choisir une page à ajouter —</option>
                  {availablePages.map((p) => (
                    <option key={p.href} value={p.href}>{p.label} ({p.href})</option>
                  ))}
                </select>
                <button onClick={() => addPage(loc.key)} disabled={savingId === '__new__'} style={btnStyle('#2D1B4E')}>
                  + Ajouter la page
                </button>
                <span style={{ color: '#D1D5DB' }}>|</span>
                <button onClick={() => setCustomOpen((s) => ({ ...s, [loc.key]: !s[loc.key] }))} style={btnStyle('#6B3FA0')}>
                  {customOpen[loc.key] ? '✕ Annuler' : '+ Lien personnalisé'}
                </button>
              </div>

              {/* Formulaire lien personnalisé */}
              {customOpen[loc.key] && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', background: '#FCFBFE', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={labelStyle}>Libellé</label>
                    <input type="text" value={customLabel[loc.key] || ''} onChange={(e) => setCustomLabel((s) => ({ ...s, [loc.key]: e.target.value }))} placeholder="Ex: Mon blogue" style={{ ...inputStyle, width: '200px' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>URL</label>
                    <input type="text" value={customHref[loc.key] || ''} onChange={(e) => setCustomHref((s) => ({ ...s, [loc.key]: e.target.value }))} placeholder="/ma-page ou https://…" style={{ ...inputStyle, width: '260px' }} />
                  </div>
                  <button onClick={() => addCustom(loc.key)} disabled={savingId === '__new__'} style={btnStyle('#2D1B4E')}>
                    Ajouter le lien
                  </button>
                </div>
              )}

              {/* Liste des items */}
              {sectionItems.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
                  Aucun lien dans ce menu. Ajoute une page ci-dessus.
                </div>
              ) : (
                <div>
                  {sectionItems.map((item, index) => {
                    const isEditing = editingId === item.id;
                    const isSaving = savingId === item.id;
                    return (
                      <div
                        key={item.id}
                        draggable={!isEditing}
                        onDragStart={() => onDragStart(loc.key, index)}
                        onDragOver={(e) => onDragOver(e, loc.key, index)}
                        onDragEnd={() => onDragEnd(loc.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 20px',
                          borderBottom: '1px solid #F3F4F6',
                          background: dragLoc === loc.key && dragIndex === index ? '#EDE9FE' : '#FFF',
                          opacity: isSaving ? 0.5 : item.isVisible ? 1 : 0.55,
                          cursor: isEditing ? 'default' : 'move',
                        }}
                      >
                        {/* Poignée */}
                        <span style={{ color: '#C4B5FD', fontSize: '1.1rem', cursor: 'grab', userSelect: 'none' }} title="Glisser pour réordonner">⋮⋮</span>

                        {isEditing ? (
                          <>
                            <input type="text" value={editValues.label} onChange={(e) => setEditValues((v) => ({ ...v, label: e.target.value }))} placeholder="Libellé" style={{ ...inputStyle, width: '180px' }} />
                            <input type="text" value={editValues.href} onChange={(e) => setEditValues((v) => ({ ...v, href: e.target.value }))} placeholder="URL" style={{ ...inputStyle, flex: 1, minWidth: '180px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                            <button onClick={() => saveEdit(item.id)} disabled={isSaving} style={btnStyle('#065F46')}>✓ Sauver</button>
                            <button onClick={cancelEdit} disabled={isSaving} style={btnStyle('#9CA3AF')}>✕</button>
                          </>
                        ) : (
                          <>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontWeight: 600, color: '#1F2937', fontSize: '0.92rem' }}>{item.label}</span>
                              <span style={{ marginLeft: '8px', color: '#9CA3AF', fontSize: '0.78rem', fontFamily: 'monospace' }}>{item.href}</span>
                            </div>

                            {/* Badge type */}
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600, background: item.type === 'CUSTOM' ? '#FEF3C7' : '#EDE9FE', color: item.type === 'CUSTOM' ? '#92400E' : '#6B3FA0' }}>
                              {item.type === 'CUSTOM' ? 'Lien' : 'Page'}
                            </span>
                            {!item.isVisible && (
                              <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                                Masqué
                              </span>
                            )}

                            {/* Œil masquer/afficher */}
                            <button
                              onClick={() => toggleVisible(item)}
                              disabled={isSaving}
                              title={item.isVisible ? 'Visible — cliquer pour masquer' : 'Masqué — cliquer pour afficher'}
                              style={iconBtn(item.isVisible ? '#059669' : '#9CA3AF', item.isVisible ? '#6EE7B7' : '#D1D5DB')}
                            >
                              {item.isVisible ? <EyeOpen /> : <EyeOff />}
                            </button>
                            {/* Éditer */}
                            <button onClick={() => startEdit(item)} disabled={isSaving} style={btnStyle('#2D1B4E')}>✎</button>
                            {/* Supprimer */}
                            <button onClick={() => removeItem(item)} disabled={isSaving} style={btnStyle('#991B1B')}>🗑</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6 }}>
        💡 Glisse-dépose les lignes (poignée ⋮⋮) pour changer l&apos;ordre. L&apos;œil masque un lien
        sans le supprimer (il reste ici, en réserve). Les changements apparaissent sur le site en quelques secondes.
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
