'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import FormulaireEvenement, { type Evenement, formaterDateEvenement } from '../FormulaireEvenement';
import ActionsInscrits from './ActionsInscrits';

interface Inscrit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  note: string | null;
  createdAt: string;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
const tdStyle: React.CSSProperties = { padding: '14px 16px', fontSize: '0.85rem', color: '#4B5563', verticalAlign: 'top' };

export default function FicheEvenementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [inscrits, setInscrits] = useState<Inscrit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorInscrits, setErrorInscrits] = useState<string | null>(null);
  const [errorDesinscription, setErrorDesinscription] = useState<string | null>(null);
  const [aDesinscrire, setADesinscrire] = useState<Inscrit | null>(null);
  const [desinscrivant, setDesinscrivant] = useState(false);

  const charger = useCallback(async () => {
    try {
      const [rEv, rIns] = await Promise.all([
        fetch(`/api/admin/evenements/${id}`),
        fetch(`/api/admin/evenements/${id}/inscrits`),
      ]);
      const dataEv = await rEv.json().catch(() => ({}));
      if (!rEv.ok) throw new Error(dataEv.error || 'Événement introuvable.');
      setEvenement(dataEv.evenement);

      // Un échec de chargement des inscrits est traité à part de l'événement
      // lui-même : il ne doit jamais ressembler à « aucun inscrit », sinon
      // l'administratrice pourrait annuler l'événement en croyant qu'il
      // n'intéresse personne.
      const dataIns = await rIns.json().catch(() => ({}));
      if (!rIns.ok) {
        setErrorInscrits(dataIns.error || 'Échec du chargement des inscrits.');
        setInscrits([]);
      } else {
        setErrorInscrits(null);
        setInscrits(dataIns.inscrits ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function confirmerDesinscription() {
    if (!aDesinscrire) return;
    setDesinscrivant(true);
    setErrorDesinscription(null);
    try {
      // `fetch` ne rejette pas sur un 4xx (ex. 409 « déjà annulée », 404) :
      // il faut vérifier `res.ok` explicitement, sinon la modale se ferme
      // comme si tout allait bien.
      const res = await fetch(`/api/admin/evenements/${id}/inscrits/${aDesinscrire.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Échec de la désinscription.');
      setADesinscrire(null);
      await charger();
    } catch (e) {
      setErrorDesinscription(e instanceof Error ? e.message : 'Erreur inattendue.');
    } finally {
      setDesinscrivant(false);
    }
  }

  if (loading) {
    return <p style={{ color: '#6B7280', fontFamily: 'sans-serif' }}>Chargement…</p>;
  }

  if (!evenement) {
    return (
      <div style={{ fontFamily: 'sans-serif' }}>
        <Link href="/admin/evenements" style={{ display: 'inline-block', marginBottom: '12px', fontSize: '0.85rem', color: '#6B3FA0', textDecoration: 'none' }}>
          ← Retour à la liste
        </Link>
        <p style={{ color: '#DC2626' }}>{error || 'Événement introuvable.'}</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/admin/evenements" style={{ display: 'inline-block', marginBottom: '12px', fontSize: '0.85rem', color: '#6B3FA0', textDecoration: 'none' }}>
          ← Retour à la liste
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛝ {evenement.title}
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          {formaterDateEvenement(evenement.startsAt)}
          {evenement.cancelledAt && <span style={{ color: '#991B1B', fontWeight: 600 }}> — Annulé</span>}
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <FormulaireEvenement evenement={evenement} onSaved={(ev) => setEvenement(ev)} />
      </div>

      <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.2rem', color: '#2D1B4E', marginBottom: '14px' }}>
        Inscrits ({inscrits.length} / {evenement.capacity})
      </h2>

      <ActionsInscrits evenementId={id} dejaAnnule={!!evenement.cancelledAt} onAnnule={() => void charger()} />

      {errorInscrits ? (
        <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '30px', textAlign: 'center', border: '1px solid #FCA5A5' }}>
          <p style={{ color: '#991B1B', fontSize: '0.9rem', fontWeight: 600 }}>{errorInscrits}</p>
        </div>
      ) : inscrits.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Aucune personne inscrite pour l&apos;instant.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Courriel</th>
                <th style={thStyle}>Téléphone</th>
                <th style={thStyle}>Inscrit le</th>
                <th style={thStyle}>Message</th>
                <th style={{ padding: '12px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {inscrits.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1F2937' }}>{i.firstName} {i.lastName}</td>
                  <td style={tdStyle}>{i.email}</td>
                  <td style={tdStyle}>{i.phone || '—'}</td>
                  <td style={tdStyle}>{formaterDateEvenement(i.createdAt)}</td>
                  <td style={{ ...tdStyle, maxWidth: '260px', whiteSpace: 'pre-line' }}>{i.note || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => { setErrorDesinscription(null); setADesinscrire(i); }}
                      style={{ padding: '6px 12px', background: '#fff', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Désinscrire
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aDesinscrire && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' }}
          onClick={() => {
            if (desinscrivant) return;
            setADesinscrire(null);
            setErrorDesinscription(null);
          }}
        >
          <div style={{ background: '#fff', borderRadius: '12px', padding: '26px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.2rem', color: '#2D1B4E', margin: '0 0 14px' }}>Désinscrire cette personne ?</h2>
            <p style={{ fontSize: '0.9rem', color: '#4B5563', marginBottom: '20px' }}>
              {aDesinscrire.firstName} {aDesinscrire.lastName} sera prévenu(e) par courriel de son désistement.
            </p>
            {errorDesinscription && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '14px' }}>{errorDesinscription}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => { setADesinscrire(null); setErrorDesinscription(null); }} disabled={desinscrivant} style={{ padding: '9px 16px', background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerDesinscription}
                disabled={desinscrivant}
                style={{ padding: '9px 18px', background: '#991B1B', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: desinscrivant ? 0.6 : 1 }}
              >
                {desinscrivant ? 'Désinscription…' : 'Désinscrire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
