'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import IconeCategorie, { CLES_ICONES } from '@/components/ui/IconeCategorie';

/**
 * Gestion des tuiles de l'accueil.
 *
 * Même geste que « Sliders de l'accueil » : glisser-déposer pour l'ordre, œil
 * pour masquer sans supprimer, édition en place. S'y ajoutent l'image, l'icône
 * et le cadrage, puisque ces tuiles sont d'abord visuelles.
 */

interface Pastille {
  label: string;
  href: string;
  iconKey: string;
}

interface Tuile {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  iconKey: string;
  imageUrl: string;
  imageAlt: string;
  imageFocus: string;
  href: string;
  variant: string;
  chips: Pastille[] | null;
  sortOrder: number;
  isVisible: boolean;
}

const CADRAGES: Array<{ valeur: string; label: string }> = [
  { valeur: 'center', label: 'Centre' },
  { valeur: 'left', label: 'Gauche' },
  { valeur: 'right', label: 'Droite' },
  { valeur: 'top', label: 'Haut' },
  { valeur: 'bottom', label: 'Bas' },
];

export default function TuilesAccueilPage() {
  const [tuiles, setTuiles] = useState<Tuile[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  const [nouvelleOuverte, setNouvelleOuverte] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState('');
  const [nouveauLien, setNouveauLien] = useState('');

  const [editionId, setEditionId] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Tuile | null>(null);

  const [dragId, setDragId] = useState<string | null>(null);

  async function charger() {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch('/api/admin/home-tiles');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = (await res.json()) as Tuile[];
      setTuiles(data.map((t) => ({ ...t, chips: Array.isArray(t.chips) ? t.chips : null })));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    charger();
  }, []);

  async function creer() {
    if (!nouveauTitre.trim() || !nouveauLien.trim()) {
      setErreur('Le titre et la destination sont requis.');
      return;
    }
    setEnCours('__new__');
    setErreur(null);
    try {
      const res = await fetch('/api/admin/home-tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nouveauTitre, href: nouveauLien }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création');
      }
      setNouveauTitre('');
      setNouveauLien('');
      setNouvelleOuverte(false);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setEnCours(null);
    }
  }

  function ouvrirEdition(t: Tuile) {
    setEditionId(t.id);
    setBrouillon({ ...t, chips: t.chips ? [...t.chips] : null });
  }

  async function enregistrer() {
    if (!brouillon) return;
    setEnCours(brouillon.id);
    setErreur(null);
    try {
      const res = await fetch(`/api/admin/home-tiles/${brouillon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: brouillon.title,
          subtitle: brouillon.subtitle,
          iconKey: brouillon.iconKey,
          imageUrl: brouillon.imageUrl,
          imageAlt: brouillon.imageAlt,
          imageFocus: brouillon.imageFocus,
          href: brouillon.href,
          variant: brouillon.variant,
          chips: brouillon.variant === 'BANDE' ? (brouillon.chips ?? []) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur sauvegarde');
      }
      setEditionId(null);
      setBrouillon(null);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setEnCours(null);
    }
  }

  async function basculerVisible(t: Tuile) {
    setEnCours(t.id);
    try {
      const res = await fetch(`/api/admin/home-tiles/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !t.isVisible }),
      });
      if (!res.ok) throw new Error('Erreur');
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setEnCours(null);
    }
  }

  async function supprimer(t: Tuile) {
    if (!confirm(`Supprimer la tuile « ${t.title} » ?`)) return;
    setEnCours(t.id);
    try {
      const res = await fetch(`/api/admin/home-tiles/${t.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setEnCours(null);
    }
  }

  function survolDrag(e: React.DragEvent, surId: string) {
    e.preventDefault();
    if (!dragId || dragId === surId) return;
    const liste = [...tuiles];
    const de = liste.findIndex((x) => x.id === dragId);
    const vers = liste.findIndex((x) => x.id === surId);
    if (de < 0 || vers < 0) return;
    const [deplacee] = liste.splice(de, 1);
    liste.splice(vers, 0, deplacee);
    setTuiles(liste);
  }

  async function finDrag() {
    if (!dragId) return;
    const orderedIds = tuiles.map((x) => x.id);
    setDragId(null);
    try {
      const res = await fetch('/api/admin/home-tiles/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Erreur');
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
      await charger();
    }
  }

  /* ── Éditeur de pastilles (bande Boutique) ── */
  function EditeurPastilles() {
    if (!brouillon) return null;
    const pastilles = brouillon.chips ?? [];
    const maj = (suivantes: Pastille[]) => setBrouillon({ ...brouillon, chips: suivantes });

    return (
      <div style={{ marginTop: '14px' }}>
        <label style={labelStyle}>Pastilles de la bande</label>
        <div style={{ display: 'grid', gap: '8px' }}>
          {pastilles.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                value={p.label}
                onChange={(e) => {
                  const s = [...pastilles];
                  s[i] = { ...s[i], label: e.target.value };
                  maj(s);
                }}
                placeholder="Libellé"
                style={{ ...inputStyle, flex: 2 }}
              />
              <select
                value={p.iconKey}
                onChange={(e) => {
                  const s = [...pastilles];
                  s[i] = { ...s[i], iconKey: e.target.value };
                  maj(s);
                }}
                style={{ ...inputStyle, flex: 1 }}
              >
                {CLES_ICONES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                value={p.href}
                onChange={(e) => {
                  const s = [...pastilles];
                  s[i] = { ...s[i], href: e.target.value };
                  maj(s);
                }}
                placeholder="/boutique"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => maj(pastilles.filter((_, j) => j !== i))}
                style={btnStyle('#991B1B')}
                title="Retirer"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => maj([...pastilles, { label: '', href: '/boutique', iconKey: 'etoile' }])}
          disabled={pastilles.length >= 12}
          style={{ ...btnStyle('#2D1B4E'), marginTop: '8px' }}
        >
          + Ajouter une pastille
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/admin/site"
          style={{
            fontSize: '0.8rem',
            color: '#6B3FA0',
            textDecoration: 'none',
            fontFamily: 'var(--font-cinzel, serif)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          ← Gestion site web
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel, serif)',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#2D1B4E',
            margin: '8px 0 4px',
          }}
        >
          ᛥ Tuiles de l&apos;accueil
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          Les cartes de la page d&apos;accueil et la bande Boutique. Titre, image, icône et
          destination : tout se change ici, sans redéploiement.
        </p>
      </div>

      {erreur && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          ⚠ {erreur}
        </div>
      )}

      {/* Création */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setNouvelleOuverte(!nouvelleOuverte)}
          style={{ ...btnStyle(nouvelleOuverte ? '#9CA3AF' : '#2D1B4E'), padding: '10px 18px', fontSize: '0.9rem' }}
        >
          {nouvelleOuverte ? '✕ Annuler' : '+ Nouvelle tuile'}
        </button>
        {nouvelleOuverte && (
          <div
            style={{
              marginTop: '12px',
              background: '#FFF',
              border: '2px solid #C9A84C',
              borderRadius: '12px',
              padding: '18px',
              maxWidth: '560px',
            }}
          >
            <label style={labelStyle}>Titre</label>
            <input
              value={nouveauTitre}
              onChange={(e) => setNouveauTitre(e.target.value)}
              placeholder="Ex : Soins & Rituels"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <label style={labelStyle}>Destination</label>
            <input
              value={nouveauLien}
              onChange={(e) => setNouveauLien(e.target.value)}
              placeholder="/seances"
              style={inputStyle}
            />
            <button
              onClick={creer}
              disabled={enCours === '__new__'}
              style={{ ...btnStyle('#2D1B4E'), padding: '9px 18px', marginTop: '14px' }}
            >
              {enCours === '__new__' ? 'Création…' : 'Créer la tuile'}
            </button>
          </div>
        )}
      </div>

      {/* Liste */}
      {chargement ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>Chargement…</div>
      ) : tuiles.length === 0 ? (
        <div
          style={{
            background: '#FFF',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            color: '#9CA3AF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          Aucune tuile. Lance <code>npm run db:seed:tuiles</code> pour créer les neuf tuiles de
          départ, ou crée-les une à une ci-dessus.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {tuiles.map((t) => {
            const enEdition = editionId === t.id;
            const occupe = enCours === t.id;
            return (
              <div
                key={t.id}
                draggable={!enEdition}
                onDragStart={() => setDragId(t.id)}
                onDragOver={(e) => survolDrag(e, t.id)}
                onDragEnd={finDrag}
                style={{
                  background: '#FFF',
                  border: dragId === t.id ? '1px solid #C9A84C' : '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  padding: '16px 18px',
                  opacity: occupe ? 0.5 : t.isVisible ? 1 : 0.6,
                }}
              >
                {enEdition && brouillon ? (
                  <div>
                    <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
                      <div>
                        <label style={labelStyle}>Titre</label>
                        <input
                          value={brouillon.title}
                          onChange={(e) => setBrouillon({ ...brouillon, title: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Sous-titre (facultatif)</label>
                        <input
                          value={brouillon.subtitle}
                          onChange={(e) => setBrouillon({ ...brouillon, subtitle: e.target.value })}
                          placeholder="de la voie des arcanes"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Destination</label>
                        <input
                          value={brouillon.href}
                          onChange={(e) => setBrouillon({ ...brouillon, href: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Icône</label>
                        <select
                          value={brouillon.iconKey}
                          onChange={(e) => setBrouillon({ ...brouillon, iconKey: e.target.value })}
                          style={inputStyle}
                        >
                          {CLES_ICONES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Cadrage de l&apos;image</label>
                        <select
                          value={brouillon.imageFocus}
                          onChange={(e) => setBrouillon({ ...brouillon, imageFocus: e.target.value })}
                          style={inputStyle}
                        >
                          {CADRAGES.map((c) => (
                            <option key={c.valeur} value={c.valeur}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Variante</label>
                        <select
                          value={brouillon.variant}
                          onChange={(e) => setBrouillon({ ...brouillon, variant: e.target.value })}
                          style={inputStyle}
                        >
                          <option value="CARTE">Carte de la grille</option>
                          <option value="BANDE">Bande pleine largeur</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <label style={labelStyle}>Description de l&apos;image (accessibilité)</label>
                      <input
                        value={brouillon.imageAlt}
                        onChange={(e) => setBrouillon({ ...brouillon, imageAlt: e.target.value })}
                        placeholder="Ce que montre l'image, en une phrase"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <ImageUploader
                        value={brouillon.imageUrl}
                        onChange={(v) =>
                          setBrouillon({ ...brouillon, imageUrl: typeof v === 'string' ? v : '' })
                        }
                        folder="tuiles"
                        label="Image de la tuile"
                      />
                    </div>

                    {brouillon.variant === 'BANDE' && <EditeurPastilles />}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      <button onClick={enregistrer} disabled={occupe} style={btnStyle('#065F46')}>
                        ✓ Sauver
                      </button>
                      <button
                        onClick={() => {
                          setEditionId(null);
                          setBrouillon(null);
                        }}
                        disabled={occupe}
                        style={btnStyle('#9CA3AF')}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{ color: '#C4B5FD', fontSize: '1.1rem', cursor: 'grab', userSelect: 'none' }}
                      title="Glisser pour réordonner"
                    >
                      ⋮⋮
                    </span>

                    <span
                      style={{
                        width: '54px',
                        height: '36px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: '#1A1A2E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {t.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.imageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#C9A84C', fontSize: '0.7rem' }}>—</span>
                      )}
                    </span>

                    <span style={{ color: '#C9A84C', display: 'flex', flexShrink: 0 }}>
                      <IconeCategorie nom={t.iconKey} taille={20} />
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          color: '#1F2937',
                          fontSize: '1rem',
                          margin: 0,
                          fontFamily: 'var(--font-cinzel, serif)',
                        }}
                      >
                        {t.title}
                        {t.subtitle && (
                          <span style={{ color: '#9CA3AF', fontWeight: 400 }}> — {t.subtitle}</span>
                        )}
                      </p>
                      <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '4px 0 0' }}>
                        {t.href}
                        {t.variant === 'BANDE' && ' · bande pleine largeur'}
                        {!t.imageUrl && ' · ⚠ image manquante'}
                      </p>
                    </div>

                    {!t.isVisible && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          background: '#F3F4F6',
                          color: '#6B7280',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        Masquée
                      </span>
                    )}

                    <button
                      onClick={() => basculerVisible(t)}
                      disabled={occupe}
                      title={t.isVisible ? 'Visible — cliquer pour masquer' : 'Masquée — cliquer pour afficher'}
                      style={iconBtn(t.isVisible ? '#059669' : '#9CA3AF', t.isVisible ? '#6EE7B7' : '#D1D5DB')}
                    >
                      {t.isVisible ? '👁' : '🚫'}
                    </button>
                    <button onClick={() => ouvrirEdition(t)} disabled={occupe} style={btnStyle('#2D1B4E')} title="Modifier">
                      ✎
                    </button>
                    <button onClick={() => supprimer(t)} disabled={occupe} style={btnStyle('#991B1B')} title="Supprimer">
                      🗑
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '16px' }}>
        💡 Glisse-dépose les tuiles (poignée ⋮⋮) pour changer leur ordre sur l&apos;accueil.
        L&apos;œil masque une tuile sans la supprimer. Le cadrage sert quand le sujet de la photo
        n&apos;est pas au centre : sans lui, un recadrage centré peut couper une personne.
      </p>
    </div>
  );
}

/* ─── Styles ─── */
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
function iconBtn(color: string, borderColor: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    background: '#FFF',
    color,
    padding: 0,
    cursor: 'pointer',
  };
}
