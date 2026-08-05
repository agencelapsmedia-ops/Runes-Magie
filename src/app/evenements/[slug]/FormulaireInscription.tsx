'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface FormulaireInscriptionProps {
  slug: string;
  estConnecte: boolean;
  placesRestantes: number;
  dejaInscrit: boolean;
  capacite: number;
}

/** Mémorise le message avant de quitter la page pour se connecter/s'inscrire. */
function memoriserNote(slug: string, note: string) {
  try {
    if (note.trim()) sessionStorage.setItem(`evenement:${slug}:note`, note.trim());
  } catch {
    // Navigation privée : tant pis, le message n'est pas conservé.
  }
}

export default function FormulaireInscription({
  slug,
  estConnecte,
  placesRestantes,
  dejaInscrit,
  capacite,
}: FormulaireInscriptionProps) {
  const [note, setNote] = useState('');
  const [restantes, setRestantes] = useState(placesRestantes);
  const [inscrit, setInscrit] = useState(dejaInscrit);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Au montage : si un message a été laissé avant une redirection vers la
  // connexion, on le réinjecte puis on l'efface — il ne doit servir qu'une fois.
  useEffect(() => {
    const cle = `evenement:${slug}:note`;
    try {
      const memorise = sessionStorage.getItem(cle);
      if (memorise) {
        setNote(memorise);
        sessionStorage.removeItem(cle);
      }
    } catch {
      // Navigation privée : rien à réinjecter.
    }
  }, [slug]);

  async function inscrireMembre(evenementFormulaire: FormEvent<HTMLFormElement>) {
    evenementFormulaire.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const reponse = await fetch(`/api/evenements/${slug}/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees.error ?? 'Une erreur est survenue.');
        if (donnees.code === 'COMPLET') setRestantes(0);
        // Conflit de double-soumission : une autre requête nous a déjà inscrit.
        if (donnees.code === 'DEJA_INSCRIT') setInscrit(true);
        return;
      }
      setInscrit(true);
      setRestantes(donnees.placesRestantes);
    } catch {
      setErreur('Impossible de contacter le serveur. Réessayez dans un instant.');
    } finally {
      setChargement(false);
    }
  }

  // État « confirmation » : inscription déjà existante ou tout juste réussie.
  if (inscrit) {
    return (
      <div className="rounded-lg border border-turquoise-cristal/40 bg-charbon-mystere p-6 text-center">
        <p className="font-cinzel text-sm uppercase tracking-widest text-turquoise-cristal">
          Votre place est réservée
        </p>
        <p className="mt-2 font-cormorant text-parchemin-vieilli/70">
          Un courriel de confirmation vous a été envoyé, avec un lien pour annuler au besoin.
        </p>
        <Link
          href="/compte/evenements"
          className="mt-4 inline-block font-cinzel text-sm tracking-widest text-or-ancien underline underline-offset-4 hover:text-turquoise-cristal"
        >
          Voir mes événements
        </Link>
      </div>
    );
  }

  // État « complet » : plus aucune place, quelle que soit la connexion.
  if (restantes <= 0) {
    return (
      <div className="rounded-lg border border-violet-royal/40 bg-charbon-mystere p-6 text-center">
        <p className="font-cinzel text-sm uppercase tracking-widest text-or-ancien">Complet</p>
        <p className="mt-2 font-cormorant text-parchemin-vieilli/70">
          Toutes les places sont prises pour cet événement. Revenez voir nos prochains
          rassemblements.
        </p>
      </div>
    );
  }

  // État « non connecté » : pas de formulaire de réservation, seulement les
  // liens de connexion/inscription — le message est mémorisé avant de partir.
  if (!estConnecte) {
    const retour = encodeURIComponent(
      typeof window !== 'undefined' ? window.location.pathname : `/evenements/${slug}`,
    );
    return (
      <div className="rounded-lg border border-or-ancien/40 bg-charbon-mystere p-6">
        <p className="font-cinzel text-sm uppercase tracking-widest text-or-ancien">
          Connectez-vous pour réserver
        </p>
        <p className="mt-2 font-cormorant text-parchemin-vieilli/70">
          Un compte gratuit est nécessaire pour réserver votre place. Vous pouvez déjà laisser un
          message ci-dessous : il vous sera proposé à nouveau à votre retour.
        </p>
        <label
          htmlFor="note-inscription-visiteur"
          className="mt-4 block font-cinzel text-sm uppercase tracking-widest text-or-ancien"
        >
          Message (optionnel)
        </label>
        <textarea
          id="note-inscription-visiteur"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Un message ? une allergie ? vous venez accompagné ?"
          rows={3}
          className="mt-2 w-full rounded-md border border-violet-royal/40 bg-noir-nuit p-3 font-cormorant text-parchemin-vieilli placeholder:text-parchemin-vieilli/40 focus:border-or-ancien/60 focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/soins/auth/login?next=${retour}`}
            onClick={() => memoriserNote(slug, note)}
            className="inline-flex items-center justify-center rounded-sm border border-or-ancien/50 px-6 py-3 font-cinzel text-sm uppercase tracking-[0.15em] text-or-ancien transition-all duration-300 hover:border-or-ancien hover:bg-or-ancien/10"
          >
            Se connecter
          </Link>
          <Link
            href={`/soins/auth/register?next=${retour}`}
            onClick={() => memoriserNote(slug, note)}
            className="inline-flex items-center justify-center rounded-sm border border-turquoise-cristal/50 px-6 py-3 font-cinzel text-sm uppercase tracking-[0.15em] text-turquoise-cristal transition-all duration-300 hover:border-turquoise-cristal hover:bg-turquoise-cristal/10"
          >
            Créer mon compte
          </Link>
        </div>
      </div>
    );
  }

  // État « connecté, pas encore inscrit » : le vrai formulaire de réservation.
  return (
    <form
      onSubmit={inscrireMembre}
      className="rounded-lg border border-violet-royal/40 bg-charbon-mystere p-6"
    >
      <p className="font-cinzel text-sm uppercase tracking-widest text-or-ancien">
        Réserver ma place
      </p>
      <label
        htmlFor="note-inscription"
        className="mt-3 block font-cormorant text-sm text-parchemin-vieilli/70"
      >
        Message ou allergie (optionnel)
      </label>
      <textarea
        id="note-inscription"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Un message ? une allergie ? vous venez accompagné ?"
        rows={3}
        className="mt-2 w-full rounded-md border border-violet-royal/40 bg-noir-nuit p-3 font-cormorant text-parchemin-vieilli placeholder:text-parchemin-vieilli/40 focus:border-or-ancien/60 focus:outline-none"
      />

      {erreur && <p className="mt-3 font-cormorant text-magenta-rituel">{erreur}</p>}

      <p className="mt-3 font-cormorant text-sm text-parchemin-vieilli/60">
        {restantes} place{restantes > 1 ? 's' : ''} restante{restantes > 1 ? 's' : ''} sur{' '}
        {capacite}.
      </p>

      <Button type="submit" disabled={chargement} className="mt-4">
        {chargement ? 'Envoi…' : 'Je réserve ma place'}
      </Button>
    </form>
  );
}
