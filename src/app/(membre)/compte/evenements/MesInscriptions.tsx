'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface InscriptionAffichee {
  id: string;
  eventSlug: string;
  eventTitle: string;
  dateFormatee: string;
  location: string;
  isOnline: boolean;
  /** Pointage de Noctura : true seulement si la présence a été constatée. */
  presente?: boolean;
}

const sectionTitle =
  'mb-5 border-b pb-2.5 font-cinzel text-[0.82rem] uppercase tracking-[0.18em] text-or-ancien';

/**
 * Ligne d'une inscription à venir. La confirmation avant annulation se fait
 * entièrement en interface (pas de `confirm()` natif) : un premier clic
 * affiche « Oui, annuler / Non », un second clic sur « Oui » appelle l'API.
 */
function LigneAVenir({
  inscription,
  onAnnulee,
}: {
  inscription: InscriptionAffichee;
  onAnnulee: (id: string) => void;
}) {
  const [confirmation, setConfirmation] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function confirmerAnnulation() {
    setChargement(true);
    setErreur(null);
    try {
      const reponse = await fetch('/api/membre/evenements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: inscription.id }),
      });
      if (!reponse.ok) {
        const donnees = await reponse.json().catch(() => ({}));
        setErreur(donnees.error ?? 'Impossible d’annuler cette inscription.');
        setChargement(false);
        return;
      }
      onAnnulee(inscription.id);
    } catch {
      setErreur('Impossible de contacter le serveur. Réessayez dans un instant.');
      setChargement(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-sm border p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
    >
      <div>
        <Link
          href={`/evenements/${inscription.eventSlug}`}
          className="font-cinzel text-sm text-parchemin transition-colors duration-200 hover:text-or-ancien"
        >
          {inscription.eventTitle}
        </Link>
        <p className="mt-1 font-cormorant text-base text-parchemin/50">
          {inscription.dateFormatee}
        </p>
        <p className="font-cormorant text-base text-parchemin/40">
          {inscription.location}
          {inscription.isOnline ? ' (en ligne)' : ''}
        </p>
        {erreur && <p className="mt-2 font-cormorant text-sm text-magenta-rituel">{erreur}</p>}
      </div>

      {confirmation ? (
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="font-cormorant text-sm text-parchemin/60">Confirmer ?</span>
          <button
            type="button"
            onClick={confirmerAnnulation}
            disabled={chargement}
            className="rounded-sm border px-4 py-2 font-cinzel text-[0.65rem] uppercase tracking-widest text-magenta-rituel transition-colors duration-200"
            style={{ borderColor: 'rgba(196, 29, 110, 0.4)', background: 'rgba(196, 29, 110, 0.1)' }}
          >
            {chargement ? 'Annulation…' : 'Oui, annuler'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmation(false)}
            disabled={chargement}
            className="font-cinzel text-[0.65rem] uppercase tracking-widest text-parchemin/50 transition-colors duration-200 hover:text-parchemin"
          >
            Non
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="flex-shrink-0 rounded-sm border px-4 py-2 font-cinzel text-[0.65rem] uppercase tracking-widest text-parchemin/60 transition-colors duration-200 hover:text-magenta-rituel"
          style={{ borderColor: 'rgba(74, 45, 122, 0.4)' }}
        >
          Annuler ma place
        </button>
      )}
    </div>
  );
}

/**
 * Ligne d'un rituel passé : lecture seule.
 *
 * La pastille « Vécu » n'apparaît que si la présence a été pointée. Son absence
 * ne veut pas dire que la personne n'est pas venue — seulement que le rituel
 * n'a pas encore été pointé — donc rien n'est affiché dans ce cas plutôt qu'une
 * mention négative qui serait fausse.
 */
function LignePassee({ inscription }: { inscription: InscriptionAffichee }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-sm border p-4"
      style={{ background: 'rgba(26, 26, 46, 0.5)', borderColor: 'rgba(74, 45, 122, 0.25)' }}
    >
      <div>
        <p className="font-cinzel text-sm text-parchemin/65">{inscription.eventTitle}</p>
        <p className="mt-1 font-cormorant text-base text-parchemin/40">
          {inscription.dateFormatee}
        </p>
      </div>
      {inscription.presente && (
        <span
          className="flex-shrink-0 rounded-full border px-3 py-1 font-cinzel text-[0.62rem] uppercase tracking-widest"
          style={{ color: 'var(--or-ancien)', borderColor: 'rgba(201, 168, 76, 0.4)', background: 'rgba(201, 168, 76, 0.08)' }}
        >
          ᛉ Vécu
        </span>
      )}
    </div>
  );
}

export default function MesInscriptions({
  aVenir: aVenirInitial,
  passees,
  vecus,
}: {
  aVenir: InscriptionAffichee[];
  passees: InscriptionAffichee[];
  /** Nombre de rituels dont la présence a été constatée. */
  vecus: number;
}) {
  const [aVenir, setAVenir] = useState(aVenirInitial);

  function retirer(id: string) {
    setAVenir((liste) => liste.filter((inscription) => inscription.id !== id));
  }

  return (
    <div>
      {(vecus > 0 || passees.length > 0) && (
        <div
          className="mb-10 flex items-center gap-4 rounded-sm border p-5"
          style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(201, 168, 76, 0.25)' }}
        >
          <span className="font-cinzel text-3xl" style={{ color: 'var(--or-ancien)' }}>
            ᛉ
          </span>
          <div>
            <p className="font-cinzel text-2xl" style={{ color: 'var(--or-ancien)' }}>
              {vecus > 0 ? vecus : passees.length}
            </p>
            <p className="font-cormorant text-base italic text-parchemin/55">
              {vecus > 0
                ? `rituel${vecus > 1 ? 's' : ''} vécu${vecus > 1 ? 's' : ''} avec le cercle`
                : `rituel${passees.length > 1 ? 's' : ''} auquel${passees.length > 1 ? 's' : ''} vous étiez inscrit${passees.length > 1 ? 'e·s' : 'e'}`}
            </p>
          </div>
        </div>
      )}

      <section className="mb-10">
        <h2 className={sectionTitle}>À venir</h2>
        {aVenir.length === 0 ? (
          <div
            className="rounded-sm border px-8 py-10 text-center"
            style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
          >
            <p className="mb-5 font-cormorant text-lg italic text-parchemin/45">
              Aucune inscription à venir pour le moment.
            </p>
            <Link
              href="/evenements"
              className="inline-flex items-center font-cinzel text-xs uppercase tracking-widest text-turquoise-cristal transition-colors duration-200 hover:text-or-ancien"
            >
              Voir les événements →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {aVenir.map((inscription) => (
              <LigneAVenir key={inscription.id} inscription={inscription} onAnnulee={retirer} />
            ))}
          </div>
        )}
      </section>

      {passees.length > 0 && (
        <section>
          <h2 className={sectionTitle}>Mon histoire avec le cercle</h2>
          <div className="flex flex-col gap-2">
            {passees.map((inscription) => (
              <LignePassee key={inscription.id} inscription={inscription} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
