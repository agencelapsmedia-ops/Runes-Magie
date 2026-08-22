'use client';

/**
 * Admin — Élèves / Formations : liste des inscriptions + inscription d'une
 * cliente à une formation (Runes, Tarot). Phase 3 du module Formations.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Formation {
  id: string;
  code: string;
  title: string;
  pricePerCourse: number | null;
  pricePerBlock10: number | null;
  defaultPrice: number | null;
}
interface EleveRow {
  id: string;
  client: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  formation: { code: string; title: string };
  status: string;
  completed: number;
  total: number;
  credits: number;
  startedAt: string;
}
interface ClientHit { id: string; firstName: string; lastName: string; email: string; phone: string | null }

const STATUS_FR: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: 'Active', bg: '#D1FAE5', fg: '#065F46' },
  PAYMENT_DUE: { label: 'Paiement dû', bg: '#FEF3C7', fg: '#92400E' },
  SUSPENDED: { label: 'Suspendue', bg: '#FEE2E2', fg: '#991B1B' },
  COMPLETED: { label: 'Complétée', bg: '#E0E7FF', fg: '#3730A3' },
  DIPLOMA_ELIGIBLE: { label: 'Admissible au diplôme', bg: '#EDE9FE', fg: '#5B21B6' },
  DIPLOMA_AWARDED: { label: 'Diplômée 🎓', bg: '#FDF4DC', fg: '#92400E' },
};

export default function ElevesPage() {
  const [eleves, setEleves] = useState<EleveRow[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openInscription, setOpenInscription] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientHits, setClientHits] = useState<ClientHit[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientHit | null>(null);
  const [formationId, setFormationId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/formations/eleves');
      const j = await res.json();
      setEleves(j.eleves ?? []);
      setFormations(j.formations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Recherche de clientes (réutilise la route admin existante)
  useEffect(() => {
    if (clientSearch.trim().length < 2) { setClientHits([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(clientSearch.trim())}`);
        const j = await res.json();
        setClientHits(Array.isArray(j.clients) ? j.clients.slice(0, 6) : []);
      } catch { setClientHits([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [clientSearch]);

  async function inscrire() {
    if (!selectedClient || !formationId) { setError('Choisis une cliente et une formation.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/formations/eleves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          formationId,
          totalPrice: totalPrice.trim() ? parseFloat(totalPrice.replace(',', '.')) : null,
          adminNotes: notes.trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? 'Échec de l’inscription.'); return; }
      setOpenInscription(false);
      setSelectedClient(null); setClientSearch(''); setFormationId(''); setTotalPrice(''); setNotes('');
      await load();
    } catch { setError('Erreur réseau.'); } finally { setSaving(false); }
  }

  const filtered = eleves.filter((e) => {
    const q = search.toLowerCase();
    return !q || `${e.client.firstName} ${e.client.lastName} ${e.client.email} ${e.formation.title}`.toLowerCase().includes(q);
  });

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' };
  const btn: React.CSSProperties = { padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#6B3FA0,#4A2D7A)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
  const field: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem', color: '#111827', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.5rem', color: '#2D1B4E', margin: 0 }}>Élèves / Formations</h1>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '4px 0 0' }}>Parcours Runes & Tarot avec Noctura — progression, crédits et paiements.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/eleves/documents" style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #6B3FA0', background: '#fff', color: '#6B3FA0', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>📜 Documents de cours</Link>
          <button type="button" style={btn} onClick={() => setOpenInscription(true)}>+ Inscrire une élève</button>
        </div>
      </div>

      <input placeholder="Rechercher une élève ou une formation…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...field, maxWidth: '360px', marginBottom: '16px' }} />

      {loading ? (
        <p style={{ color: '#6B7280' }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#6B7280' }}>
          Aucune élève inscrite pour l’instant. Clique « Inscrire une élève » pour commencer
          (ou pour migrer une cliente déjà en formation).
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((e) => {
            const st = STATUS_FR[e.status] ?? STATUS_FR.ACTIVE;
            const pct = e.total ? Math.round((e.completed / e.total) * 100) : 0;
            return (
              <Link key={e.id} href={`/admin/eleves/${e.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', cursor: 'pointer' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ color: '#1F2937', fontSize: '1rem' }}>{e.client.firstName} {e.client.lastName}</strong>
                    <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>{e.formation.title}</div>
                  </div>
                  <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Progression {e.completed} / {e.total}</div>
                    <div style={{ height: '8px', borderRadius: '4px', background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6B3FA0,#C9A84C)' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: e.credits > 0 ? '#065F46' : '#991B1B' }}>{e.credits}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>crédit{e.credits > 1 ? 's' : ''}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: st.bg, color: st.fg }}>{st.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {openInscription && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,12,34,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => !saving && setOpenInscription(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', color: '#2D1B4E', margin: '0 0 16px', fontSize: '1.1rem' }}>Inscrire une élève</h3>

            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', textTransform: 'uppercase', marginBottom: '6px' }}>Cliente</label>
            {selectedClient ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', background: 'rgba(107,63,160,0.08)', border: '1px solid #C4B5FD', marginBottom: '14px' }}>
                <span style={{ color: '#1F2937', fontSize: '0.9rem' }}>{selectedClient.firstName} {selectedClient.lastName} — {selectedClient.email}</span>
                <button type="button" onClick={() => setSelectedClient(null)} style={{ border: 'none', background: 'none', color: '#6B3FA0', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input placeholder="Nom ou courriel…" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} style={field} />
                {clientHits.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #D1D5DB', borderRadius: '6px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)' }}>
                    {clientHits.map((c) => (
                      <button key={c.id} type="button" onClick={() => { setSelectedClient(c); setClientHits([]); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#1F2937' }}>
                        {c.firstName} {c.lastName} <span style={{ color: '#9CA3AF' }}>— {c.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', textTransform: 'uppercase', marginBottom: '6px' }}>Formation</label>
            <select value={formationId} onChange={(e) => setFormationId(e.target.value)} style={{ ...field, marginBottom: '14px' }}>
              <option value="">Choisir…</option>
              {formations.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', textTransform: 'uppercase', marginBottom: '6px' }}>Prix convenu (optionnel)</label>
            <input placeholder="Ex. : 2025 (3 blocs à 675 $)" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} style={{ ...field, marginBottom: '14px' }} />

            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B3FA0', textTransform: 'uppercase', marginBottom: '6px' }}>Note (optionnel)</label>
            <input placeholder="Ex. : migration de l’ancienne formation" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...field, marginBottom: '4px' }} />
            <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: '4px 0 0' }}>
              L’inscription débloque le premier cours. Pour une cliente déjà en cours de formation,
              ouvre ensuite sa fiche pour ajuster la progression, les crédits et les paiements historiques.
            </p>

            {error && <p style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', background: '#FEE2E2', color: '#991B1B' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button type="button" disabled={saving} onClick={() => setOpenInscription(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', color: '#4B5563', cursor: 'pointer' }}>Annuler</button>
              <button type="button" disabled={saving || !selectedClient || !formationId} onClick={inscrire} style={{ ...btn, opacity: saving || !selectedClient || !formationId ? 0.5 : 1 }}>{saving ? 'Inscription…' : 'Inscrire'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
