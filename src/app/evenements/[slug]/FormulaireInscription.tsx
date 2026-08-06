'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Participant {
  id: string;
  prenom: string;
  initiale: string;
  estMoi: boolean;
}

interface FormulaireInscriptionProps {
  slug: string;
  estConnecte: boolean;
  placesRestantes: number;
  dejaInscrit: boolean;
  capacite: number;
  /** null si non connecté, ou si le compte de session n'est pas un membre (ex. admin). */
  nomComplet: string | null;
  titreEvenement: string;
  /** Liste des personnes CONFIRMED — fournie par le serveur uniquement si la
   * personne connectée est elle-même inscrite et confirmée à cet événement. */
  participants: Participant[];
}

export default function FormulaireInscription({
  slug,
  estConnecte,
  placesRestantes,
  dejaInscrit,
  capacite,
  nomComplet,
  titreEvenement,
  participants,
}: FormulaireInscriptionProps) {
  const router = useRouter();
  const [restantes, setRestantes] = useState(placesRestantes);
  const [inscrit, setInscrit] = useState(dejaInscrit);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function inscrireMembre(evenementFormulaire: FormEvent<HTMLFormElement>) {
    evenementFormulaire.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const reponse = await fetch(`/api/evenements/${slug}/inscription`, { method: 'POST' });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees.error ?? 'Une erreur est survenue.');
        if (donnees.code === 'COMPLET') setRestantes(0);
        // Conflit de double-soumission : une autre requête nous a déjà inscrit.
        if (donnees.code === 'DEJA_INSCRIT') {
          setInscrit(true);
          // On recharge les données serveur pour obtenir la liste à jour du cercle.
          router.refresh();
        }
        return;
      }
      setInscrit(true);
      setRestantes(donnees.placesRestantes);
      // La liste du cercle n'a pas encore été chargée pour cette personne au
      // premier rendu de la page (elle n'était pas encore inscrite) : on
      // redemande le rendu serveur pour l'obtenir avec les autres données à jour.
      router.refresh();
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

        {participants.length > 0 && (
          <div className="mt-6 border-t border-violet-royal/40 pt-6 text-left">
            <p className="text-center font-cinzel text-sm uppercase tracking-widest text-or-ancien">
              Le cercle
            </p>
            {participants.length === 1 ? (
              <p className="mt-2 text-center font-cormorant text-parchemin-vieilli/70">
                Vous êtes la première inscrite — le cercle se formera bientôt.
              </p>
            ) : (
              <ul className="mt-3 space-y-1 font-cormorant text-parchemin-vieilli/80">
                {participants.map((participant) => (
                  <li key={participant.id}>
                    {participant.prenom} {participant.initiale}.
                    {participant.estMoi && (
                      <span className="text-turquoise-cristal"> (vous)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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
  // liens de connexion/inscription.
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
          Un compte gratuit est nécessaire pour réserver votre place.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href={`/soins/auth/login?next=${retour}`}
            className="inline-flex items-center justify-center rounded-sm border border-or-ancien/50 px-6 py-3 font-cinzel text-sm uppercase tracking-[0.15em] text-or-ancien transition-all duration-300 hover:border-or-ancien hover:bg-or-ancien/10"
          >
            Se connecter
          </Link>
          <Link
            href={`/soins/auth/register?next=${retour}`}
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

      {nomComplet && (
        <p className="mt-3 font-cormorant text-parchemin-vieilli/80">
          Vous vous inscrivez au{' '}
          <strong className="text-or-ancien">{titreEvenement}</strong> en tant que{' '}
          <strong className="text-turquoise-cristal">{nomComplet}</strong>.
        </p>
      )}

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
