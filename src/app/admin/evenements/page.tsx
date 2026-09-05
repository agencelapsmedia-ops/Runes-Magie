'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Evenement, formaterDateEvenement } from './FormulaireEvenement';

function EtatBadge({ evenement }: { evenement: Evenement }) {
  const meta = evenement.cancelledAt
    ? { label: 'Annulé', bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5' }
    : evenement.isPublished
      ? { label: 'Publié', bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7' }
      : { label: 'Brouillon', bg: '#F3F4F6', fg: '#4B5563', border: '#D1D5DB' };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        fontFamily: 'var(--font-cinzel, serif)',
        background: meta.bg,
        color: meta.fg,
        border: `1px solid ${meta.border}`,
      }}
    >
      {meta.label}
    </span>
  );
}

export default function EvenementsAdminPage() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/evenements');
        if (!res.ok) throw new Error('Erreur de chargement.');
        const data = await res.json();
        setEvenements(data.evenements ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
            ᛝ Événements
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Rituels, ateliers et cercles — création et suivi des inscriptions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Link
          href="/admin/evenements/rapports"
          style={{
            padding: '10px 20px',
            background: '#fff',
            color: '#6B3FA0',
            border: '1px solid #C4B5FD',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ᛉ Rapports
        </Link>
        <Link
          href="/admin/evenements/nouveau"
          style={{
            padding: '10px 20px',
            background: '#6B3FA0',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          + Nouvel événement
        </Link>
        </div>
      </div>

      {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '14px' }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#6B7280' }}>Chargement…</p>
      ) : evenements.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Aucun événement pour l&apos;instant.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Titre</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inscrits</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>État</th>
                <th style={{ padding: '12px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {evenements.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: 600, color: '#1F2937' }}>{ev.title}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>{formaterDateEvenement(ev.startsAt)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563' }}>
                    {ev._count?.registrations ?? 0} / {ev.capacity} inscrits
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <EtatBadge evenement={ev} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Link href={`/admin/evenements/${ev.id}`} style={{ color: '#6B3FA0', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                      Voir la fiche →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
