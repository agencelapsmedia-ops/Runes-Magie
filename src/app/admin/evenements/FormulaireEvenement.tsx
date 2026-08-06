'use client';

import { useState } from 'react';

export interface Evenement {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string;
  imageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string;
  isOnline: boolean;
  onlineUrl: string | null;
  capacity: number;
  bringItems: string | null;
  isPublished: boolean;
  cancelledAt: string | null;
  _count?: { registrations: number };
}

/**
 * « 2026-08-08T13:00 » saisi au Québec (valeur brute d'un champ datetime-local,
 * sans fuseau) → instant UTC correct, en ISO.
 *
 * L'Est est à UTC-4 en heure avancée (mars→novembre), UTC-5 sinon. Le calcul
 * passe par Intl (fuseau IANA America/Toronto), qui gère lui-même les deux
 * décalages — jamais de « -4 » codé en dur.
 *
 * Attention : on ne repasse JAMAIS la chaîne saisie dans `new Date(...)` sans
 * fuseau explicite — ça la ferait réinterpréter avec le fuseau du navigateur
 * de l'administratrice, pas celui de Toronto (bogue mesuré : correct sous
 * TZ=America/Toronto, faux d'une heure sous TZ=UTC).
 *
 * Méthode : on pose une estimation en UTC à partir des composants saisis, on
 * la formate avec Intl en `timeZone: 'America/Toronto'`, on compare les
 * composants obtenus à ceux saisis pour en déduire le décalage réel à cet
 * instant, puis on répète une fois (le décalage peut changer si l'estimation
 * initiale tombe de l'autre côté d'une bascule d'heure).
 */
export function versDateEst(valeur: string): string {
  const correspondance = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valeur);
  if (!correspondance) {
    throw new RangeError(`Date invalide : « ${valeur} »`);
  }
  const [, anS, moisS, jourS, heureS, minuteS] = correspondance;
  const an = Number(anS);
  const mois = Number(moisS);
  const jour = Number(jourS);
  const heure = Number(heureS);
  const minute = Number(minuteS);
  const cible = Date.UTC(an, mois - 1, jour, heure, minute);

  let instant = cible;
  for (let i = 0; i < 2; i++) {
    const parties = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(instant));
    const get = (type: string) => Number(parties.find((p) => p.type === type)?.value ?? 0);
    const obtenu = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
    instant -= obtenu - cible;
  }

  const resultat = new Date(instant);
  if (Number.isNaN(resultat.getTime())) {
    throw new RangeError(`Date invalide : « ${valeur} »`);
  }
  return resultat.toISOString();
}

/**
 * Conversion inverse : instant UTC (ISO, tel que renvoyé par l'API) → valeur
 * pour un champ datetime-local, exprimée en heure de l'Est. Utilisée pour
 * préremplir le formulaire en modification sans faire dériver l'heure.
 */
export function deDateEst(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** « samedi 8 août 2026 à 13 h 00 » — pour l'affichage dans les listes admin. */
export function formaterDateEvenement(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  }).format(new Date(iso));
}

interface FormValues {
  title: string;
  excerpt: string;
  description: string;
  imageUrl: string;
  debut: string;
  fin: string;
  location: string;
  isOnline: boolean;
  onlineUrl: string;
  capacity: string;
  bringItems: string;
  isPublished: boolean;
}

const valeursVides: FormValues = {
  title: '',
  excerpt: '',
  description: '',
  imageUrl: '',
  debut: '',
  fin: '',
  location: '',
  isOnline: false,
  onlineUrl: '',
  capacity: '1',
  bringItems: '',
  isPublished: false,
};

function versValeursForm(evenement: Evenement): FormValues {
  return {
    title: evenement.title,
    excerpt: evenement.excerpt ?? '',
    description: evenement.description,
    imageUrl: evenement.imageUrl ?? '',
    debut: deDateEst(evenement.startsAt),
    fin: evenement.endsAt ? deDateEst(evenement.endsAt) : '',
    location: evenement.location,
    isOnline: evenement.isOnline,
    onlineUrl: evenement.onlineUrl ?? '',
    capacity: String(evenement.capacity),
    bringItems: evenement.bringItems ?? '',
    isPublished: evenement.isPublished,
  };
}

interface Props {
  /** Événement à modifier. `null`/absent = mode création. */
  evenement?: Evenement | null;
  /** Appelé après un enregistrement réussi, avec l'événement renvoyé par l'API. */
  onSaved: (evenement: Evenement) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  marginTop: '4px',
  borderRadius: '6px',
  border: '1px solid #D1D5DB',
  background: '#fff',
  color: '#1F2937',
  fontSize: '0.9rem',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  color: '#4B5563',
  fontWeight: 600,
  marginBottom: '14px',
};

export default function FormulaireEvenement({ evenement, onSaved }: Props) {
  const [form, setForm] = useState<FormValues>(() =>
    evenement ? versValeursForm(evenement) : { ...valeursVides },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormValues>(champ: K, valeur: FormValues[K]) {
    setForm((f) => ({ ...f, [champ]: valeur }));
  }

  async function enregistrer() {
    setError(null);

    if (!form.title.trim()) return setError('Le titre est requis.');
    if (!form.description.trim()) return setError('La description est requise.');
    if (!form.location.trim()) return setError('Le lieu est requis.');
    if (!form.debut) return setError('La date de début est requise.');
    const capacite = Number(form.capacity);
    if (!Number.isInteger(capacite) || capacite < 1) {
      return setError('Le nombre de places doit être un entier positif.');
    }

    setSaving(true);
    try {
      // `versDateEst` peut lever (date malformée) : la construction du payload
      // doit rester DANS le bloc protégé, sinon un rejet silencieux laisse
      // croire à l'administratrice que l'enregistrement a réussi.
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || null,
        startsAt: versDateEst(form.debut),
        endsAt: form.fin ? versDateEst(form.fin) : null,
        location: form.location.trim(),
        isOnline: form.isOnline,
        onlineUrl: form.onlineUrl.trim() || null,
        capacity: capacite,
        bringItems: form.bringItems.trim() || null,
        isPublished: form.isPublished,
      };

      const res = evenement
        ? await fetch(`/api/admin/evenements/${evenement.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/evenements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Échec de l’enregistrement.');
      onSaved(data.evenement as Evenement);
    } catch (e) {
      if (e instanceof RangeError) {
        setError('La date saisie est invalide.');
      } else {
        setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}>
      <label style={labelStyle}>
        Titre *
        <input value={form.title} onChange={(e) => set('title', e.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        Accroche
        <input
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="Courte phrase affichée dans les listes du site"
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Description *
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
      </label>

      <label style={labelStyle}>
        URL de l&apos;image
        <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" style={inputStyle} />
      </label>

      <div style={{ display: 'flex', gap: '10px' }}>
        <label style={{ ...labelStyle, flex: 1 }}>
          Début *
          <input type="datetime-local" value={form.debut} onChange={(e) => set('debut', e.target.value)} style={inputStyle} />
        </label>
        <label style={{ ...labelStyle, flex: 1 }}>
          Fin
          <input type="datetime-local" value={form.fin} onChange={(e) => set('fin', e.target.value)} style={inputStyle} />
        </label>
      </div>

      <label style={labelStyle}>
        Lieu *
        <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Boutique, adresse…" style={inputStyle} />
      </label>

      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="checkbox" checked={form.isOnline} onChange={(e) => set('isOnline', e.target.checked)} />
        Événement en ligne
      </label>

      {form.isOnline && (
        <label style={labelStyle}>
          URL de visioconférence
          <input value={form.onlineUrl} onChange={(e) => set('onlineUrl', e.target.value)} placeholder="https://…" style={inputStyle} />
        </label>
      )}

      <label style={labelStyle}>
        Places *
        <input type="number" min={1} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} style={inputStyle} />
      </label>

      <label style={labelStyle}>
        Quoi apporter
        <textarea value={form.bringItems} onChange={(e) => set('bringItems', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      </label>

      <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
        Publié (visible sur le site public)
      </label>

      {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}

      <button
        type="button"
        onClick={enregistrer}
        disabled={saving}
        style={{
          padding: '10px 20px',
          background: '#6B3FA0',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-cinzel, serif)',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Enregistrement…' : evenement ? 'Enregistrer les modifications' : "Créer l'événement"}
      </button>
    </div>
  );
}
