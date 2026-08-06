'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * FeuilleRendezVous — création d'un rendez-vous au téléphone, en quatre temps.
 *
 * Une feuille qui monte du bas de l'écran et pose une seule question à la fois :
 * qui, quoi, quand, confirmer. Dans le cas courant (cliente connue, soin
 * habituel, aujourd'hui) le rendez-vous se crée en quatre gestes : la cliente,
 * le soin, le créneau, « Créer ». Chaque sélection fait avancer d'elle-même.
 *
 * Le formulaire d'ordinateur (`src/components/holistique/ManualAppointmentButton.tsx`)
 * reste en service : cette feuille ne le remplace que sur téléphone.
 */

interface Soin {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

/** Même forme pour les clientes récentes (fournies par le parent) et les résultats de recherche. */
interface Cliente {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** Cliente retenue pour ce rendez-vous : `id` vaut null si elle vient d'être saisie. */
interface ClienteRetenue {
  /**
   * Identité de la PERSONNE, indépendante des champs affichés.
   *
   * `fiche:<id>` pour une cliente déjà en base — son identifiant EST son identité.
   * `saisie:<n>` pour une cliente tapée à la main : l'identité est la saisie
   * elle-même, et elle ne change que lorsqu'une NOUVELLE saisie est démarrée
   * (bouton « + Nouvelle cliente »), jamais lorsqu'on corrige celle en cours.
   *
   * C'est la seule chose que la feuille compare pour décider si on a changé de
   * personne : ni le nom, ni le téléphone, ni le courriel — ce sont précisément
   * les champs qu'elle revient corriger.
   */
  cle: string;
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** Contrat de GET /api/admin/agenda/creneaux (voir src/lib/creneaux.ts). */
interface Creneau {
  /** Étiquette affichable, ex. « 13:15 ». */
  debut: string;
  /** Instant exact — renvoyé TEL QUEL à la création, jamais reconstruit ici. */
  debutIso: string;
  disponible: boolean;
  motif?: 'RENDEZ_VOUS' | 'AGENDA_PERSONNEL';
  etiquette?: string;
}

interface Props {
  ouverte: boolean;
  onFermer: () => void;
  onCree: () => void;
  practitionerId: string;
  practitionerNom: string;
  offerings: Soin[];
  /** Dernières clientes de la praticienne — fournies par la page serveur (Task 7). */
  clientesRecentes: Cliente[];
  /** « 2026-08-11 » si on a tapé une case du calendrier. */
  dateInitiale?: string;
}

/* ------------------------------------------------------------------ */
/* Palette du back-office                                              */
/* ------------------------------------------------------------------ */

const VIOLET = '#6B3FA0';
const TITRE = '#2D1B4E';
const GRIS = '#6B7280';
const GRIS_CLAIR = '#9CA3AF';
const BORDURE = '#E5E7EB';
const OR = '#C9A84C';
const ROUGE = '#DC2626';
const CINZEL = 'var(--font-cinzel, serif)';

/* ------------------------------------------------------------------ */
/* Dates civiles — tout se calcule en heure locale du téléphone.       */
/* `toISOString()` est proscrit ici : il bascule en UTC et peut        */
/* changer de jour. L'instant exact vient toujours du serveur.         */
/* ------------------------------------------------------------------ */

function dateCivile(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** « 2026-08-11 » → Date locale à midi (immunise contre les bascules d'heure). */
function midiLocal(date: string): Date {
  const [an, mois, jour] = date.split('-').map(Number);
  return new Date(an, mois - 1, jour, 12, 0, 0, 0);
}

/** « 2026-08-11 » → « samedi 11 août ». */
function jourEnToutesLettres(date: string): string {
  return midiLocal(date).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
}

function ecartEnJours(depuis: string, jusqua: string): number {
  return Math.round((midiLocal(jusqua).getTime() - midiLocal(depuis).getTime()) / 86400000);
}

/* ------------------------------------------------------------------ */
/* Styles partagés                                                     */
/* ------------------------------------------------------------------ */

/** Toute zone tapable fait au moins 44 px de haut — c'est un pouce, pas une souris. */
const TAPABLE: React.CSSProperties = { minHeight: '44px', cursor: 'pointer' };

const carte = (actif: boolean): React.CSSProperties => ({
  ...TAPABLE,
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: '10px',
  border: `2px solid ${actif ? VIOLET : BORDURE}`,
  background: actif ? 'rgba(107,63,160,0.08)' : '#fff',
  color: '#1F2937',
  fontSize: '0.95rem',
});

const champ: React.CSSProperties = {
  width: '100%',
  minHeight: '44px',
  padding: '11px 12px',
  borderRadius: '8px',
  border: `1px solid ${BORDURE}`,
  background: '#fff',
  color: '#1F2937',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const etiquetteChamp: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: GRIS,
  marginBottom: '4px',
  fontWeight: 600,
};

const lienDiscret: React.CSSProperties = {
  ...TAPABLE,
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 4px',
  background: 'none',
  border: 'none',
  color: VIOLET,
  fontSize: '0.85rem',
  textDecoration: 'underline',
};

const titreEtape: React.CSSProperties = {
  fontFamily: CINZEL,
  fontSize: '1.15rem',
  color: TITRE,
  margin: '0 0 4px',
};

const sousTitre: React.CSSProperties = { fontSize: '0.8rem', color: GRIS_CLAIR, margin: '0 0 16px' };

/* ------------------------------------------------------------------ */

export default function FeuilleRendezVous({
  ouverte,
  onFermer,
  onCree,
  practitionerId,
  practitionerNom,
  offerings,
  clientesRecentes,
  dateInitiale,
}: Props) {
  /* --- Étape courante ------------------------------------------------ */
  const [etape, setEtape] = useState<1 | 2 | 3 | 4>(1);

  /* --- Étape 1 : la cliente ------------------------------------------ */
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState<Cliente[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [nouvelleDepliee, setNouvelleDepliee] = useState(false);
  const [nvPrenom, setNvPrenom] = useState('');
  const [nvNom, setNvNom] = useState('');
  const [nvTelephone, setNvTelephone] = useState('');
  const [nvCourriel, setNvCourriel] = useState('');
  const [erreurNouvelle, setErreurNouvelle] = useState<string | null>(null);
  const [cliente, setCliente] = useState<ClienteRetenue | null>(null);
  /**
   * Numéro de la saisie manuelle en cours. Il n'avance que sur un geste explicite
   * (« + Nouvelle cliente » / « Effacer et saisir une autre personne ») : tant qu'il
   * ne bouge pas, re-soumettre le formulaire modifie la saisie en cours au lieu de
   * changer de personne.
   */
  const [numeroSaisie, setNumeroSaisie] = useState(1);
  const cleSaisie = `saisie:${numeroSaisie}`;
  /** La saisie manuelle en cours est-elle déjà la personne retenue ? */
  const saisieRetenue = cliente !== null && cliente.cle === cleSaisie;

  /* --- Étape 2 : le soin --------------------------------------------- */
  const [soin, setSoin] = useState<Soin | null>(null);
  const [tousLesSoins, setTousLesSoins] = useState(false);

  /* --- Étape 3 : le moment ------------------------------------------- */
  const jourDepart = useMemo(() => {
    const aujourdhui = dateCivile(new Date());
    if (!dateInitiale || dateInitiale <= aujourdhui) return aujourdhui;
    // Une case tapée au-delà de la quinzaine : la rangée commence là-bas.
    return ecartEnJours(aujourdhui, dateInitiale) > 13 ? dateInitiale : aujourdhui;
  }, [dateInitiale]);

  const [jour, setJour] = useState(jourDepart);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [agendaConsulte, setAgendaConsulte] = useState(true);
  const [creneauxEnCours, setCreneauxEnCours] = useState(false);
  const [erreurCreneaux, setErreurCreneaux] = useState<string | null>(null);
  const [creneau, setCreneau] = useState<Creneau | null>(null);
  const [autreHeureDepliee, setAutreHeureDepliee] = useState(false);
  const [autreHeure, setAutreHeure] = useState('');

  const jours = useMemo(() => {
    const base = midiLocal(jourDepart);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        date: dateCivile(d),
        semaine: d.toLocaleDateString('fr-CA', { weekday: 'short' }).replace('.', ''),
        numero: String(d.getDate()),
      };
    });
  }, [jourDepart]);

  /* --- Étape 4 : confirmer ------------------------------------------- */
  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [paiement, setPaiement] = useState<'CASH' | 'STRIPE_LINK' | 'INTERAC'>('CASH');
  const [notesDepliees, setNotesDepliees] = useState(false);
  const [notes, setNotes] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const envoiRef = useRef(false); // verrou immédiat : un double tap ne passe pas
  const [erreur, setErreur] = useState<string | null>(null);
  const [avertissementAgenda, setAvertissementAgenda] = useState<string | null>(null);
  /** Adresse refusée par la route (déjà prise par une autre fiche) : à corriger sur place. */
  const [courrielRefuse, setCourrielRefuse] = useState<string | null>(null);

  /* --- Remise à zéro à chaque ouverture ------------------------------ */
  useEffect(() => {
    if (!ouverte) return;
    setEtape(1);
    setRecherche(''); setResultats([]); setRechercheEnCours(false);
    setNouvelleDepliee(false);
    setNvPrenom(''); setNvNom(''); setNvTelephone(''); setNvCourriel(''); setErreurNouvelle(null);
    // Une réouverture est une nouvelle personne : la saisie repart avec une identité neuve.
    setNumeroSaisie((n) => n + 1);
    setCliente(null);
    setSoin(null); setTousLesSoins(false);
    setJour(dateInitiale && ecartEnJours(jourDepart, dateInitiale) >= 0 && ecartEnJours(jourDepart, dateInitiale) <= 13
      ? dateInitiale
      : jourDepart);
    setCreneaux([]); setAgendaConsulte(true); setErreurCreneaux(null); setCreneau(null);
    setAutreHeureDepliee(false); setAutreHeure('');
    setMode('IN_PERSON'); setPaiement('CASH');
    setNotesDepliees(false); setNotes('');
    setErreur(null); setAvertissementAgenda(null); setCourrielRefuse(null);
    envoiRef.current = false; setEnvoi(false);
  }, [ouverte, jourDepart, dateInitiale]);

  /* --- La page derrière ne défile pas sous la feuille ---------------- */
  useEffect(() => {
    if (!ouverte) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = precedent; };
  }, [ouverte]);

  /* --- Recherche de clientes, débouncée à 300 ms --------------------- */
  useEffect(() => {
    const q = recherche.trim();
    if (q.length < 2) {
      setResultats([]);
      setRechercheEnCours(false);
      return;
    }
    setRechercheEnCours(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          const j = await res.json();
          setResultats(j.clients ?? []);
        } else {
          setResultats([]);
        }
      } catch {
        // La recherche est un confort : son échec ne bloque pas la saisie manuelle.
        if (!ctrl.signal.aborted) setResultats([]);
      } finally {
        if (!ctrl.signal.aborted) setRechercheEnCours(false);
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [recherche]);

  /* --- Créneaux du jour choisi --------------------------------------- */
  useEffect(() => {
    if (!ouverte || etape !== 3 || !soin || !jour) return;
    const ctrl = new AbortController();
    setCreneauxEnCours(true);
    setErreurCreneaux(null);
    (async () => {
      try {
        const url = `/api/admin/agenda/creneaux?practitionerId=${encodeURIComponent(practitionerId)}`
          + `&date=${encodeURIComponent(jour)}&offeringId=${encodeURIComponent(soin.id)}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const j = await res.json().catch(() => ({}));
        if (ctrl.signal.aborted) return;
        if (!res.ok) {
          setCreneaux([]);
          // Le bandeau « agenda Google injoignable » parlait du chargement
          // précédent : sans créneaux affichés, il n'a plus de sujet.
          setAgendaConsulte(true);
          setErreurCreneaux(j.error ?? 'Impossible de charger les disponibilités.');
          return;
        }
        setCreneaux(j.creneaux ?? []);
        setAgendaConsulte(j.agendaGoogleConsulte !== false);
      } catch {
        if (ctrl.signal.aborted) return;
        setCreneaux([]);
        setAgendaConsulte(true);
        setErreurCreneaux('Impossible de charger les disponibilités. Vérifie ta connexion.');
      } finally {
        if (!ctrl.signal.aborted) setCreneauxEnCours(false);
      }
    })();
    return () => ctrl.abort();
  }, [ouverte, etape, soin, jour, practitionerId]);

  /* --- Ce qu'il manque avant de pouvoir envoyer ----------------------
   * Un seul calcul sert à la fois de message affiché et de raison de bloquer
   * le bouton : l'avertissement et l'inertie du bouton ne peuvent donc jamais
   * se contredire. Pas de message → rien ne bloque, et réciproquement.
   */
  const courrielUtile = paiement !== 'CASH'; // comptant : la route n'exige aucun courriel
  const courrielSaisi = (cliente?.email ?? '').trim();

  /** Message expliquant ce qui manque côté courriel, ou null si rien ne manque. */
  const messageCourriel: string | null = !courrielUtile
    ? null
    : !/\S+@\S+/.test(courrielSaisi)
      ? 'Un courriel est nécessaire pour ce mode de paiement.'
      : courrielRefuse !== null && courrielSaisi.toLowerCase() === courrielRefuse
        // Elle a resoumis l'adresse déjà prise par une autre fiche : refus certain.
        ? 'Corrige le courriel : celui-ci appartient à une autre fiche.'
        : null;

  const telephoneManquant = !(cliente?.phone ?? '').trim();
  const complementRequis = telephoneManquant || messageCourriel !== null;

  /**
   * Le champ courriel reste monté tant qu'une correction est en cours, même
   * quand plus rien ne bloque : sans cela il disparaîtrait sous ses doigts à
   * la première lettre corrigée. Un champ n'affirme rien — seul le message
   * ci-dessus avertit, et lui suit strictement le blocage.
   */
  const champCourrielAffiche = messageCourriel !== null || (courrielUtile && courrielRefuse !== null);

  const fermer = useCallback(() => {
    if (envoiRef.current) return; // pas de fermeture au milieu d'un envoi
    onFermer();
  }, [onFermer]);

  function retour() {
    if (envoiRef.current) return; // un envoi est en cours : on ne bouge pas
    setErreur(null);
    setAvertissementAgenda(null);
    if (etape === 1) { fermer(); return; }
    setEtape((e) => (e - 1) as 1 | 2 | 3 | 4);
  }

  /**
   * Retenir une personne pour ce rendez-vous.
   *
   * Une seule question est posée, et elle porte sur `cle` : est-ce la MÊME
   * personne que celle déjà retenue ? On ne cherche plus à deviner l'identité à
   * partir du nom ou du téléphone — ce sont les champs qu'elle revient corriger,
   * aucun critère fondé dessus ne peut tenir.
   *
   * Personne différente → on jette tout ce qui parlait de la précédente : la
   * note (un texte clinique ne doit jamais franchir la frontière entre deux
   * personnes, encore moins partir dans l'événement Google de quelqu'un d'autre)
   * et les états capables de bloquer un bouton ou d'afficher un avertissement
   * mensonger (adresse refusée, avertissement d'agenda, message d'erreur).
   *
   * Même personne (re-tap sur la même fiche, ou correction de la saisie en
   * cours) → on ne jette rien : ni le texte écrit, ni le garde-fou de l'adresse
   * refusée, qui vaut toujours puisque l'adresse appartient toujours à une autre
   * fiche.
   */
  function retenirPersonne(personne: ClienteRetenue) {
    const memePersonne = cliente !== null && cliente.cle === personne.cle;
    if (!memePersonne) {
      setCourrielRefuse(null);
      setAvertissementAgenda(null);
      setErreur(null);
      setNotes('');
      setNotesDepliees(false);
    }
    setCliente(personne);
    setRecherche('');
    setResultats([]);
    setEtape(2);
  }

  /** Une fiche déjà en base : son identifiant EST son identité. */
  function choisirFiche(c: Cliente) {
    retenirPersonne({
      cle: `fiche:${c.id}`,
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? '',
      phone: c.phone ?? '',
    });
  }

  /**
   * Démarrer une saisie manuelle pour une AUTRE personne : le formulaire repart
   * vide et change d'identité. C'est le seul geste qui fait d'une saisie manuelle
   * une nouvelle personne — tout le reste est une correction de celle en cours.
   */
  function demarrerNouvelleSaisie() {
    setNumeroSaisie((n) => n + 1);
    setNvPrenom(''); setNvNom(''); setNvTelephone(''); setNvCourriel('');
    setErreurNouvelle(null);
    setNouvelleDepliee(true);
  }

  /**
   * « Continuer » du formulaire de saisie. Il porte la clé de la saisie en cours :
   * re-soumettre après avoir corrigé une coquille redonne la même clé, donc rien
   * n'est effacé ; après « + Nouvelle cliente » la clé a changé, donc c'est bien
   * un changement de personne.
   */
  function validerNouvelleCliente() {
    if (!nvPrenom.trim() || !nvNom.trim() || !nvTelephone.trim()) {
      setErreurNouvelle('Prénom, nom et téléphone sont nécessaires.');
      return;
    }
    setErreurNouvelle(null);
    retenirPersonne({
      cle: cleSaisie,
      id: null,
      firstName: nvPrenom.trim(),
      lastName: nvNom.trim(),
      email: nvCourriel.trim(),
      phone: nvTelephone.trim(),
    });
  }

  function choisirSoin(s: Soin) {
    // Changer de soin change la durée : les créneaux affichés ne valent plus,
    // et l'avertissement comme l'erreur portaient sur l'ancienne plage horaire.
    if (soin?.id !== s.id) {
      setCreneau(null);
      setCreneaux([]);
      setAvertissementAgenda(null);
      setErreur(null);
    }
    setSoin(s);
    setEtape(3);
  }

  function choisirJour(date: string) {
    if (date === jour) return;
    setJour(date);
    setCreneau(null);
    setAutreHeure('');
    // « Ce créneau chevauche… » ou « ce créneau vient d'être pris » ne parlaient
    // que du jour qu'elle quitte.
    setAvertissementAgenda(null);
    setErreur(null);
  }

  function choisirCreneau(c: Creneau) {
    setCreneau(c);
    setErreur(null);
    setAvertissementAgenda(null);
    setEtape(4);
  }

  /** « Autre heure » : hors des disponibilités déclarées, pour les exceptions. */
  function validerAutreHeure() {
    if (!autreHeure) return;
    const instant = new Date(autreHeure); // valeur d'un datetime-local = heure locale du téléphone
    if (Number.isNaN(instant.getTime())) return;
    choisirCreneau({
      debut: autreHeure.slice(11, 16),
      debutIso: instant.toISOString(),
      disponible: true,
    });
  }

  /* --- Création ------------------------------------------------------ */
  async function envoyer(forcerMalgreAgenda: boolean) {
    if (envoiRef.current) return;
    if (!cliente || !soin || !creneau || complementRequis) return;
    envoiRef.current = true;
    setEnvoi(true);
    setErreur(null);
    setAvertissementAgenda(null);
    try {
      const res = await fetch('/api/holistique/appointments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practitionerId,
          // Cliente déjà en base (recherche ou dernières clientes) : on désigne SON
          // compte. Sans cela, la route ne déduplique que par courriel — ajouter un
          // courriel à une cliente qui n'en avait pas créerait une seconde fiche.
          // Cliente saisie à la main : pas d'identifiant, la route la crée comme avant.
          ...(cliente.id ? { clientId: cliente.id } : {}),
          client: {
            firstName: cliente.firstName,
            lastName: cliente.lastName,
            phone: cliente.phone.trim(),
            email: cliente.email.trim() || undefined,
          },
          offeringId: soin.id,
          startsAt: creneau.debutIso, // l'instant du serveur, tel quel
          mode,
          paymentMode: paiement,
          notes: notes.trim() || undefined,
          ...(forcerMalgreAgenda ? { forcerMalgreAgenda: true } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && data.code === 'AGENDA_PERSONNEL') {
          // Avertissement, pas un refus : elle seule sait si l'événement se déplace.
          setAvertissementAgenda(data.etiquette ?? 'Événement personnel');
          return;
        }
        if (res.status === 409 && data.code === 'COURRIEL_DEJA_UTILISE') {
          // Le courriel saisi appartient à une autre fiche : rien à voir avec l'heure,
          // on reste à l'étape 4 pour qu'elle corrige l'adresse sur place. Le champ
          // réapparaît et « Créer » reste inerte tant que l'adresse n'a pas changé.
          setErreur(data.error ?? 'Ce courriel appartient déjà à une autre fiche.');
          setCourrielRefuse(cliente.email.trim().toLowerCase());
          return;
        }
        setErreur(data.error ?? 'Une erreur est survenue.');
        // Créneau pris entre-temps : on retourne au choix de l'heure, cliente et soin conservés.
        if (res.status === 409) { setCreneau(null); setEtape(3); }
        return;
      }
      onCree();
      onFermer();
    } catch {
      setErreur('Impossible de joindre le serveur. Vérifie ta connexion et réessaie.');
    } finally {
      envoiRef.current = false;
      setEnvoi(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Rendu                                                             */
  /* ---------------------------------------------------------------- */

  const titres: Record<number, string> = {
    1: 'Pour qui ?',
    2: 'Quel soin ?',
    3: 'Quand ?',
    4: 'On confirme ?',
  };

  const soinsVisibles = tousLesSoins ? offerings : offerings.slice(0, 5);

  return (
    <>
      {/* Voile */}
      <div
        onClick={fermer}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          opacity: ouverte ? 1 : 0,
          pointerEvents: ouverte ? 'auto' : 'none',
          transition: 'opacity 220ms ease',
          zIndex: 50,
        }}
      />

      {/* La feuille */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nouveau rendez-vous"
        aria-hidden={!ouverte}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#fff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          transform: ouverte ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 260ms ease',
          visibility: ouverte ? 'visible' : 'hidden',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
        }}
      >
        {/* En-tête : retour, titre, points de progression */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            padding: '10px 16px 12px',
            borderBottom: `1px solid ${BORDURE}`,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={retour}
              aria-label={etape === 1 ? 'Fermer' : 'Étape précédente'}
              style={{
                ...TAPABLE,
                minWidth: '44px',
                background: 'none',
                border: 'none',
                color: GRIS,
                fontSize: '1.4rem',
                lineHeight: 1,
              }}
            >
              {etape === 1 ? '✕' : '‹'}
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ ...titreEtape, margin: 0 }}>{titres[etape]}</h2>
            </div>
            <div style={{ display: 'flex', gap: '6px', paddingRight: '4px' }} aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: n === etape ? VIOLET : n < etape ? OR : BORDURE,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          {/* ---------------------------------------------------------- */}
          {/* Étape 1 — la cliente                                        */}
          {/* ---------------------------------------------------------- */}
          {etape === 1 && (
            <div>
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Chercher une cliente (nom, courriel, téléphone)"
                style={{ ...champ, marginBottom: '12px' }}
              />

              {recherche.trim().length >= 2 ? (
                <div>
                  {rechercheEnCours && resultats.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: GRIS_CLAIR, margin: '0 0 10px' }}>Recherche…</p>
                  )}
                  {!rechercheEnCours && resultats.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: GRIS, margin: '0 0 10px' }}>
                      Aucune cliente trouvée. Utilise « Nouvelle cliente » plus bas.
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {resultats.map((c) => (
                      <button key={c.id} type="button" onClick={() => choisirFiche(c)} style={carte(false)}>
                        <strong>{c.firstName} {c.lastName}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: GRIS }}>
                          {c.phone || 'sans téléphone'}{c.email ? ` · ${c.email}` : ' · sans courriel'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ ...sousTitre, margin: '0 0 8px' }}>Dernières clientes</p>
                  {clientesRecentes.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: GRIS, margin: '0 0 10px' }}>
                      Aucune cliente récente. Cherche par nom ou crée une nouvelle fiche.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {clientesRecentes.map((c) => (
                        <button key={c.id} type="button" onClick={() => choisirFiche(c)} style={carte(false)}>
                          <strong>{c.firstName} {c.lastName}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: GRIS }}>
                            {c.phone || 'sans téléphone'}{c.email ? ` · ${c.email}` : ' · sans courriel'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '16px', borderTop: `1px solid ${BORDURE}`, paddingTop: '8px' }}>
                {/* Ce bouton ouvre et referme, rien de plus : rouvrir un panneau ne
                    jette jamais son contenu. Le seul chemin destructeur est le lien
                    ci-dessous, dont l'intitulé annonce ce qu'il efface. Le libellé dit
                    lequel des deux gestes il déclenche — reprendre, ou commencer. */}
                <button
                  type="button"
                  onClick={() => setNouvelleDepliee((v) => !v)}
                  style={{
                    ...TAPABLE,
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 4px',
                    background: 'none',
                    border: 'none',
                    color: VIOLET,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  {nouvelleDepliee
                    ? '− Masquer la saisie'
                    : saisieRetenue && cliente
                      ? `Reprendre la saisie : ${cliente.firstName} ${cliente.lastName}`
                      : '+ Nouvelle cliente'}
                </button>

                {/* Chemin destructeur, exemplaire pour le panneau REPLIÉ. Un second
                    exemplaire, sous le même intitulé, se trouve plus bas dans le
                    formulaire déplié (juste après « Continuer ») pour l'état ouvert.
                    À eux deux, ce geste est disponible dans les deux états du
                    panneau — c'est le seul qui vide les champs et change de
                    personne. */}
                {!nouvelleDepliee && saisieRetenue && (
                  <button
                    type="button"
                    onClick={demarrerNouvelleSaisie}
                    style={{ ...lienDiscret, display: 'flex', width: '100%', textAlign: 'left' }}
                  >
                    Effacer et saisir une autre personne
                  </button>
                )}

                {nouvelleDepliee && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                    <p style={{ fontSize: '0.8rem', color: GRIS, margin: 0 }}>
                      {saisieRetenue
                        ? 'Tu corriges la saisie en cours : rien de ce qui est déjà écrit n’est perdu.'
                        : 'Cliente qui n’a pas encore de fiche.'}
                    </p>
                    <label>
                      <span style={etiquetteChamp}>Prénom</span>
                      <input value={nvPrenom} onChange={(e) => setNvPrenom(e.target.value)} style={champ} />
                    </label>
                    <label>
                      <span style={etiquetteChamp}>Nom</span>
                      <input value={nvNom} onChange={(e) => setNvNom(e.target.value)} style={champ} />
                    </label>
                    <label>
                      <span style={etiquetteChamp}>Téléphone</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={nvTelephone}
                        onChange={(e) => setNvTelephone(e.target.value)}
                        style={champ}
                      />
                    </label>
                    <label>
                      <span style={etiquetteChamp}>Courriel — optionnel si paiement comptant</span>
                      <input
                        type="email"
                        inputMode="email"
                        value={nvCourriel}
                        onChange={(e) => setNvCourriel(e.target.value)}
                        style={champ}
                      />
                    </label>
                    {erreurNouvelle && (
                      <p style={{ color: ROUGE, fontSize: '0.85rem', margin: 0 }}>{erreurNouvelle}</p>
                    )}
                    <button
                      type="button"
                      onClick={validerNouvelleCliente}
                      style={{
                        ...TAPABLE,
                        width: '100%',
                        padding: '13px',
                        borderRadius: '10px',
                        border: 'none',
                        background: VIOLET,
                        color: '#fff',
                        fontSize: '1rem',
                      }}
                    >
                      Continuer
                    </button>

                    {/* Chemin destructeur, exemplaire pour le panneau DÉPLIÉ — voir le
                        jumeau plus haut, avant le formulaire, pour l'état replié. Le
                        geste qui dit « ce n'est plus la même personne » : le
                        formulaire repart vide, et la note écrite pour la précédente
                        ne la suivra pas. */}
                    {saisieRetenue && (
                      <button
                        type="button"
                        onClick={demarrerNouvelleSaisie}
                        style={{ ...lienDiscret, display: 'flex', width: '100%', textAlign: 'left' }}
                      >
                        Effacer et saisir une autre personne
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Étape 2 — le soin                                           */}
          {/* ---------------------------------------------------------- */}
          {etape === 2 && (
            <div>
              <p style={sousTitre}>
                {cliente ? `${cliente.firstName} ${cliente.lastName}` : ''}
              </p>
              {offerings.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: GRIS }}>Aucun soin actif pour {practitionerNom}.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {soinsVisibles.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => choisirSoin(s)}
                      style={carte(soin?.id === s.id)}
                    >
                      <strong>{s.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: GRIS }}>
                        {s.durationMinutes} min · {s.price.toFixed(2)} $
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {offerings.length > 5 && (
                <button type="button" onClick={() => setTousLesSoins((v) => !v)} style={lienDiscret}>
                  {tousLesSoins ? 'Voir moins' : 'Tous les soins'}
                </button>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Étape 3 — le moment                                         */}
          {/* ---------------------------------------------------------- */}
          {etape === 3 && (
            <div>
              <p style={sousTitre}>
                {cliente ? `${cliente.firstName} ${cliente.lastName}` : ''}
                {soin ? ` · ${soin.name} (${soin.durationMinutes} min)` : ''}
              </p>

              {/* Refus de la création renvoyé ici (créneau pris entre-temps, date invalide…) */}
              {erreur && (
                <p
                  style={{
                    color: ROUGE,
                    fontSize: '0.88rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    margin: '0 0 12px',
                  }}
                >
                  {erreur}
                </p>
              )}

              {/* Rangée des 14 jours */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {jours.map((j) => {
                  const actif = j.date === jour;
                  return (
                    <button
                      key={j.date}
                      type="button"
                      onClick={() => choisirJour(j.date)}
                      aria-pressed={actif}
                      style={{
                        ...TAPABLE,
                        flex: '0 0 auto',
                        width: '52px',
                        minHeight: '58px',
                        padding: '6px 0',
                        borderRadius: '10px',
                        border: `2px solid ${actif ? VIOLET : BORDURE}`,
                        background: actif ? VIOLET : '#fff',
                        color: actif ? '#fff' : TITRE,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>{j.semaine}</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{j.numero}</span>
                    </button>
                  );
                })}
              </div>

              {!agendaConsulte && (
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: '#92400E',
                    background: 'rgba(201,168,76,0.15)',
                    border: `1px solid ${OR}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    margin: '10px 0 0',
                  }}
                >
                  Impossible de vérifier ton agenda Google en ce moment.
                </p>
              )}

              {erreurCreneaux && (
                <p style={{ color: ROUGE, fontSize: '0.85rem', margin: '12px 0 0' }}>{erreurCreneaux}</p>
              )}

              {creneauxEnCours ? (
                <p style={{ fontSize: '0.9rem', color: GRIS_CLAIR, margin: '16px 0' }}>Chargement des heures…</p>
              ) : (
                <>
                  {creneaux.length === 0 && !erreurCreneaux && (
                    <p style={{ fontSize: '0.9rem', color: GRIS, margin: '16px 0 0' }}>
                      Aucune disponibilité ce jour-là.
                    </p>
                  )}
                  {creneaux.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
                        gap: '8px',
                        marginTop: '14px',
                      }}
                    >
                      {creneaux.map((c) => {
                        const perso = c.disponible && c.motif === 'AGENDA_PERSONNEL';
                        return (
                          <button
                            key={c.debutIso}
                            type="button"
                            disabled={!c.disponible}
                            onClick={() => c.disponible && choisirCreneau(c)}
                            title={perso ? c.etiquette : undefined}
                            style={{
                              minHeight: '48px',
                              padding: '8px 6px',
                              borderRadius: '10px',
                              border: `2px solid ${perso ? OR : c.disponible ? BORDURE : '#F3F4F6'}`,
                              background: c.disponible ? '#fff' : '#F9FAFB',
                              color: c.disponible ? TITRE : GRIS_CLAIR,
                              cursor: c.disponible ? 'pointer' : 'not-allowed',
                              fontSize: '1rem',
                              fontWeight: 600,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px',
                            }}
                          >
                            <span>{perso ? `⚠ ${c.debut}` : c.debut}</span>
                            {perso && (
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 400,
                                  color: GRIS,
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {c.etiquette}
                              </span>
                            )}
                            {!c.disponible && (
                              <span style={{ fontSize: '0.62rem', fontWeight: 400 }}>pris</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Exception : une heure hors des disponibilités déclarées */}
              <div style={{ marginTop: '14px' }}>
                <button type="button" onClick={() => setAutreHeureDepliee((v) => !v)} style={lienDiscret}>
                  {autreHeureDepliee ? 'Masquer' : 'Autre heure'}
                </button>
                {autreHeureDepliee && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                    <input
                      type="datetime-local"
                      value={autreHeure}
                      onChange={(e) => setAutreHeure(e.target.value)}
                      style={champ}
                    />
                    <button
                      type="button"
                      onClick={validerAutreHeure}
                      disabled={!autreHeure}
                      style={{
                        ...TAPABLE,
                        width: '100%',
                        padding: '13px',
                        borderRadius: '10px',
                        border: 'none',
                        background: autreHeure ? VIOLET : BORDURE,
                        color: autreHeure ? '#fff' : GRIS_CLAIR,
                        fontSize: '1rem',
                        cursor: autreHeure ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Utiliser cette heure
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Étape 4 — confirmer                                         */}
          {/* ---------------------------------------------------------- */}
          {etape === 4 && cliente && soin && creneau && (
            <div>
              {/* Récapitulatif */}
              <div
                style={{
                  border: `1px solid ${BORDURE}`,
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <p style={{ margin: '0 0 6px', fontSize: '1.05rem', color: TITRE, fontWeight: 600 }}>
                  {cliente.firstName} {cliente.lastName}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#1F2937' }}>
                  {soin.name} · {soin.durationMinutes} min · {soin.price.toFixed(2)} $
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1F2937' }}>
                  {jourEnToutesLettres(jour)} à {creneau.debut} — avec {practitionerNom}
                </p>
                {creneau.motif === 'AGENDA_PERSONNEL' && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#92400E' }}>
                    ⚠ Chevauche « {creneau.etiquette} » dans ton agenda Google.
                  </p>
                )}
              </div>

              {/* Mode */}
              <p style={etiquetteChamp}>Mode</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {([
                  ['IN_PERSON', 'Présentiel'],
                  ['VIRTUAL', 'En ligne'],
                ] as const).map(([valeur, libelle]) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setMode(valeur)}
                    aria-pressed={mode === valeur}
                    style={{ ...carte(mode === valeur), flex: 1, textAlign: 'center', padding: '13px 8px' }}
                  >
                    {libelle}
                  </button>
                ))}
              </div>

              {/* Paiement */}
              <p style={etiquetteChamp}>Paiement</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {([
                  ['CASH', 'Comptant'],
                  ['INTERAC', 'Interac'],
                  ['STRIPE_LINK', 'Lien Stripe'],
                ] as const).map(([valeur, libelle]) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setPaiement(valeur)}
                    aria-pressed={paiement === valeur}
                    style={{
                      ...carte(paiement === valeur),
                      flex: 1,
                      textAlign: 'center',
                      padding: '13px 4px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {libelle}
                  </button>
                ))}
              </div>

              {/* Ce qu'il manque pour que la route accepte : demandé ICI, sans rien reprendre */}
              {(complementRequis || champCourrielAffiche) && (
                <div
                  style={{
                    border: `1px solid ${OR}`,
                    background: 'rgba(201,168,76,0.12)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {champCourrielAffiche && (
                    <label>
                      {/* Un avertissement uniquement quand quelque chose bloque
                          vraiment ; sinon une étiquette neutre. */}
                      <span
                        style={{
                          ...etiquetteChamp,
                          color: messageCourriel !== null ? '#92400E' : GRIS,
                        }}
                      >
                        {messageCourriel ?? 'Courriel de la cliente'}
                      </span>
                      <input
                        type="email"
                        inputMode="email"
                        value={cliente.email}
                        onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                        placeholder="courriel de la cliente"
                        style={champ}
                      />
                    </label>
                  )}
                  {telephoneManquant && (
                    <label>
                      <span style={{ ...etiquetteChamp, color: '#92400E' }}>
                        Le téléphone de la cliente est nécessaire.
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={cliente.phone}
                        onChange={(e) => setCliente({ ...cliente, phone: e.target.value })}
                        placeholder="téléphone"
                        style={champ}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Notes, repliées */}
              <button type="button" onClick={() => setNotesDepliees((v) => !v)} style={lienDiscret}>
                {notesDepliees ? 'Masquer les notes' : 'Ajouter une note'}
              </button>
              {notesDepliees && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ ...champ, minHeight: '72px', marginTop: '6px' }}
                />
              )}

              {/* Avertissement d'agenda personnel : on propose de passer outre */}
              {avertissementAgenda && (
                <div
                  style={{
                    border: `1px solid ${OR}`,
                    background: 'rgba(201,168,76,0.12)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginTop: '14px',
                  }}
                >
                  <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: '#92400E' }}>
                    Cette heure chevauche « {avertissementAgenda} » dans ton agenda Google.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setAvertissementAgenda(null); setCreneau(null); setEtape(3); }}
                      style={{ ...carte(false), textAlign: 'center' }}
                    >
                      Choisir une autre heure
                    </button>
                    {/* Même garde que « Créer » : sans elle, changer de paiement
                        pendant l'avertissement rendrait ce bouton silencieux
                        (l'envoi refuse, mais rien ne l'expliquerait). */}
                    <button
                      type="button"
                      onClick={() => envoyer(true)}
                      disabled={envoi || complementRequis}
                      style={{
                        ...TAPABLE,
                        width: '100%',
                        padding: '13px',
                        borderRadius: '10px',
                        border: 'none',
                        background: envoi || complementRequis ? BORDURE : VIOLET,
                        color: envoi || complementRequis ? GRIS_CLAIR : '#fff',
                        fontSize: '0.95rem',
                        cursor: envoi || complementRequis ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {envoi ? 'Création…' : 'Réserver quand même'}
                    </button>
                  </div>
                </div>
              )}

              {erreur && (
                <p style={{ color: ROUGE, fontSize: '0.88rem', margin: '14px 0 0' }}>{erreur}</p>
              )}

              {!avertissementAgenda && (
                <button
                  type="button"
                  onClick={() => envoyer(false)}
                  disabled={envoi || complementRequis}
                  style={{
                    ...TAPABLE,
                    width: '100%',
                    marginTop: '18px',
                    padding: '15px',
                    borderRadius: '12px',
                    border: 'none',
                    background: envoi || complementRequis ? BORDURE : VIOLET,
                    color: envoi || complementRequis ? GRIS_CLAIR : '#fff',
                    fontSize: '1.05rem',
                    fontFamily: CINZEL,
                    cursor: envoi || complementRequis ? 'not-allowed' : 'pointer',
                  }}
                >
                  {envoi ? 'Création…' : 'Créer le rendez-vous'}
                </button>
              )}
            </div>
          )}

          {/* Sécurité : l'étape 4 sans sélection complète ne peut pas s'afficher */}
          {etape === 4 && !(cliente && soin && creneau) && (
            <p style={{ fontSize: '0.9rem', color: GRIS }}>
              Il manque un élément. Reviens en arrière pour le choisir.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
