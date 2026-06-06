'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTemplate } from '@/lib/page-templates';

interface Props {
  id: string;
  template: string;
  isSystem: boolean;
  initialTitle: string;
  initialSlug: string;
  initialMetaTitle: string;
  initialMetaDescription: string;
  initialValues: Record<string, string>;
}

export default function PageEditor({
  id,
  template,
  isSystem,
  initialTitle,
  initialSlug,
  initialMetaTitle,
  initialMetaDescription,
  initialValues,
}: Props) {
  const router = useRouter();
  const tpl = getTemplate(template)!;

  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setField(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function save() {
    if (!title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        title,
        metaTitle,
        metaDescription,
        content: values,
      };
      if (!isSystem) payload.slug = slug;

      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur de sauvegarde');
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: '780px' }}>
      {error && <div style={errorBox}>⚠ {error}</div>}
      {saved && <div style={okBox}>✓ Modifications enregistrées.</div>}

      {/* Réglages généraux */}
      <section style={card}>
        <h2 style={cardTitle}>Réglages</h2>
        <label style={labelStyle}>Titre (interne / onglet)</label>
        <input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} style={{ ...inputStyle, marginBottom: '14px' }} />

        {!isSystem && (
          <>
            <label style={labelStyle}>Adresse de la page (slug)</label>
            <input value={slug} onChange={(e) => { setSlug(e.target.value); setSaved(false); }} style={{ ...inputStyle, marginBottom: '4px' }} />
            <p style={hint}>URL publique : <code>/{slug}</code></p>
          </>
        )}

        <label style={labelStyle}>Titre SEO (meta title)</label>
        <input value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); setSaved(false); }} placeholder="Optionnel" style={{ ...inputStyle, marginBottom: '14px' }} />

        <label style={labelStyle}>Description SEO (meta description)</label>
        <textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); setSaved(false); }} placeholder="Optionnel" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </section>

      {/* Sections du modèle */}
      {tpl.sections.map((section) => (
        <section key={section.title} style={card}>
          <h2 style={cardTitle}>{section.title}</h2>
          {section.description && <p style={{ ...hint, marginTop: '-4px', marginBottom: '14px' }}>{section.description}</p>}
          {section.fields.map((f) => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={values[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                  rows={f.key === 'body' ? 10 : 3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              ) : (
                <input
                  value={values[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                  style={inputStyle}
                />
              )}
              {f.help && <p style={hint}>{f.help}</p>}
            </div>
          ))}
        </section>
      ))}

      {/* Barre d'action collante */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(248,246,242,0.95)', padding: '14px 0', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={save} disabled={saving} style={{ ...btnStyle('#065F46'), padding: '10px 22px', fontSize: '0.9rem' }}>
          {saving ? 'Enregistrement…' : '✓ Enregistrer'}
        </button>
        {saved && <span style={{ color: '#059669', fontSize: '0.85rem' }}>Enregistré</span>}
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const card: React.CSSProperties = {
  background: '#FFF',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  padding: '20px',
  marginBottom: '16px',
};
const cardTitle: React.CSSProperties = {
  fontFamily: 'var(--font-cinzel, serif)',
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#2D1B4E',
  margin: '0 0 16px',
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
  fontFamily: 'inherit',
};
const hint: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '0.78rem',
  margin: '4px 0 0',
};
const errorBox: React.CSSProperties = {
  background: '#FEE2E2',
  border: '1px solid #FCA5A5',
  color: '#991B1B',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '16px',
  fontSize: '0.9rem',
};
const okBox: React.CSSProperties = {
  background: '#D1FAE5',
  border: '1px solid #6EE7B7',
  color: '#065F46',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '16px',
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
