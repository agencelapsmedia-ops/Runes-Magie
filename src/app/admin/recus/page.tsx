'use client';

/** Admin — tous les reçus (RM-AAAA-NNNN) : recherche, totaux, lien imprimable. */
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Recu {
  id: string;
  number: string;
  description: string;
  amount: number;
  method: string;
  kind: string;
  paidAt: string;
  client: { id: string; firstName: string; lastName: string };
}

const METHOD_FR: Record<string, string> = { CARD: 'Carte', INTERAC: 'Interac', CASH: 'Comptant', OTHER: 'Autre' };

export default function RecusAdminPage() {
  const [recus, setRecus] = useState<Recu[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/recus');
        const j = await res.json();
        setRecus(j.recus ?? []);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = recus.filter((r) => {
    const q = search.toLowerCase();
    return !q || `${r.number} ${r.client.firstName} ${r.client.lastName} ${r.description}`.toLowerCase().includes(q);
  });
  const total = filtered.reduce((s, r) => s + r.amount, 0);

  const fdate = (s: string) => new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium', timeZone: 'America/Montreal' }).format(new Date(s));

  return (
    <div style={{ maxWidth: '1000px' }}>
      <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.5rem', color: '#2D1B4E', margin: '0 0 4px' }}>Reçus</h1>
      <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 16px' }}>
        Tous les reçus émis (séances, Interac, formations). Clique un reçu pour l’ouvrir/l’imprimer.
      </p>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          placeholder="Rechercher (numéro, cliente, description)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 280px', maxWidth: '380px', padding: '9px 11px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem', color: '#111827' }}
        />
        <span style={{ fontSize: '0.9rem', color: '#4B5563' }}>
          {filtered.length} reçu{filtered.length > 1 ? 's' : ''} · <strong style={{ color: '#065F46' }}>{total.toFixed(2)} $</strong>
        </span>
      </div>

      {loading ? <p style={{ color: '#6B7280' }}>Chargement…</p> : (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px' }}>Numéro</th>
                <th>Date</th>
                <th>Cliente</th>
                <th>Description</th>
                <th>Mode</th>
                <th style={{ textAlign: 'right', paddingRight: '12px' }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6', color: '#1F2937' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <Link href={`/compte/achats/recu/${r.id}`} target="_blank" style={{ color: '#6B3FA0', fontWeight: 600 }}>{r.number}</Link>
                  </td>
                  <td>{fdate(r.paidAt)}</td>
                  <td>
                    <Link href={`/admin/clients/${r.client.id}`} style={{ color: '#1F2937' }}>{r.client.firstName} {r.client.lastName}</Link>
                  </td>
                  <td style={{ color: '#4B5563' }}>{r.description}</td>
                  <td>{METHOD_FR[r.method] ?? r.method}</td>
                  <td style={{ textAlign: 'right', paddingRight: '12px', fontWeight: 600 }}>{r.amount.toFixed(2)} $</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
