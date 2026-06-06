'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PAGE_TEMPLATES, getTemplate } from '@/lib/page-templates';

interface SitePage {
  id: string;
  slug: string;
  title: string;
  template: string;
  isPublished: boolean;
  isSystem: boolean;
}

export default function SitePagesPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Création
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('standard');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/pages');
      if (!res.ok) throw new Error('Erreur de chargement');
      setPages(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function createPage() {
    if (!newTitle.trim()) {
      setError('Le titre est requis.');
      return;
    }
    setSavingId('__new__');
    setError(null);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, template: newTemplate }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création');
      }
      setNewTitle('');
      setNewTemplate('standard');
      setShowNew(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function togglePublish(p: SitePage) {
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/pages/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !p.isPublished }),
      });
      if (!res.ok) throw new Error('Erreur');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSavingId(null);
    }
  }

  async function removePage(p: SitePage) {
    if (!confirm(`Supprimer la page « ${p.title} » ?`)) return;
    setSavingId(p.id);
    try {
      const res = await fetch(`/api/admin/pages/${p.id}`, { method: 'DELETE' });
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

  const templateLabel = (id: string) => getTemplate(id)?.label ?? id;
  const publicUrl = (p: SitePage) => (p.slug === 'accueil' ? '/' : `/${p.slug}`);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/site" style={linkBack}>
          ← Gestion site web
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', margin: '8px 0 4px' }}>
          ᛟ Pages du site
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Crée des pages à partir d’un <strong>modèle</strong> et modifie leurs textes. La <strong>page d’accueil</strong>{' '}
          permet d’éditer les textes (héros, à-propos…) qui ne sont pas gérés par un autre module.
        </p>
      </div>

      {error && (
        <div style={errorBox}>⚠ {error}</div>
      )}

      {/* Création */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowNew(!showNew)} style={{ ...btnStyle(showNew ? '#9CA3AF' : '#2D1B4E'), padding: '10px 18px', fontSize: '0.9rem' }}>
          {showNew ? '✕ Annuler' : '+ Nouvelle page'}
        </button>
        {showNew && (
          <div style={{ marginTop: '12px', background: '#FFF', border: '2px solid #C9A84C', borderRadius: '12px', padding: '18px', maxWidth: '560px' }}>
            <label style={labelStyle}>Titre de la page</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Nos engagements" style={{ ...inputStyle, marginBottom: '14px' }} />
            <label style={labelStyle}>Modèle</label>
            <select value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} style={{ ...inputStyle, marginBottom: '6px' }}>
              {PAGE_TEMPLATES.filter((t) => !t.system).map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '0 0 14px' }}>
              {getTemplate(newTemplate)?.description}
            </p>
            <button onClick={createPage} disabled={savingId === '__new__'} style={{ ...btnStyle('#2D1B4E'), padding: '9px 18px' }}>
              {savingId === '__new__' ? 'Création…' : 'Créer la page'}
            </button>
          </div>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Chargement…</div>
      ) : pages.length === 0 ? (
        <div style={{ background: '#FFF', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#9CA3AF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          Aucune page.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {pages.map((p) => {
            const isSaving = savingId === p.id;
            return (
              <div
                key={p.id}
                style={{
                  background: '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  padding: '16px 18px',
                  opacity: isSaving ? 0.5 : p.isPublished ? 1 : 0.65,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, color: '#1F2937', fontSize: '1rem', margin: 0, fontFamily: 'var(--font-cinzel, serif)' }}>{p.title}</p>
                    {p.isSystem && <span style={badge('#EDE9FE', '#5B21B6', '#DDD6FE')}>Système</span>}
                    {!p.isPublished && <span style={badge('#F3F4F6', '#6B7280', '#E5E7EB')}>Masquée</span>}
                  </div>
                  <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '4px 0 0' }}>
                    Modèle : <strong>{templateLabel(p.template)}</strong>
                    {' · '}
                    <a href={publicUrl(p)} target="_blank" rel="noreferrer" style={{ color: '#6B3FA0', textDecoration: 'none' }}>
                      {publicUrl(p)} ↗
                    </a>
                  </p>
                </div>
                <button onClick={() => togglePublish(p)} disabled={isSaving} style={btnStyle(p.isPublished ? '#059669' : '#9CA3AF')} title={p.isPublished ? 'Publiée — cliquer pour masquer' : 'Masquée — cliquer pour publier'}>
                  {p.isPublished ? '👁 Publiée' : '🚫 Masquée'}
                </button>
                <Link href={`/admin/site/pages/${p.id}`} style={{ ...btnStyle('#2D1B4E'), textDecoration: 'none', display: 'inline-block' }}>
                  ✎ Modifier
                </Link>
                {!p.isSystem && (
                  <button onClick={() => removePage(p)} disabled={isSaving} style={btnStyle('#991B1B')} title="Supprimer">🗑</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const linkBack: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#6B3FA0',
  textDecoration: 'none',
  fontFamily: 'var(--font-cinzel, serif)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
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
const errorBox: React.CSSProperties = {
  background: '#FEE2E2',
  border: '1px solid #FCA5A5',
  color: '#991B1B',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '0.9rem',
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
function badge(bg: string, color: string, border: string): React.CSSProperties {
  return {
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '0.68rem',
    fontWeight: 600,
    background: bg,
    color,
    border: `1px solid ${border}`,
  };
}
