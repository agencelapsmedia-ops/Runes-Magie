# Agenda mobile — devis de conception

**Date** : 2026-08-06
**Demandeur** : Jonathan (Laps Media), pour Noctura (Annabelle Dionne)
**Besoin exprimé** : que Noctura puisse créer un rendez-vous client depuis son téléphone,
simplement. Elle travaille à **90 % sur mobile**.

---

## 1. Le constat

### L'administration est inutilisable sur un téléphone

```
src/app/admin/layout.tsx:82    <aside className="fixed ... w-64">   menu de 256 px, jamais rétracté
src/app/admin/layout.tsx:141   <main className="ml-64 p-8">         256 px de marge + 32 px de chaque côté
```

Sur un écran de 390 px : `390 − 256 − 64 = 70 px` de contenu utilisable.

Aucun fichier de `src/app/admin/` ne contient de media query, de `matchMedia` ni de test de
largeur. L'administration a été conçue pour un écran d'ordinateur, exclusivement.

Le calendrier s'ouvre par défaut en `timeGridWeek` — sept colonnes horaires sur un téléphone.

### Ce qui existe déjà et fonctionne

- **`ManualAppointmentButton`** : formulaire de création de rendez-vous, présent à trois
  endroits (calendrier admin, consultations, tableau de bord praticienne). Dix champs empilés
  dans une fenêtre modale.
- **`/api/holistique/appointments/manual`** : la route de création. Elle gère déjà les
  conflits, la vérification Google Agenda, la création de la fiche cliente, l'événement
  Google et le courriel de mot de passe. Chaque étape est protégée par son propre `try/catch`.
- **`getBusyPeriods`** (`src/lib/google-calendar.ts:287`) : interroge l'API *freebusy* de
  Google. Le Google Agenda de Noctura **est connecté** (annabelledionne@gmail.com).

**Le plus risqué est donc déjà construit.** Ce devis n'ajoute que ce qui manque.

---

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Périmètre | **L'administration mobile d'abord**. Les anomalies de configuration relevées à l'audit sont documentées au §9, à corriger par le client. |
| Situations d'usage | **Les quatre** : au comptoir, au téléphone avec la cliente, plus tard au calme, et depuis une conversation par message. |
| Praticienne | **Noctura pour elle-même** presque toujours → champ pré-rempli, changement possible mais hors du chemin principal. |
| Choix de l'heure | **Proposer les créneaux réellement libres**, avec une porte de sortie « autre heure » pour les exceptions. |
| Conflit avec un rendez-vous client | **Bloquer**, sans exception. |
| Conflit avec un événement personnel Google | **Avertir en nommant l'événement**, et laisser passer. |

---

## 3. Hors périmètre

- Réécriture de la page publique de réservation (`/soins/reserver/[practitionerId]`) — elle
  encaisse les paiements, elle fonctionne, le risque ne se justifie pas. Voir §8.
- Correction des disponibilités de Bohemia et Eiraween — documenté au §9, à faire dans
  l'administration existante.
- Clôture automatique des rendez-vous passés — documenté au §9.
- Modification de l'horaire de Noctura.
- Rendre adaptatives les pages admin autres que l'agenda : la coquille les débloque toutes,
  mais leur mise en page interne n'est pas retravaillée ici.
- Toute infrastructure de tests automatisés.

---

## 4. Architecture

Trois pièces indépendantes, chacune utile seule :

| Pièce | Ce qu'elle apporte | Bénéficie à |
|---|---|---|
| **A. Coquille adaptative** | Le menu se rétracte sous 1024 px | **Toutes** les pages admin |
| **B. Agenda mobile** | Vue liste du jour, bouton + au pouce | L'agenda |
| **C. Créneaux libres** | API serveur des heures disponibles | La création, et la page publique plus tard |

L'ordre de construction est A → C → B : la coquille débloque tout, l'API alimente l'interface.

---

## 5. Pièce A — la coquille adaptative

**Fichier** : `src/app/admin/layout.tsx` (unique fichier modifié).

Sous 1024 px de large :
- Le menu latéral sort du flux et devient un panneau glissant depuis la gauche.
- Une barre supérieure fixe apparaît : bouton hamburger, titre de la page courante.
- Le contenu passe en pleine largeur (`ml-0`), avec un rembourrage réduit (`p-4` au lieu de `p-8`).

Au-dessus de 1024 px, **le comportement actuel est strictement conservé**.

Le motif existe déjà dans le projet : `src/components/layout/MobileMenu.tsx` fait exactement
cela pour la navigation publique. On le reproduit, on n'invente rien.

**Exigences d'ergonomie tactile :**
- Zones tapables d'au moins 44 × 44 px.
- Le panneau se ferme en tapant l'arrière-plan, pas seulement le bouton de fermeture.
- Le panneau se ferme automatiquement à la navigation.
- Aucun `alert()` ni `confirm()` ajouté.

---

## 6. Pièce B — l'agenda et la création

### 6.1 La vue agenda

`src/app/admin/calendrier/CalendrierClient.tsx`.

- Sur téléphone : vue **liste du jour** par défaut (`listDay`, plugin `@fullcalendar/list`),
  avec des lignes assez hautes pour être lues et tapées.
- Trois onglets : **Jour · Semaine · Mois**. Sur ordinateur, la semaine reste par défaut.
- Un bouton **+** flottant, ancré en bas à droite, hors du flux de défilement.
- Le filtre par praticienne se replie sur téléphone : Noctura seule par défaut.

### 6.2 La feuille de création

Nouveau composant, en feuille montant du bas (*bottom sheet*), quatre temps.

**1 — Qui ?**
Champ de recherche (nom, courriel, téléphone) alimenté par la recherche existante, plus
**les dernières clientes de Noctura** en gros boutons. Un tap suffit pour une habituée.
Si la personne est nouvelle : prénom, nom, téléphone.
**Le courriel devient optionnel** : au comptoir il n'est pas toujours disponible, et bloquer
dessus fait perdre le rendez-vous. Le compte client est alors créé sans courriel routable,
selon le mécanisme déjà en place (`isInternalEmail`, `src/lib/holistic-clients.ts`).

**2 — Quoi ?**
Les soins actifs, **les plus fréquemment réservés en tête**, en boutons portant le nom, la
durée et le prix. Les autres derrière « tous les soins ». La fréquence est calculée depuis
les rendez-vous passés de la praticienne.

**3 — Quand ?**
Une rangée de jours tapables, puis les **créneaux réellement libres** en gros boutons (§7).
Un lien « autre heure » ouvre une saisie libre, pour les exceptions.

**4 — Confirmer.**
Récapitulatif lisible, mode (présentiel / en ligne), paiement (comptant / Interac / lien
Stripe), notes repliées, et un bouton unique.

**Valeurs par défaut** : praticienne = Noctura, mode = présentiel, paiement = comptant,
jour = aujourd'hui. Dans le cas courant — cliente connue, soin habituel — l'objectif est
**quatre taps**.

L'envoi appelle `/api/holistique/appointments/manual`, **inchangée**.

---

## 7. Pièce C — le calcul des créneaux

**Nouveau module** : `src/lib/creneaux.ts`, côté serveur.
**Nouvelle route** : `GET /api/admin/agenda/creneaux?practitionerId=&date=&offeringId=`,
protégée par `requireAdmin()`.

Entrées combinées :
1. Les disponibilités de la praticienne (`HolisticAvailability`, récurrentes et ponctuelles).
2. Ses rendez-vous existants ce jour-là (statuts `PENDING` et `CONFIRMED`).
3. Les périodes occupées de son Google Agenda (`getBusyPeriods`).

Sortie : une liste de créneaux, chacun portant son heure de début, sa disponibilité, et le
motif d'indisponibilité le cas échéant :

```ts
interface Creneau {
  debut: string;              // "13:15"
  disponible: boolean;
  motif?: 'RENDEZ_VOUS' | 'AGENDA_PERSONNEL';
  etiquette?: string;         // nom de l'événement Google, pour l'avertissement
}
```

**Pourquoi côté serveur** : ce calcul n'existe aujourd'hui que dans la page publique de
réservation, **en JavaScript de navigateur**, mêlé à plus de mille lignes
(`generateTimeSlots`, `isAvailableOnDay`). Le refaire côté admin serait une duplication.
Le placer au serveur allège aussi le téléphone.

---

## 8. Les conflits

| Situation | Comportement | Justification |
|---|---|---|
| Chevauche un rendez-vous client | **Refus.** Le créneau n'est pas proposé, et la route refuse même en saisie libre. | Deux clientes convoquées à la même heure n'a aucune issue acceptable. |
| Chevauche un événement personnel Google | **Avertissement nommé** : « Tu as *Épicerie* de 15 h à 16 h. Réserver quand même ? » puis passage autorisé. | Seule Noctura sait si l'événement est déplaçable. Bloquer un arbitrage personnel pousse à contourner l'outil — et le système perd la trace du rendez-vous. |

**Changement à apporter** : `/api/holistique/appointments/manual` refuse aujourd'hui
(409) sur les **deux** cas. Il faut y ajouter un indicateur `forcerMalgreAgenda` qui lève
uniquement le refus lié à Google. Le refus lié à un rendez-vous client reste inconditionnel.

C'est la **seule** modification apportée à cette route.

---

## 9. Anomalies relevées à l'audit — hors périmètre, à corriger par le client

Ces points n'entrent pas dans ce chantier, mais ils coûtent des réservations aujourd'hui.

| Constat | Effet | Correction |
|---|---|---|
| **Bohemia : 0 créneau exploitable.** Ses 7 disponibilités étaient ponctuelles et se sont toutes terminées le 23 juillet. | Affichée publiquement, impossible à réserver. | Lui créer des disponibilités **récurrentes**, pas des dates isolées. |
| **Eiraween : 0 disponibilité, depuis toujours.** | Affichée publiquement, impossible à réserver. | Lui créer un horaire. |
| **18 rendez-vous « confirmés » jamais clôturés**, dont ceux d'hier. | Tableau de bord faussé, revenus faussés. | Les passer à `COMPLETED`, et prévoir une clôture automatique. |
| **Horaire de Noctura : vendredi 10 h 59** au lieu de 10 h 45 comme les autres jours. | Probable coquille. | À vérifier. |
| Deux soins de nom quasi identique : « TIRAGE COMBO RUNES FUTHARK & CARTE » et « Tirage Runes Futhark & Cartes », tous deux 89,99 $ / 60 min. | Confusion à la réservation. | En désactiver un. |

---

## 10. Défaillances et dégradation

| Panne | Comportement |
|---|---|
| Google Agenda injoignable | Les créneaux s'affichent **sans** le filtre Google, avec un bandeau explicite : « Impossible de vérifier ton agenda Google en ce moment. » Un écran vide serait pire. |
| Réseau coupé pendant l'envoi | Le bouton passe en « Création… » et se désactive : pas de double rendez-vous par double tap. |
| Créneau pris entre l'affichage et la validation | Message clair et retour à l'étape 3, **en conservant** la cliente et le soin déjà saisis. |
| Création du rendez-vous réussie mais Google en échec | Le rendez-vous existe. L'échec Google est journalisé, comme aujourd'hui. |

---

## 11. Vérification

Le projet n'a **aucune infrastructure de tests** et n'en recevra pas ici.

1. **Script de calcul des créneaux** (`scripts/test-creneaux.ts`), exécuté sur les vraies
   disponibilités de Noctura : un mardi doit rendre ses trois blocs ; un lundi doit rendre
   zéro créneau ; un créneau déjà réservé doit disparaître de la liste.
2. **Vérification sur un téléphone réel**, pas un simulateur : liste de gestes fournie,
   retour attendu sur l'atteignabilité au pouce, la lisibilité et le nombre de taps.
3. **Un rendez-vous de test créé réellement**, vérifié dans le Google Agenda de Noctura,
   puis supprimé.
4. `npx tsc --noEmit` : aucune erreur nouvelle en plus de celle, préexistante, de
   `src/app/admin/praticiens/modifications/actions.ts:150`.

**Validation finale par Noctura elle-même** : elle utilisera l'outil 90 % du temps. Son avis
prime sur celui de l'agent et sur celui du commanditaire.

---

## 12. Risques

| Risque | Parade |
|---|---|
| La coquille adaptative casse l'affichage sur ordinateur | Toutes les règles sont conditionnées à `lg:` — au-dessus de 1024 px le rendu actuel est inchangé. Vérification sur les deux tailles. |
| `npm run build` ne peut pas être lancé localement (le `#` du chemin Dropbox casse Turbopack) | Vérification par `npx tsc --noEmit` ; le build réel est celui de Vercel. |
| Le module `@fullcalendar/list` n'est pas installé | À ajouter aux dépendances. Vérifier qu'il n'entraîne pas de conflit de version. |
| Duplication du calcul des créneaux avec la page publique | Assumée et documentée : la page publique n'est pas touchée dans ce chantier. Suite possible : la faire consommer `src/lib/creneaux.ts`. |
| Déploiement | `git push` **puis `vercel --prod`** — le déploiement automatique Git ne fonctionne pas sur ce projet. Vérifier `vercel.json` avant. |
