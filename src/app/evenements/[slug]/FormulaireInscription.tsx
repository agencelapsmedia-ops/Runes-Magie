'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { MAX_ACCOMPAGNATEURS } from '@/lib/evenements-constantes';

interface FormulaireInscriptionProps {
  slug: string;
  estConnecte: boolean;
  placesRestantes: number;
  dejaInscrit: boolean;
  capacite: number;
  /** null si non connecté, ou si le compte de session n'est pas un membre (ex. admin). */
  nomComplet: string | null;
  titreEvenement: string;
}

export default function FormulaireInscription({
  slug,
  estConnecte,
  placesRestantes,
  dejaInscrit,
  capacite,
  nomComplet,
  titreEvenement,
}: FormulaireInscriptionProps) {
  const router = useRouter();
  const [restantes, setRestantes] = useState(placesRestantes);
  const [inscrit, setInscrit] = useState(dejaInscrit);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Non coché par défaut : le consentement à apparaître publiquement doit être
  // un choix actif, jamais un défaut (Loi 25).
  const [afficherPubliquement, setAfficherPubliquement] = useState(false);
  // Personnes amenées. Une ligne = une place de plus : le groupe entier tient
  // dans les places restantes, ou l'inscription est refusée en bloc.
  const [accompagnateurs, setAccompagnateurs] = useState<
    { firstName: string; lastName: string; email: string }[]
  >([]);

  const maximumAmenables = Math.min(MAX_ACCOMPAGNATEURS, Math.max(0, restantes - 1));

  function changerNombre(nombre: number) {
    setAccompagnateurs((actuels) => {
      if (nombre <= actuels.length) return actuels.slice(0, nombre);
      const ajout = Array.from({ length: nombre - actuels.length }, () => ({
        firstName: '',
        lastName: '',
        email: '',
      }));
      return [...actuels, ...ajout];
    });
  }

  function modifier(index: number, champ: 'firstName' | 'lastName' | 'email', valeur: string) {
    setAccompagnateurs((actuels) =>
      actuels.map((a, i) => (i === index ? { ...a, [champ]: valeur } : a)),
    );
  }

  async function inscrireMembre(evenementFormulaire: FormEvent<HTMLFormElement>) {
    evenementFormulaire.preventDefault();
    setErreur(null);

    if (accompagnateurs.some((a) => !a.firstName.trim() || !a.lastName.trim())) {
      setErreur('Indiquez le prénom et le nom de chaque personne que vous amenez.');
      return;
    }

    setChargement(true);
    try {
      const reponse = await fetch(`/api/evenements/${slug}/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          afficherPubliquement,
          accompagnateurs: accompagnateurs.map((a) => ({
            firstName: a.firstName.trim(),
            lastName: a.lastName.trim(),
            email: a.email.trim() || null,
          })),
        }),
      });
      const donnees = await reponse.json();
      if (!reponse.ok) {
        setErreur(donnees.error ?? 'Une erreur est survenue.');
        if (donnees.code === 'COMPLET') setRestantes(0);
        // Conflit de double-soumission : une autre requête nous a déjà inscrit.
        if (donnees.code === 'DEJA_INSCRIT') {
          setInscrit(true);
          // On recharge les données serveur : la section « Le cercle » (rendue
          // par la page) doit refléter cette inscription si elle est publique.
          router.refresh();
        }
        return;
      }
      setInscrit(true);
      setRestantes(donnees.placesRestantes);
      // Idem : la section « Le cercle » de la page vit hors de ce composant et
      // doit être redemandée au serveur pour montrer cette inscription à jour.
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

      {maximumAmenables > 0 && (
        <div className="mt-5 border-t border-violet-royal/30 pt-4">
          <label
            htmlFor="nombre-accompagnateurs"
            className="font-cinzel text-xs uppercase tracking-widest text-or-ancien"
          >
            J&apos;amène quelqu&apos;un
          </label>
          <p className="mt-1 font-cormorant text-sm text-parchemin-vieilli/50">
            Chaque personne amenée occupe une place. Nous avons besoin de leur nom pour savoir qui
            sera au Temple.
          </p>
          <select
            id="nombre-accompagnateurs"
            value={accompagnateurs.length}
            onChange={(evenementChange) => changerNombre(Number(evenementChange.target.value))}
            className="mt-3 rounded-sm border border-violet-royal/50 bg-noir-nuit px-3 py-2 font-cormorant text-parchemin-vieilli"
          >
            <option value={0}>Je viens seule</option>
            {Array.from({ length: maximumAmenables }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} personne{n > 1 ? 's' : ''} avec moi
              </option>
            ))}
          </select>

          {accompagnateurs.map((accompagnateur, index) => (
            <div key={index} className="mt-3 grid gap-2 sm:grid-cols-3">
              <input
                value={accompagnateur.firstName}
                onChange={(e) => modifier(index, 'firstName', e.target.value)}
                placeholder={`Prénom (personne ${index + 1})`}
                className="rounded-sm border border-violet-royal/50 bg-noir-nuit px-3 py-2 font-cormorant text-parchemin-vieilli placeholder:text-parchemin-vieilli/35"
              />
              <input
                value={accompagnateur.lastName}
                onChange={(e) => modifier(index, 'lastName', e.target.value)}
                placeholder="Nom"
                className="rounded-sm border border-violet-royal/50 bg-noir-nuit px-3 py-2 font-cormorant text-parchemin-vieilli placeholder:text-parchemin-vieilli/35"
              />
              <input
                type="email"
                value={accompagnateur.email}
                onChange={(e) => modifier(index, 'email', e.target.value)}
                placeholder="Courriel (facultatif)"
                className="rounded-sm border border-violet-royal/50 bg-noir-nuit px-3 py-2 font-cormorant text-parchemin-vieilli placeholder:text-parchemin-vieilli/35"
              />
            </div>
          ))}

          {accompagnateurs.length > 0 && (
            <p className="mt-3 font-cormorant text-sm text-turquoise-cristal">
              Vous réservez {accompagnateurs.length + 1} places au total.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          id="afficher-publiquement"
          checked={afficherPubliquement}
          onChange={(evenementChange) => setAfficherPubliquement(evenementChange.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-turquoise-cristal"
        />
        <label htmlFor="afficher-publiquement" className="font-cormorant text-parchemin-vieilli/80">
          J&apos;accepte que mon prénom apparaisse dans la liste publique des participants.
          <span className="mt-1 block text-sm text-parchemin-vieilli/50">
            Sans cette autorisation, vous êtes comptée dans le nombre d&apos;inscrits, mais votre
            prénom n&apos;apparaît pas dans « Le cercle ».
          </span>
        </label>
      </div>

      <Button type="submit" disabled={chargement} className="mt-4">
        {chargement ? 'Envoi…' : 'Je réserve ma place'}
      </Button>
    </form>
  );
}
