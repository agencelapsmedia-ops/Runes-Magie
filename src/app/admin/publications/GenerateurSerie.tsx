'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { RESEAU_LABELS } from '@/lib/social-constants';
import { FORMATS_VISUELS, GABARITS_VISUELS } from '@/lib/social-render/registry';
import { SERIES_CONTENU } from '@/lib/social-series';
import type { CompteSerialise } from '@/lib/social-accounts';

const VIOLET = '#6B3FA0';

function demain(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Modale « Générer une série » : marque + série + gabarit + quantité + cadence
 * → un lot de publications complètes générées en tâche de fond, qui atterrissent
 * en « À approuver » dans le calendrier.
 */
export default function GenerateurSerie({
  organizationId,
  comptes,
  onClose,
  onCreated,
}: {
  organizationId: string;
  comptes: CompteSerialise[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [serieKey, setSerieKey] = useState(SERIES_CONTENU[0].cle);
  const [templateKey, setTemplateKey] = useState(SERIES_CONTENU[0].templateDefaut);
  const [format, setFormat] = useState('PORTRAIT');
  const [quantite, setQuantite] = useState(10);
  const [dateDebut, setDateDebut] = useState(demain());
  const [heureLocale, setHeureLocale] = useState('18:00');
  const [cadenceJours, setCadenceJours] = useState(1);
  const [accountIds, setAccountIds] = useState<string[]>(comptes.map((c) => c.id));
  const [consignes, setConsignes] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const serie = SERIES_CONTENU.find((s) => s.cle === serieKey) ?? SERIES_CONTENU[0];

  async function creer() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/social/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          serieKey,
          templateKey,
          format,
          quantite,
          dateDebut,
          heureLocale,
          cadenceJours,
          accountIds,
          consignes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback(data.error ?? 'Échec de la création du lot.');
        return;
      }
      await onCreated();
      onClose();
    } catch {
      setFeedback('Erreur réseau — réessaie.');
    } finally {
      setBusy(false);
    }
  }

  const contenu = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Générer une série"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17, 12, 34, 0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto', fontFamily: 'sans-serif' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', width: '100%', maxWidth: '640px', padding: '24px', marginBottom: '40px' }}
      >
        <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.15rem', fontWeight: 700, color: '#2D1B4E', margin: '0 0 6px' }}>
          ⚡ Générer une série
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 16px' }}>
          L’IA prépare chaque publication (texte + visuel de marque) en tâche de fond. Tout arrive en
          « À approuver » dans le calendrier — rien ne part sans ton accord.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <label style={etiquette}>
            Série
            <select
              value={serieKey}
              onChange={(e) => {
                setSerieKey(e.target.value);
                const s = SERIES_CONTENU.find((x) => x.cle === e.target.value);
                if (s) setTemplateKey(s.templateDefaut);
              }}
              style={champ}
            >
              {SERIES_CONTENU.map((s) => (
                <option key={s.cle} value={s.cle}>{s.label}</option>
              ))}
            </select>
          </label>
          <label style={etiquette}>
            Gabarit visuel
            <select value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} style={champ}>
              {GABARITS_VISUELS.map((g) => (
                <option key={g.cle} value={g.cle}>{g.label}</option>
              ))}
            </select>
          </label>
        </div>

        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 12px' }}>{serie.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <label style={etiquette}>
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value)} style={champ}>
              {FORMATS_VISUELS.map((f) => (
                <option key={f.cle} value={f.cle}>{f.label}</option>
              ))}
            </select>
          </label>
          <label style={etiquette}>
            Quantité
            <input type="number" min={1} max={60} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} style={champ} />
          </label>
          <label style={etiquette}>
            À partir du
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} style={champ} />
          </label>
          <label style={etiquette}>
            Heure (Montréal)
            <input type="time" value={heureLocale} onChange={(e) => setHeureLocale(e.target.value)} style={champ} />
          </label>
          <label style={etiquette}>
            Cadence
            <select value={cadenceJours} onChange={(e) => setCadenceJours(Number(e.target.value))} style={champ}>
              <option value={1}>1 par jour</option>
              <option value={2}>Aux 2 jours</option>
              <option value={3}>Aux 3 jours</option>
              <option value={7}>1 par semaine</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <p style={{ ...etiquette, marginBottom: '6px' }}>Publier sur</p>
          {comptes.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>
              Aucun compte connecté pour cette marque — le lot sera généré, mais il faudra connecter
              les comptes avant d’approuver.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {comptes.map((c) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '7px 11px', cursor: 'pointer', background: accountIds.includes(c.id) ? '#F5F3FF' : '#FFFFFF' }}>
                  <input
                    type="checkbox"
                    checked={accountIds.includes(c.id)}
                    onChange={(e) =>
                      setAccountIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                    }
                  />
                  <strong>{RESEAU_LABELS[c.network] ?? c.network}</strong> — {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <label style={{ ...etiquette, display: 'block', marginBottom: '16px' }}>
          Consignes {serie.kinds.length === 0 ? '(requises pour cette série)' : '(optionnel)'}
          <textarea
            value={consignes}
            onChange={(e) => setConsignes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={serie.kinds.length === 0 ? 'Ex. : mets de l’avant la formation runique RFE, ton doux, une promo par publication…' : 'Ex. : angle « débutants bienvenus », mentionner la boutique de Saint-Eustache…'}
            style={{ ...champ, resize: 'vertical' }}
          />
        </label>

        {feedback && (
          <p style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
            {feedback}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} disabled={busy} style={boutonContour}>
            Annuler
          </button>
          <button
            type="button"
            onClick={creer}
            disabled={busy || quantite < 1 || (serie.kinds.length === 0 && !consignes.trim())}
            style={boutonPlein(busy || quantite < 1 || (serie.kinds.length === 0 && !consignes.trim()))}
          >
            {busy ? 'Création…' : `⚡ Lancer la génération (${quantite})`}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(contenu, document.body);
}

const etiquette: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: VIOLET,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const champ: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '6px',
  padding: '9px 11px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '0.88rem',
  color: '#111827',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  fontWeight: 400,
  textTransform: 'none',
  letterSpacing: 'normal',
};

const boutonContour: React.CSSProperties = {
  padding: '8px 14px',
  background: '#FFFFFF',
  color: '#4B5563',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
};

function boutonPlein(desactive: boolean): React.CSSProperties {
  return {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    background: desactive ? '#C4B5FD' : `linear-gradient(135deg, ${VIOLET}, #4A2D7A)`,
    color: '#FFFFFF',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: desactive ? 'not-allowed' : 'pointer',
  };
}
