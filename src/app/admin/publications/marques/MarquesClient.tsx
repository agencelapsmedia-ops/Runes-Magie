'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CharteGraphique, OrganisationSerialisee } from '@/lib/organizations';

const VIOLET = '#6B3FA0';

const COULEURS: { cle: keyof CharteGraphique['palette']; label: string }[] = [
  { cle: 'fond', label: 'Fond des visuels' },
  { cle: 'fondCarte', label: 'Fond des cartes' },
  { cle: 'primaire', label: 'Couleur primaire' },
  { cle: 'primaireFonce', label: 'Primaire foncée' },
  { cle: 'accent', label: 'Accent (titres)' },
  { cle: 'accentClair', label: 'Accent clair' },
  { cle: 'secondaire', label: 'Secondaire' },
  { cle: 'texte', label: 'Texte' },
];

const POLICES: { cle: keyof CharteGraphique['polices']; label: string }[] = [
  { cle: 'titre', label: 'Police des titres' },
  { cle: 'corps', label: 'Police du corps' },
  { cle: 'accent', label: 'Police d’accent' },
];

/** Gestion des marques : liste, création, édition de la charte graphique. */
export default function MarquesClient({
  organisationsInitiales,
}: {
  organisationsInitiales: OrganisationSerialisee[];
}) {
  const [organisations, setOrganisations] = useState(organisationsInitiales);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [brouillons, setBrouillons] = useState<Record<string, OrganisationSerialisee>>({});
  const [nouvelleId, setNouvelleId] = useState('');
  const [nouveauNom, setNouveauNom] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function recharger() {
    const res = await fetch('/api/admin/social/organizations');
    if (res.ok) setOrganisations(await res.json());
  }

  function brouillonDe(o: OrganisationSerialisee): OrganisationSerialisee {
    return brouillons[o.id] ?? o;
  }

  function modifier(id: string, patch: (b: OrganisationSerialisee) => OrganisationSerialisee) {
    setBrouillons((prev) => {
      const base = prev[id] ?? organisations.find((o) => o.id === id);
      if (!base) return prev;
      return { ...prev, [id]: patch(JSON.parse(JSON.stringify(base))) };
    });
  }

  async function creer() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/social/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nouvelleId, name: nouveauNom }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? 'Échec de la création.' });
        return;
      }
      setFeedback({ ok: true, text: `Marque « ${data.name} » créée ✓ — personnalise sa charte ci-dessous, puis connecte ses comptes.` });
      setNouvelleId('');
      setNouveauNom('');
      await recharger();
      setOuverte(data.id);
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — réessaie.' });
    } finally {
      setBusy(false);
    }
  }

  async function sauver(id: string) {
    const b = brouillons[id];
    if (!b) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/social/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: b.name, charte: b.charte, isActive: b.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? "Échec de l'enregistrement." });
        return;
      }
      setFeedback({ ok: true, text: `Marque « ${data.name} » enregistrée ✓` });
      setBrouillons((prev) => {
        const { [id]: _, ...reste } = prev;
        return reste;
      });
      await recharger();
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — réessaie.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/admin/publications" style={{ fontSize: '0.8rem', color: '#6B7280', textDecoration: 'none', fontFamily: 'var(--font-cinzel, serif)' }}>
          ← Retour aux publications
        </Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.6rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '4px' }}>
          Marques
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Chaque marque a sa charte graphique (couleurs, polices, voix) : elle colore les visuels générés
          et guide l’IA. Les comptes sociaux se rattachent à une marque dans « ⚙ Comptes connectés ».
        </p>
      </div>

      {feedback && (
        <p style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', background: feedback.ok ? '#D1FAE5' : '#FEE2E2', color: feedback.ok ? '#065F46' : '#991B1B', border: `1px solid ${feedback.ok ? '#6EE7B7' : '#FCA5A5'}` }}>
          {feedback.text}
        </p>
      )}

      {/* Nouvelle marque */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <label style={etiquette}>
          Identifiant (minuscules et tirets)
          <input value={nouvelleId} onChange={(e) => setNouvelleId(e.target.value.toLowerCase())} placeholder="ma-marque" maxLength={40} style={champ} />
        </label>
        <label style={etiquette}>
          Nom affiché
          <input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Ma Marque" maxLength={80} style={champ} />
        </label>
        <button
          type="button"
          onClick={creer}
          disabled={busy || !nouvelleId.trim() || !nouveauNom.trim()}
          style={boutonPlein(busy || !nouvelleId.trim() || !nouveauNom.trim())}
        >
          + Ajouter la marque
        </button>
      </div>

      {/* Marques existantes */}
      {organisations.map((o) => {
        const b = brouillonDe(o);
        const modifiee = Boolean(brouillons[o.id]);
        const estOuverte = ouverte === o.id;
        return (
          <div key={o.id} style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '14px', overflow: 'hidden', opacity: o.isActive ? 1 : 0.6 }}>
            <button
              type="button"
              onClick={() => setOuverte(estOuverte ? null : o.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ display: 'inline-flex', gap: '3px' }}>
                {[b.charte.palette.primaire, b.charte.palette.accent, b.charte.palette.secondaire, b.charte.palette.fond].map((c, i) => (
                  <span key={i} style={{ width: '16px', height: '16px', borderRadius: '4px', background: c, border: '1px solid #E5E7EB', display: 'inline-block' }} />
                ))}
              </span>
              <span style={{ fontFamily: 'var(--font-cinzel, serif)', fontWeight: 700, color: '#2D1B4E', fontSize: '1rem' }}>{b.name}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#9CA3AF' }}>{o.id}</span>
              {!o.isActive && <span style={{ fontSize: '0.72rem', color: '#92400E', background: '#FEF3C7', borderRadius: '9999px', padding: '2px 10px' }}>désactivée</span>}
              {modifiee && <span style={{ fontSize: '0.72rem', color: '#1D4ED8', background: '#DBEAFE', borderRadius: '9999px', padding: '2px 10px' }}>modifications non enregistrées</span>}
              <span style={{ marginLeft: 'auto', color: VIOLET, fontSize: '0.8rem' }}>{estOuverte ? '▲ Replier' : '▼ Modifier'}</span>
            </button>

            {estOuverte && (
              <div style={{ padding: '0 20px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <label style={etiquette}>
                    Nom affiché
                    <input value={b.name} onChange={(e) => modifier(o.id, (x) => ({ ...x, name: e.target.value }))} maxLength={80} style={champ} />
                  </label>
                  <label style={etiquette}>
                    Logo (URL publique, optionnel)
                    <input value={b.charte.logoUrl} onChange={(e) => modifier(o.id, (x) => ({ ...x, charte: { ...x.charte, logoUrl: e.target.value } }))} placeholder="https://…" style={champ} />
                  </label>
                </div>

                <p style={{ ...etiquette, marginBottom: '8px' }}>Palette des visuels</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {COULEURS.map(({ cle, label }) => (
                    <label key={cle} style={{ fontSize: '0.72rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {label}
                      <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={b.charte.palette[cle]}
                          onChange={(e) => modifier(o.id, (x) => ({ ...x, charte: { ...x.charte, palette: { ...x.charte.palette, [cle]: e.target.value } } }))}
                          style={{ width: '36px', height: '30px', padding: 0, border: '1px solid #D1D5DB', borderRadius: '6px', background: 'none', cursor: 'pointer' }}
                        />
                        <code style={{ fontSize: '0.72rem', color: '#6B7280' }}>{b.charte.palette[cle]}</code>
                      </span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  {POLICES.map(({ cle, label }) => (
                    <label key={cle} style={etiquette}>
                      {label}
                      <input value={b.charte.polices[cle]} onChange={(e) => modifier(o.id, (x) => ({ ...x, charte: { ...x.charte, polices: { ...x.charte.polices, [cle]: e.target.value } } }))} placeholder="Ex. : Cinzel" style={champ} />
                    </label>
                  ))}
                </div>

                <label style={{ ...etiquette, display: 'block', marginBottom: '14px' }}>
                  Voix de marque (guide l’IA rédactionnelle)
                  <textarea
                    value={b.charte.voix}
                    onChange={(e) => modifier(o.id, (x) => ({ ...x, charte: { ...x.charte, voix: e.target.value } }))}
                    rows={4}
                    maxLength={2000}
                    placeholder="Qui est la marque, à qui elle parle, sur quel ton, ce qui est interdit…"
                    style={{ ...champ, resize: 'vertical' }}
                  />
                </label>

                <label style={{ ...etiquette, display: 'block', marginBottom: '16px' }}>
                  Hashtags de la marque (séparés par des espaces)
                  <input
                    value={b.charte.hashtagsMarque.join(' ')}
                    onChange={(e) => modifier(o.id, (x) => ({ ...x, charte: { ...x.charte, hashtagsMarque: e.target.value.split(/\s+/).filter(Boolean) } }))}
                    maxLength={500}
                    placeholder="#mamarque #quebec"
                    style={champ}
                  />
                </label>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={() => sauver(o.id)} disabled={busy || !modifiee} style={boutonPlein(busy || !modifiee)}>
                    {busy ? 'En cours…' : 'Enregistrer la marque'}
                  </button>
                  {o.id !== 'runes-et-magie' && (
                    <button
                      type="button"
                      onClick={() => {
                        modifier(o.id, (x) => ({ ...x, isActive: !x.isActive }));
                      }}
                      style={boutonContour('#92400E', '#FCD34D')}
                    >
                      {b.isActive ? 'Marquer comme désactivée' : 'Réactiver'}
                    </button>
                  )}
                  {modifiee && (
                    <button
                      type="button"
                      onClick={() =>
                        setBrouillons((prev) => {
                          const { [o.id]: _, ...reste } = prev;
                          return reste;
                        })
                      }
                      style={boutonContour('#4B5563', '#D1D5DB')}
                    >
                      Annuler les modifications
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const etiquette: React.CSSProperties = {
  fontSize: '0.75rem',
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

function boutonContour(couleur: string, bordure: string): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: '#FFFFFF',
    color: couleur,
    border: `1px solid ${bordure}`,
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  };
}
