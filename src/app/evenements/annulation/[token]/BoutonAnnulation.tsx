'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

type Etat = 'attente' | 'chargement' | 'succes' | 'erreur';

export default function BoutonAnnulation({ token }: { token: string }) {
  const [etat, setEtat] = useState<Etat>('attente');
  const [erreur, setErreur] = useState<string | null>(null);

  // Volontairement déclenché uniquement par ce clic — jamais dans un effet au
  // montage, sinon l'aperçu de lien d'un client courriel (Outlook, Gmail…)
  // annulerait la place tout seul en pré-chargeant la page.
  async function confirmerAnnulation() {
    setEtat('chargement');
    setErreur(null);
    try {
      const reponse = await fetch(`/api/evenements/annulation/${token}`, { method: 'POST' });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees.error ?? 'Impossible d’annuler cette inscription.');
        setEtat('erreur');
        return;
      }
      setEtat('succes');
    } catch {
      setErreur('Impossible de contacter le serveur. Réessayez dans un instant.');
      setEtat('erreur');
    }
  }

  if (etat === 'succes') {
    return (
      <div className="rounded-lg border border-turquoise-cristal/40 bg-charbon-mystere p-6 text-center">
        <p className="font-cinzel text-sm uppercase tracking-widest text-turquoise-cristal">
          Inscription annulée
        </p>
        <p className="mt-2 font-cormorant text-parchemin-vieilli/70">
          Votre place a été libérée. Merci de nous avoir prévenus.
        </p>
        <Link
          href="/evenements"
          className="mt-4 inline-block font-cinzel text-sm tracking-widest text-or-ancien underline underline-offset-4 hover:text-turquoise-cristal"
        >
          Voir les événements
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-violet-royal/40 bg-charbon-mystere p-6 text-center">
      <p className="font-cormorant text-lg text-parchemin-vieilli/80">
        Souhaitez-vous vraiment annuler votre inscription à cet événement ? Votre place sera
        aussitôt libérée pour quelqu’un d’autre.
      </p>

      {erreur && <p className="mt-3 font-cormorant text-magenta-rituel">{erreur}</p>}

      <Button
        type="button"
        onClick={confirmerAnnulation}
        disabled={etat === 'chargement'}
        className="mt-6"
      >
        {etat === 'chargement' ? 'Annulation…' : 'Confirmer l’annulation'}
      </Button>
    </div>
  );
}
