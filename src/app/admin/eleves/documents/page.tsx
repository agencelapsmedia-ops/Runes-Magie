'use client';

/**
 * Admin — documents de cours des formations : téléversement d'un PDF par
 * cours (stocké en base, servi uniquement aux élèves dont le cours est
 * terminé), prévisualisation et suppression.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Doc { id: string; title: string; sizeBytes: number; createdAt: string }
interface Course { id: string; code: string; title: string; isOptional: boolean; documents: Doc[] }
interface Formation { id: string; code: string; title: string; courses: Course[] }

export default function DocumentsFormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCourse, setBusyCourse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFormation, setOpenFormation] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/formations/documents');
      const j = await res.json();
      setFormations(j.formations ?? []);
      if (j.formations?.length && !openFormation) setOpenFormation(j.formations[0].id);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  async function upload(courseId: string, file: File) {
    setBusyCourse(courseId); setError(null);
    try {
      const fd = new FormData();
      fd.append('courseId', courseId);
      fd.append('file', file);
      const res = await fetch('/api/admin/formations/documents', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? 'Échec du téléversement.'); return; }
      await load();
    } catch { setError('Erreur réseau.'); } finally { setBusyCourse(null); }
  }

  async function remove(docId: string) {
    if (!confirm('Supprimer ce document ? Les élèves n’y auront plus accès.')) return;
    await fetch(`/api/admin/formations/documents/${docId}`, { method: 'DELETE' });
    await load();
  }

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '16px' };

  return (
    <div style={{ maxWidth: '900px' }}>
      <Link href="/admin/eleves" style={{ color: '#6B3FA0', fontSize: '0.85rem', textDecoration: 'none' }}>← Élèves</Link>
      <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.5rem', color: '#2D1B4E', margin: '12px 0 4px' }}>Documents de cours</h1>
      <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 20px' }}>
        Un PDF par cours (max 10 Mo). Une élève voit le document de son cours <strong>seulement quand Noctura l’a marqué terminé</strong> —
        consultation protégée avec filigrane, sans téléchargement.
      </p>
      {error && <p style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', background: '#FEE2E2', color: '#991B1B', marginBottom: '14px' }}>{error}</p>}

      {loading ? <p style={{ color: '#6B7280' }}>Chargement…</p> : formations.map((f) => (
        <div key={f.id} style={card}>
          <button type="button" onClick={() => setOpenFormation(openFormation === f.id ? null : f.id)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', color: '#2D1B4E', margin: 0 }}>{f.title}</h2>
            <span style={{ color: '#6B3FA0' }}>{openFormation === f.id ? '▲' : '▼'}</span>
          </button>

          {openFormation === f.id && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {f.courses.map((c) => (
                <div key={c.id} style={{ padding: '10px 12px', borderRadius: '8px', background: '#FAFAFA', border: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.83rem', color: '#1F2937', flex: '1 1 260px' }}>
                      {c.code} — {c.title}{c.isOptional ? ' (optionnel)' : ''}
                    </strong>
                    <input
                      ref={(el) => { fileInputs.current[c.id] = el; }}
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={(ev) => {
                        const file = ev.target.files?.[0];
                        if (file) upload(c.id, file);
                        ev.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={busyCourse === c.id}
                      onClick={() => fileInputs.current[c.id]?.click()}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #6B3FA0', background: '#fff', color: '#6B3FA0', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {busyCourse === c.id ? 'Téléversement…' : '+ Ajouter un PDF'}
                    </button>
                  </div>
                  {c.documents.map((d) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', fontSize: '0.8rem', color: '#4B5563' }}>
                      📜 <a href={`/compte/formations/document/${d.id}`} target="_blank" rel="noreferrer" style={{ color: '#6B3FA0' }}>{d.title}</a>
                      <span style={{ color: '#9CA3AF' }}>({(d.sizeBytes / 1024 / 1024).toFixed(1)} Mo)</span>
                      <button type="button" onClick={() => remove(d.id)} style={{ border: 'none', background: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '0.75rem' }}>Supprimer</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
