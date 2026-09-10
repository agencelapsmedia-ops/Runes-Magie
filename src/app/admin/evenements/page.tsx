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
  const [suppression, setSuppression] = useState<string | null>(null);

  /**
   * Suppression définitive. Le serveur refuse (409) tant qu'une personne est
   * inscrite — on affiche alors son message, qui invite à annuler plutôt.
   */
  async function supprimer(ev: Evenement) {
    if (!window.confirm(`Supprimer définitivement « ${ev.title} » ?\n\nCette action est irréversible.`)) return;
    setSuppression(ev.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/evenements/${ev.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Échec de la suppression.');
      setEvenements((liste) => liste.filter((e) => e.id !== ev.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setSuppression(null);
    }
  }

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
        <>
        {/* Téléphone (< lg) : une carte par événement — le tableau à 5 colonnes
            débordait de l'écran et forçait un défilement horizontal. */}
        <div className="lg:hidden" style={{ display: 'grid', gap: '12px' }}>
          {evenements.map((ev) => (
            <div key={ev.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                <Link href={`/admin/evenements/${ev.id}`} style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1F2937', textDecoration: 'none', lineHeight: 1.3 }}>
                  {ev.title}
                </Link>
                <EtatBadge evenement={ev} />
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#4B5563' }}>{formaterDateEvenement(ev.startsAt)}</p>
              <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#4B5563' }}>
                {ev._count?.registrations ?? 0} / {ev.capacity} inscrits
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <Link href={`/admin/evenements/${ev.id}`} style={{ color: '#6B3FA0', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  Voir la fiche →
                </Link>
                <button
                  type="button"
                  onClick={() => void supprimer(ev)}
                  disabled={suppression === ev.id}
                  style={{
                    padding: '6px 12px',
                    background: '#fff',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: suppression === ev.id ? 'wait' : 'pointer',
                    opacity: suppression === ev.id ? 0.6 : 1,
                  }}
                >
                  {suppression === ev.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Ordinateur (≥ lg) : tableau. */}
        <div className="hidden lg:block" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', overflowX: 'auto' }}>
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
                  <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/evenements/${ev.id}`} style={{ color: '#6B3FA0', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                      Voir la fiche →
                    </Link>
                    <button
                      type="button"
                      onClick={() => void supprimer(ev)}
                      disabled={suppression === ev.id}
                      style={{
                        marginLeft: '14px',
                        padding: '5px 10px',
                        background: '#fff',
                        color: '#991B1B',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: suppression === ev.id ? 'wait' : 'pointer',
                        opacity: suppression === ev.id ? 0.6 : 1,
                      }}
                    >
                      {suppression === ev.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
