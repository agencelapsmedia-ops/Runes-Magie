'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { uploadFile } from '@/lib/supabase';
import {
  MAX_IMAGES,
  RESEAU_LABELS,
  STATUTS_JOB,
  STATUTS_POST,
  TYPES_CONTENU,
  type SocialImage,
  type SocialVariant,
} from '@/lib/social-constants';
import type { PostSerialise } from '@/lib/social-posts';
import type { CompteSerialise } from '@/lib/social-accounts';

const VIOLET = '#6B3FA0';

/** Convertit un ISO UTC vers la valeur d'un input datetime-local (fuseau du navigateur). */
function versInputLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Fiche d'une publication : création, édition, images, cibles, programmation.
 * (Boutons IA et « Publier maintenant » branchés aux étapes suivantes.)
 */
export default function FichePublication({
  post,
  comptes,
  dateInitiale,
  onClose,
  onChanged,
}: {
  post: PostSerialise | null; // null = création
  comptes: CompteSerialise[]; // comptes actifs
  dateInitiale?: string | null; // pré-remplissage depuis un clic sur le calendrier
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [courant, setCourant] = useState<PostSerialise | null>(post);
  const [title, setTitle] = useState(post?.title ?? '');
  const [type, setType] = useState(post?.type ?? 'PUBLICATION');
  const [baseText, setBaseText] = useState(post?.baseText ?? '');
  const [callToAction, setCallToAction] = useState(post?.callToAction ?? '');
  const [link, setLink] = useState(post?.link ?? '');
  const [hashtags, setHashtags] = useState(post?.hashtags ?? '');
  const [images, setImages] = useState<SocialImage[]>(post?.images ?? []);
  const [variants, setVariants] = useState<Record<string, SocialVariant>>(post?.variants ?? {});
  const [cibles, setCibles] = useState<string[]>(post?.targets.map((t) => t.accountId) ?? comptes.map((c) => c.id));
  const [dateProg, setDateProg] = useState(versInputLocal(post?.scheduledAt ?? null) || (dateInitiale ?? ''));
  const [ongletVariante, setOngletVariante] = useState<'FACEBOOK' | 'INSTAGRAM'>('FACEBOOK');

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const verrouille = courant?.status === 'PUBLIEE';
  const statut = STATUTS_POST[courant?.status ?? 'BROUILLON'] ?? STATUTS_POST.BROUILLON;

  function corps() {
    return {
      title,
      type,
      baseText,
      callToAction,
      link: link.trim() || null,
      hashtags,
      images,
      variants,
      targetAccountIds: cibles,
      scheduledAt: dateProg ? new Date(dateProg).toISOString() : null,
    };
  }

  /** Enregistre (POST création / PATCH édition) et retourne le post à jour. */
  async function enregistrer(silencieux = false): Promise<PostSerialise | null> {
    if (!title.trim()) {
      setFeedback({ ok: false, text: 'Le titre interne est requis.' });
      return null;
    }
    setBusy(true);
    if (!silencieux) setFeedback(null);
    try {
      const res = await fetch(courant ? `/api/admin/social/posts/${courant.id}` : '/api/admin/social/posts', {
        method: courant ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corps()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? "Échec de l'enregistrement." });
        return null;
      }
      setCourant(data);
      if (!silencieux) setFeedback({ ok: true, text: 'Publication enregistrée ✓' });
      await onChanged();
      return data as PostSerialise;
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — réessaie.' });
      return null;
    } finally {
      setBusy(false);
    }
  }

  /** Action serveur simple sur le post courant (programmer, approbation, dépublier…). */
  async function action(chemin: string, body?: object) {
    const sauve = await enregistrer(true);
    if (!sauve) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/social/posts/${sauve.id}/${chemin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: data.error ?? "Échec de l'action." });
        return;
      }
      setCourant(data);
      setFeedback({ ok: true, text: 'Fait ✓' });
      await onChanged();
    } catch {
      setFeedback({ ok: false, text: 'Erreur réseau — réessaie.' });
    } finally {
      setBusy(false);
    }
  }

  async function supprimer() {
    if (!courant) return onClose();
    if (!window.confirm(`Supprimer « ${courant.title} » ?`)) return;
    const res = await fetch(`/api/admin/social/posts/${courant.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFeedback({ ok: false, text: data.error ?? 'Suppression refusée.' });
      return;
    }
    await onChanged();
    onClose();
  }

  async function ajouterImages(fichiers: FileList | null) {
    if (!fichiers || fichiers.length === 0) return;
    if (images.length + fichiers.length > MAX_IMAGES) {
      setFeedback({ ok: false, text: `Maximum ${MAX_IMAGES} images par publication.` });
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      const nouvelles: SocialImage[] = [];
      for (const f of Array.from(fichiers)) {
        const url = await uploadFile(f, 'social');
        nouvelles.push({ url, alt: '' });
      }
      setImages((prev) => [...prev, ...nouvelles]);
    } catch (e) {
      setFeedback({ ok: false, text: e instanceof Error ? e.message : "Échec de l'envoi d'une image." });
    } finally {
      setUploading(false);
    }
  }

  function deplacerImage(i: number, direction: -1 | 1) {
    setImages((prev) => {
      const arr = [...prev];
      const j = i + direction;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  const varianteCourante = variants[ongletVariante] ?? { texte: '', hashtags: [] };

  const contenu = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={courant ? `Publication : ${courant.title}` : 'Nouvelle publication'}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17, 12, 34, 0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto', fontFamily: 'sans-serif' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', width: '100%', maxWidth: '760px', padding: '24px', marginBottom: '40px' }}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.15rem', fontWeight: 700, color: '#2D1B4E', margin: 0 }}>
            {courant ? 'Publication' : 'Nouvelle publication'}
          </h3>
          <span style={{ padding: '3px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: statut.bg, color: statut.fg, border: `1px solid ${statut.border}` }}>
            {statut.label}
          </span>
        </div>

        {verrouille && (
          <p style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '8px', padding: '10px 12px', fontSize: '0.85rem', marginBottom: '14px' }}>
            Cette publication a été publiée — elle est en lecture seule (historique en bas de fiche).
          </p>
        )}

        {/* Infos */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <label style={etiquette}>
            Titre interne (jamais publié)
            <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={verrouille} maxLength={150} placeholder="Ex. : Promo soin rituel — juillet" style={champ} />
          </label>
          <label style={etiquette}>
            Type de contenu
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={verrouille} style={champ}>
              {TYPES_CONTENU.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Contenu de base */}
        <label style={etiquette}>
          Texte / idée de base
          <textarea value={baseText} onChange={(e) => setBaseText(e.target.value)} disabled={verrouille} rows={5} maxLength={5000} placeholder="Ton idée, ton message… l’IA pourra ensuite le décliner pour chaque réseau." style={{ ...champ, resize: 'vertical' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '12px 0' }}>
          <label style={etiquette}>
            Appel à l’action
            <input value={callToAction} onChange={(e) => setCallToAction(e.target.value)} disabled={verrouille} maxLength={300} placeholder="Ex. : Réserve ta place dès maintenant" style={champ} />
          </label>
          <label style={etiquette}>
            Lien vers le site
            <input value={link} onChange={(e) => setLink(e.target.value)} disabled={verrouille} maxLength={500} placeholder="https://www.runesetmagie.ca/…" style={champ} />
          </label>
        </div>
        <label style={etiquette}>
          Hashtags de base (séparés par des espaces)
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} disabled={verrouille} maxLength={1000} placeholder="#runes #magie #soinenergetique" style={champ} />
        </label>

        {/* Images */}
        <div style={{ margin: '16px 0' }}>
          <p style={{ ...etiquette, marginBottom: '8px' }}>Images ({images.length}/{MAX_IMAGES}) — la première est l’image principale</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {images.map((img, i) => (
              <div key={img.url + i} style={{ width: '150px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#F9FAFB' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || `Image ${i + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                <input
                  value={img.alt}
                  onChange={(e) => setImages((prev) => prev.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                  disabled={verrouille}
                  placeholder="Texte alternatif"
                  style={{ width: '100%', border: 'none', borderTop: '1px solid #E5E7EB', padding: '6px 8px', fontSize: '0.72rem', boxSizing: 'border-box' }}
                />
                {!verrouille && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px' }}>
                    <button type="button" onClick={() => deplacerImage(i, -1)} disabled={i === 0} style={miniBouton}>◀</button>
                    <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} style={{ ...miniBouton, color: '#991B1B' }}>✕</button>
                    <button type="button" onClick={() => deplacerImage(i, 1)} disabled={i === images.length - 1} style={miniBouton}>▶</button>
                  </div>
                )}
              </div>
            ))}
            {!verrouille && images.length < MAX_IMAGES && (
              <label style={{ width: '150px', height: '148px', border: '2px dashed #C4B5FD', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: VIOLET, fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                {uploading ? 'Envoi…' : '+ Ajouter des images'}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => ajouterImages(e.target.files)} style={{ display: 'none' }} disabled={uploading} />
              </label>
            )}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '6px' }}>
            JPG ou PNG recommandés (Instagram n’accepte pas tous les formats). 2+ images = carrousel.
          </p>
        </div>

        {/* Réseaux ciblés */}
        <div style={{ margin: '16px 0' }}>
          <p style={{ ...etiquette, marginBottom: '8px' }}>Publier sur</p>
          {comptes.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '8px 12px' }}>
              Aucun compte actif — connecte tes comptes dans « ⚙ Comptes connectés ».
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {comptes.map((c) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.85rem', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 12px', cursor: verrouille ? 'default' : 'pointer', background: cibles.includes(c.id) ? '#F5F3FF' : '#FFFFFF' }}>
                  <input
                    type="checkbox"
                    checked={cibles.includes(c.id)}
                    disabled={verrouille}
                    onChange={(e) =>
                      setCibles((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                    }
                    style={{ width: '15px', height: '15px' }}
                  />
                  <strong>{RESEAU_LABELS[c.network] ?? c.network}</strong> — {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Déclinaisons par réseau */}
        <div style={{ margin: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ ...etiquette, margin: 0 }}>Déclinaisons par réseau (optionnel — sinon le texte de base est publié)</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {(['FACEBOOK', 'INSTAGRAM'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setOngletVariante(r)}
                style={{ padding: '7px 16px', borderRadius: '8px 8px 0 0', border: '1px solid #E5E7EB', borderBottom: 'none', background: ongletVariante === r ? '#F5F3FF' : '#FFFFFF', color: ongletVariante === r ? VIOLET : '#6B7280', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {RESEAU_LABELS[r]}
                {variants[r]?.texte?.trim() ? ' ●' : ''}
              </button>
            ))}
          </div>
          <textarea
            value={varianteCourante.texte}
            onChange={(e) =>
              setVariants((prev) => ({ ...prev, [ongletVariante]: { ...(prev[ongletVariante] ?? { hashtags: [] }), texte: e.target.value } }))
            }
            disabled={verrouille}
            rows={6}
            maxLength={5000}
            placeholder={`Version ${RESEAU_LABELS[ongletVariante]} du texte (l’IA pourra la générer pour toi).`}
            style={{ ...champ, resize: 'vertical' }}
          />
          <input
            value={(varianteCourante.hashtags ?? []).join(' ')}
            onChange={(e) =>
              setVariants((prev) => ({
                ...prev,
                [ongletVariante]: { ...(prev[ongletVariante] ?? { texte: '' }), hashtags: e.target.value.split(/\s+/).filter(Boolean) },
              }))
            }
            disabled={verrouille}
            maxLength={1000}
            placeholder={`Hashtags ${RESEAU_LABELS[ongletVariante]}`}
            style={{ ...champ, marginTop: '8px' }}
          />
        </div>

        {/* Programmation */}
        {!verrouille && (
          <div style={{ margin: '16px 0', padding: '14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px' }}>
            <p style={{ ...etiquette, marginBottom: '8px' }}>Programmation (heure de Montréal)</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <input type="datetime-local" value={dateProg} onChange={(e) => setDateProg(e.target.value)} style={{ ...champ, width: 'auto', marginTop: 0 }} />
              <button
                type="button"
                disabled={busy || !dateProg}
                onClick={() => action('programmer', { scheduledAt: new Date(dateProg).toISOString() })}
                style={boutonPlein(busy || !dateProg)}
              >
                📅 Programmer
              </button>
              {courant?.status === 'PROGRAMMEE' && (
                <button type="button" disabled={busy} onClick={() => action('depublier')} style={boutonContour('#92400E', '#FCD34D')}>
                  Annuler la programmation
                </button>
              )}
              {(courant?.status === 'BROUILLON' || !courant) && (
                <button type="button" disabled={busy} onClick={() => action('approbation')} style={boutonContour('#92400E', '#FCD34D')}>
                  Marquer « À approuver »
                </button>
              )}
              {courant?.status === 'A_APPROUVER' && (
                <button type="button" disabled={busy} onClick={() => action('approbation', { retour: true })} style={boutonContour('#374151', '#D1D5DB')}>
                  Revenir en brouillon
                </button>
              )}
            </div>
          </div>
        )}

        {/* Historique des jobs */}
        {courant && courant.jobs.length > 0 && (
          <div style={{ margin: '16px 0' }}>
            <p style={{ ...etiquette, marginBottom: '8px' }}>Historique de publication</p>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
              {courant.jobs.map((j) => {
                const sj = STATUTS_JOB[j.status] ?? STATUTS_JOB.EN_ATTENTE;
                const compte = comptes.find((c) => c.id === j.accountId);
                return (
                  <div key={j.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid #F3F4F6', fontSize: '0.8rem', color: '#374151' }}>
                    <strong>{RESEAU_LABELS[j.network] ?? j.network}</strong>
                    {compte && <span style={{ color: '#9CA3AF' }}>({compte.label})</span>}
                    <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: sj.bg, color: sj.fg }}>{sj.label}</span>
                    {j.attempts > 0 && <span style={{ color: '#9CA3AF' }}>{j.attempts} tentative{j.attempts > 1 ? 's' : ''}</span>}
                    {j.errorCategory && <span style={{ color: '#991B1B' }}>[{j.errorCategory === 'PERMANENTE' ? 'erreur permanente' : 'erreur temporaire'}]</span>}
                    {j.lastError && <span style={{ color: '#991B1B', flexBasis: '100%' }}>{j.lastError}</span>}
                    {j.publishedAt && (
                      <span style={{ color: '#065F46' }}>
                        publié le {new Date(j.publishedAt).toLocaleString('fr-CA', { timeZone: 'America/Toronto' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <p style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', background: feedback.ok ? '#D1FAE5' : '#FEE2E2', color: feedback.ok ? '#065F46' : '#991B1B', border: `1px solid ${feedback.ok ? '#6EE7B7' : '#FCA5A5'}` }}>
            {feedback.text}
          </p>
        )}

        {/* Pied */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            {courant && !verrouille && (
              <button type="button" onClick={supprimer} disabled={busy} style={boutonContour('#991B1B', '#FCA5A5')}>
                Supprimer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} disabled={busy} style={boutonContour('#4B5563', '#D1D5DB')}>
              Fermer
            </button>
            {!verrouille && (
              <button type="button" onClick={() => enregistrer()} disabled={busy || !title.trim()} style={boutonPlein(busy || !title.trim())}>
                {busy ? 'En cours…' : courant ? 'Enregistrer' : 'Créer la publication'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(contenu, document.body);
}

const etiquette: React.CSSProperties = {
  display: 'block',
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

const miniBouton: React.CSSProperties = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '0.75rem',
  color: '#6B7280',
  padding: '2px 4px',
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
