'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface BoutonPartagerProps {
  /** Lien canonique de la fiche (https://www.runesetmagie.ca/evenements/<slug>). */
  url: string;
  titre: string;
  /** Date formatée, reprise dans le message partagé. */
  sousTitre: string;
}

type Etat = 'repos' | 'copie' | 'manuel';

/**
 * Bouton « Partager » de la fiche publique d'un événement.
 *
 * 1. Sur mobile (et quelques navigateurs de bureau), le partage natif
 *    (`navigator.share`) ouvre la feuille de partage du téléphone : Messenger,
 *    messages texte, WhatsApp, courriel… — le choix de l'app revient à la
 *    personne.
 * 2. Sinon, le lien est copié dans le presse-papiers et le bouton le confirme
 *    pendant quelques secondes.
 * 3. Si même la copie est impossible (navigateur ancien, page hors HTTPS), le
 *    lien est affiché en clair, pré-sélectionné, pour être copié à la main.
 */
export default function BoutonPartager({ url, titre, sousTitre }: BoutonPartagerProps) {
  const [etat, setEtat] = useState<Etat>('repos');

  useEffect(() => {
    if (etat !== 'copie') return;
    const minuterie = setTimeout(() => setEtat('repos'), 2500);
    return () => clearTimeout(minuterie);
  }, [etat]);

  async function partager() {
    const message = `${titre} — ${sousTitre}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: titre, text: message, url });
        return;
      } catch (erreur) {
        // La personne a simplement fermé la feuille de partage : rien à faire.
        if (erreur instanceof DOMException && erreur.name === 'AbortError') return;
        // Toute autre erreur (partage refusé par le navigateur) : on retombe
        // sur la copie du lien.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setEtat('copie');
    } catch {
      setEtat('manuel');
    }
  }

  return (
    <div className="mb-8 flex flex-col items-center gap-3">
      <Button variant="secondary" size="sm" onClick={partager}>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {etat === 'copie' ? 'Lien copié !' : 'Partager cet événement'}
      </Button>

      {etat === 'manuel' && (
        <label className="w-full max-w-md text-center font-cormorant text-sm text-parchemin-vieilli/70">
          Copiez ce lien pour le partager :
          <input
            type="text"
            readOnly
            value={url}
            onFocus={(evenement) => evenement.currentTarget.select()}
            autoFocus
            className="mt-1 w-full rounded-sm border border-violet-royal/40 bg-charbon-mystere px-3 py-2 text-center font-sans text-xs text-parchemin-vieilli"
          />
        </label>
      )}
    </div>
  );
}
