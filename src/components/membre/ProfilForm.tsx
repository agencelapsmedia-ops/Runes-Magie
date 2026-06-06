'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ProfilInitial {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

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
