'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { traiterImage, formatPoids } from '@/lib/image-processing';
import { uploadImage } from '@/lib/supabase';

export interface ProfilInitial {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

const fieldClass =
  'w-full rounded-sm border bg-transparent px-4 py-3 font-cormorant text-lg text-parchemin placeholder:text-parchemin/25 focus:outline-none';
const fieldStyle = { borderColor: 'rgba(74, 45, 122, 0.4)', background: 'rgba(26, 26, 46, 0.4)' };
const labelClass = 'mb-2 block font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/55';

export default function ProfilForm({ initial }: { initial: ProfilInitial }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);

  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [traitement, setTraitement] = useState(false);
  const [infoPoids, setInfoPoids] = useState<string | null>(null);
  const champPhoto = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  /**
   * La personne choisit une photo, le reste est automatique : recadrage carré,
   * 512 px, WebP sous 200 Ko, puis téléversement. Aucune manipulation technique.
   * La photo n'est rattachée au compte qu'à l'enregistrement du formulaire.
   */
  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    // Réinitialise le champ : sans ça, rechoisir le même fichier ne déclenche rien.
    e.target.value = '';
    if (!fichier) return;

    setMessage(null);
    setInfoPoids(null);
    setTraitement(true);
    try {
      const resultat = await traiterImage(fichier, {
        ratio: 1,
        maxCote: 512,
        poidsCible: 200_000,
        nom: 'avatar',
      });
      const url = await uploadImage(resultat.file, 'membres');
      setAvatarUrl(url);
      setInfoPoids(
        `${formatPoids(resultat.octetsOrigine)} → ${formatPoids(resultat.octets)} · ${resultat.largeur}×${resultat.hauteur} px`,
      );
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : "La photo n'a pas pu être traitée.",
      });
    } finally {
      setTraitement(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/membre/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          avatarUrl,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Une erreur est survenue.' });
        return;
      }
      setMessage({ type: 'ok', text: 'Profil mis à jour avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } catch {
      setMessage({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {message && (
        <div
          className="rounded-sm border px-4 py-3 font-cormorant text-base"
          style={
            message.type === 'ok'
              ? { background: 'rgba(46,196,182,0.1)', borderColor: 'rgba(46,196,182,0.4)', color: 'var(--turquoise-cristal)' }
              : { background: 'rgba(196,29,110,0.1)', borderColor: 'rgba(196,29,110,0.35)', color: '#f87171' }
          }
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}

      {/* Infos */}
      <div
        className="rounded-sm border p-6"
        style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
      >
        {/* Photo de profil */}
        <div
          className="mb-6 flex flex-col items-center gap-5 border-b pb-6 sm:flex-row"
          style={{ borderColor: 'rgba(74, 45, 122, 0.3)' }}
        >
          <div
            className="flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-cinzel text-2xl text-or-ancien"
            style={{
              background: 'rgba(74, 45, 122, 0.5)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
            }}
          >
            {avatarUrl ? (
              // Image Supabase servie telle quelle : elle est déjà à sa taille
              // finale (512 px), l'optimiseur de Next n'apporterait rien ici.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '✦'
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className={labelClass}>Photo de profil</p>
            <input
              ref={champPhoto}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhoto}
            />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => champPhoto.current?.click()}
                disabled={traitement}
                className="rounded-sm border px-4 py-2 font-cinzel text-[0.62rem] uppercase tracking-widest text-or-ancien transition-all duration-200 disabled:opacity-50"
                style={{ borderColor: 'rgba(201, 168, 76, 0.35)', background: 'rgba(74, 45, 122, 0.25)' }}
              >
                {traitement ? 'Traitement…' : avatarUrl ? 'Changer la photo' : 'Choisir une photo'}
              </button>
              {avatarUrl && !traitement && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl('');
                    setInfoPoids(null);
                  }}
                  className="rounded-sm border px-4 py-2 font-cinzel text-[0.62rem] uppercase tracking-widest text-parchemin/55 transition-all duration-200"
                  style={{ borderColor: 'rgba(74, 45, 122, 0.4)' }}
                >
                  Retirer
                </button>
              )}
            </div>
            <p className="mt-2 font-cormorant text-sm italic text-parchemin/35">
              {infoPoids ??
                'Choisis la photo que tu veux : elle est recadrée, allégée et optimisée automatiquement.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={labelClass}>Prénom</label>
            <input id="firstName" className={fieldClass} style={fieldStyle} value={firstName}
              onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>Nom</label>
            <input id="lastName" className={fieldClass} style={fieldStyle} value={lastName}
              onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="phone" className={labelClass}>Téléphone</label>
          <input id="phone" type="tel" className={fieldClass} style={fieldStyle} value={phone}
            onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+1 (514) 000-0000" />
        </div>

        <div className="mt-4">
          <label htmlFor="email" className={labelClass}>Courriel</label>
          <input id="email" className={fieldClass} style={{ ...fieldStyle, opacity: 0.6 }} value={initial.email}
            disabled readOnly />
          <p className="mt-1.5 font-cormorant text-sm italic text-parchemin/35">
            Pour changer ton courriel de connexion, contacte-nous.
          </p>
        </div>
      </div>

      {/* Mot de passe */}
      <div
        className="rounded-sm border p-6"
        style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
      >
        <p className="mb-4 font-cinzel text-[0.7rem] uppercase tracking-widest text-or-ancien">
          Changer le mot de passe (optionnel)
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="currentPassword" className={labelClass}>Mot de passe actuel</label>
            <input id="currentPassword" type="password" className={fieldClass} style={fieldStyle}
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="newPassword" className={labelClass}>Nouveau mot de passe</label>
              <input id="newPassword" type="password" className={fieldClass} style={fieldStyle}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password" placeholder="Min. 8 caractères" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirmer</label>
              <input id="confirmPassword" type="password" className={fieldClass} style={fieldStyle}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password" placeholder="••••••••" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-sm border px-7 py-3 font-cinzel text-xs uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
            borderColor: 'rgba(201, 168, 76, 0.3)',
            color: 'var(--or-ancien)',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  );
}
