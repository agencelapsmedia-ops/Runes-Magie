# Module Événements — devis de conception

**Date** : 2026-08-05
**Auteur** : Jonathan (Laps Media) avec Claude
**Premier événement visé** : rituel LUGHNASADH, samedi 8 août 2026 — 15 places
**Contrainte** : l'événement a lieu dans 3 jours

---

## 1. Objectif

Permettre à Runes & Magie d'annoncer ses événements (rituels, veillées, célébrations)
sur le site, de recevoir des inscriptions en ligne et d'en suivre la liste dans le
back-office, avec les courriels de confirmation et de rappel associés.

Le module doit être **réutilisable pour tous les événements suivants** : Annabelle
crée elle-même ses événements dans l'admin, sans intervention de développement.

---

## 2. Décisions validées

| Sujet | Décision |
|---|---|
| Qui peut s'inscrire | Tout le monde, mais **un compte est obligatoire** — il est créé au passage |
| Formulaire de création de compte | **Le formulaire existant** `/soins/auth/register`, réutilisé tel quel |
| Paiement | **Gratuit**. Aucun branchement Stripe |
| Places | **Limitées** (15 pour Lughnasadh), avec compteur public et bascule COMPLET |
| Liste d'attente | **Non** |
| Admin | **Éditeur complet** : créer, modifier, publier, supprimer ses événements |
| Rapport aux soins | **Module séparé**. Seul le compte utilisateur est partagé |

### Ce que « séparé » veut dire précisément

Les événements ne doivent apparaître **ni** dans le module soins (`/soins/*`), **ni**
dans les revenus holistiques, **ni** dans le calendrier des praticiennes, **ni** dans
les modèles `Offering` / `Booking` / `Appointment`. Un bogue dans les événements ne
doit pouvoir affecter ni la boutique ni les soins.

---

## 3. Hors périmètre

- Paiement en ligne des événements (à rouvrir si un événement payant se présente)
- Liste d'attente quand l'événement est complet
- Récurrence automatique (un rituel chaque pleine lune)
- Affichage des événements dans le calendrier admin FullCalendar
- Billetterie, codes QR, pointage des présences sur place
- Réécriture des courriels existants (seul un gabarit partagé est extrait)
- **Correction du bogue `?redirect=` / `?next=`** de la réservation de soins
  (voir §12) — signalé, en attente de décision

---

## 4. Modèle de données

Deux nouvelles tables. Aucune modification des tables existantes, hormis l'ajout
de la relation inverse `eventRegistrations` sur `HolisticUser`.

```prisma
model Event {
  id           String   @id @default(cuid())
  slug         String   @unique          // "lughnasadh-2026"
  title        String
  excerpt      String?                   // accroche courte, page liste
  description  String                    // texte long, page fiche
  imageUrl     String?
  startsAt     DateTime
  endsAt       DateTime?
  location     String                    // adresse, ou "En ligne"
  isOnline     Boolean  @default(false)
  onlineUrl    String?
  capacity     Int                       // 15
  bringItems   String?                   // "quoi apporter"
  isPublished  Boolean  @default(false)
  cancelledAt  DateTime?                 // événement annulé par l'admin
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  registrations EventRegistration[]

  @@index([isPublished, startsAt])
}

model EventRegistration {
  id             String   @id @default(cuid())
  eventId        String
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId         String
  user           HolisticUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Copie figée au moment de l'inscription
  email          String
  firstName      String
  lastName       String
  phone          String?

  note           String?                 // message du participant
  status         EventRegistrationStatus @default(CONFIRMED)
  cancelToken    String   @unique @default(cuid())
  reminderSentAt DateTime?
  createdAt      DateTime @default(now())
  cancelledAt    DateTime?

  @@unique([eventId, userId])
  @@index([eventId, status])
}

enum EventRegistrationStatus {
  CONFIRMED
  CANCELLED
}
```

### Pourquoi ces choix

**`@@unique([eventId, userId])`** — la base elle-même refuse la double inscription.
Une protection en base survit à un bogue applicatif ; une protection en code, non.

**Copie figée du nom et du courriel** — si la personne change son courriel dans son
profil trois mois plus tard, la liste de présence de Lughnasadh reste exacte.

**`cancelToken`** — permet le lien « annuler ma place » directement depuis le courriel,
sans connexion. C'est un identifiant aléatoire non devinable, propre à une inscription.

**`status` plutôt qu'une suppression** — une annulation garde une trace. On sait
combien de gens se sont désistés, et le participant ne peut pas se réinscrire en
boucle pour contourner le compteur (la contrainte d'unicité tient, on repasse le
statut à `CONFIRMED`).

**`cancelledAt` sur `Event`** — annuler l'événement n'efface pas les inscrits ; on a
encore besoin de leurs adresses pour les prévenir.

### Anti-surréservation

L'insertion se fait dans une transaction Prisma en isolation `Serializable` :

```
$transaction(async (tx) => {
  const pris = await tx.eventRegistration.count({
    where: { eventId, status: 'CONFIRMED' }
  })
  if (pris >= event.capacity) throw new Complet()
  return tx.eventRegistration.create({ ... })
}, { isolationLevel: 'Serializable' })
```

Postgres refuse alors les deux transactions concurrentes qui liraient le même
compte ; la seconde échoue et l'utilisateur voit « COMPLET ». C'est la seule
garantie correcte — un simple `count()` suivi d'un `create()` hors transaction
laisse passer deux inscriptions sur la dernière place.

---

## 5. Parcours d'inscription

### Visiteur non connecté

1. Il consulte `/evenements/lughnasadh` librement.
2. À la place du formulaire, un encadré : « Créez votre compte pour réserver votre place »
   avec deux liens : **Se connecter** et **Créer mon compte**, tous deux portant
   `?next=/evenements/lughnasadh`.
3. Il remplit le formulaire d'inscription **existant** (`/soins/auth/register`) :
   prénom, nom, courriel, téléphone, mot de passe + confirmation, consentement Loi 25,
   infolettre optionnelle.
4. Connexion automatique, puis retour sur la page du rituel grâce au `next`.
5. Il finalise son inscription.

Aucun code d'authentification nouveau. Aucune modification de la page register.

### Visiteur connecté

Ses coordonnées sont déjà connues. Le formulaire ne demande qu'un **message optionnel**
(allergie, question, « je viens avec ma fille ») et un bouton **Je réserve ma place**.

### Conservation du message

Le message saisi avant la redirection vers la création de compte est conservé
(`sessionStorage`, clé `evenement:<slug>:note`) et réinjecté au retour. C'est une
amélioration par rapport à la réservation de soins, qui fait tout retaper.

---

## 6. Écrans

### Public

| Route | Contenu |
|---|---|
| `/evenements` | Événements publiés à venir, en cartes : visuel, titre, date, lieu, places restantes |
| `/evenements/[slug]` | Fiche : visuel, date en toutes lettres, lieu, description, quoi apporter, compteur de places ou bandeau COMPLET, formulaire |

Rendu `force-dynamic` (le compteur de places doit être juste). Métadonnées SEO et
OpenGraph par événement. Entrée « Événements » ajoutée au menu via `MenuItem` en
base, donc renommable ou retirable depuis `/admin/site/menu`.

Les événements passés ne sont pas listés, mais leur fiche reste accessible par URL
(les liens partagés sur Facebook ne cassent pas).

### Espace membre

`/compte/evenements` — mes inscriptions à venir et passées, bouton **Annuler ma place**.
Entrée ajoutée à `NAV_ITEMS` (`src/components/membre/MembreShell.tsx`) et carte sur
le tableau de bord `/compte`.

La page « Veillées » en attente n'est pas touchée.

### Admin — nouvel onglet « Événements »

| Route | Contenu |
|---|---|
| `/admin/evenements` | Liste : titre, date, **« 12 / 15 inscrits »**, publié/brouillon |
| `/admin/evenements/nouveau` | Formulaire de création |
| `/admin/evenements/[id]` | Modification + liste des inscrits |

La fiche d'un événement donne : les inscrits (nom, courriel, téléphone, date, message),
l'**export CSV** pour la feuille de présence, la désinscription manuelle, le bouton
**Écrire à tous les inscrits** et le bouton **Annuler l'événement**.

Entrée ajoutée à `navItems` dans `src/app/admin/layout.tsx`.

---

## 7. Routes API

Toutes en `force-dynamic`.

**Public / membre**
- `POST /api/evenements/[slug]/inscription` — inscription (session requise)
- `POST /api/evenements/annulation/[token]` — annulation par jeton, sans session
- `GET  /api/membre/evenements` — mes inscriptions

**Admin** — toutes précédées de `requireAdmin()` (`src/lib/admin-guard.ts`)
- `GET|POST /api/admin/evenements`
- `GET|PATCH|DELETE /api/admin/evenements/[id]`
- `GET /api/admin/evenements/[id]/inscrits` (+ `?format=csv`)
- `DELETE /api/admin/evenements/[id]/inscrits/[registrationId]`
- `POST /api/admin/evenements/[id]/message` — écrire à tous
- `POST /api/admin/evenements/[id]/annuler` — annuler l'événement

**Cron**
- `GET /api/cron/event-reminders` — protégé par `CRON_SECRET`

---

## 8. Courriels

| Déclencheur | Destinataire | Contenu |
|---|---|---|
| Inscription | Participant | Date en toutes lettres, heure, lieu, quoi apporter, lien d'annulation |
| Inscription | Admin (`ADMIN_EMAIL`) | « X s'est inscrit — 12/15 places » |
| Cron quotidien | Participant | Rappel la veille |
| Annulation par le participant | Participant + admin | Confirmation, place libérée |
| Événement annulé | Tous les inscrits confirmés | Annonce de l'annulation |
| Message libre | Tous les inscrits confirmés | Texte saisi par l'admin |

Envoi via Resend, selon le motif déjà utilisé partout dans le projet :
`FROM_EMAIL`, dégradation gracieuse si `RESEND_API_KEY` est absente (log au lieu d'envoi).

### Amélioration ciblée : gabarit partagé

Le gabarit HTML (fond `#0A0A12`, en-tête doré, carte `#1A1A2E`) est aujourd'hui
dupliqué dans 4 fichiers de `src/lib` et 6 routes API. Comme ce module en ajoute six,
le gabarit est extrait dans **`src/lib/email-template.ts`** et utilisé par les
nouveaux courriels.

Les courriels existants ne sont **pas** réécrits — le risque ne se justifie pas.
La base propre est simplement disponible pour la suite.

---

## 9. Rappel automatique

Nouveau cron `/api/cron/event-reminders`, planifié `0 13 * * *` (9h, heure de l'Est).

Il traite les inscriptions `CONFIRMED` dont `reminderSentAt` est nul et dont
l'événement commence dans les **48 prochaines heures**, puis marque `reminderSentAt`.

La fenêtre de 48 h est nécessaire : le plan Vercel Hobby n'autorise **qu'un passage
par jour**, donc un rappel « à 24 h près » manquerait des événements. Pour Lughnasadh
(samedi 13h), le rappel part **vendredi matin**.

**Risque assumé** : ce serait le 5ᵉ cron du projet. Un cron mal formé a déjà bloqué
tous les déploiements pendant 20 jours (voir §11). Si Vercel refuse, le repli est
d'intégrer le traitement au cron `holistic-reminders` existant, sans changement
fonctionnel visible.

---

## 10. Sécurité

- **Toutes** les routes admin passent par `requireAdmin()`.
- L'inscription exige une session valide, revérifiée en base — l'identifiant de
  session peut appartenir à un `AdminUser`, qui n'est pas un membre.
- Le jeton d'annulation est un `cuid()` non séquentiel, propre à une inscription :
  le connaître ne permet que d'annuler cette place précise.
- Le message du participant est échappé avant insertion dans le HTML des courriels
  (sinon un participant peut injecter du HTML dans le courriel que reçoit l'admin).
- L'export CSV préfixe par une apostrophe toute valeur commençant par `=`, `+`, `-`
  ou `@`, pour éviter l'injection de formule à l'ouverture dans Excel.
- Les compteurs de places affichés publiquement ne révèlent aucune identité.

---

## 11. Vérification

Le projet **n'a aucune infrastructure de tests** (`package.json` ne définit pas de
script `test`). Aucune n'est introduite à trois jours de l'événement.

1. **Test de concurrence sur la limite de places** — `scripts/test-evenement-places.ts` :
   lance 20 inscriptions simultanées sur un événement de test à 15 places et vérifie
   qu'il en passe **exactement 15**. C'est le seul point où un bogue coûterait
   vraiment cher : 18 personnes qui se présentent dans un local prévu pour 15.
2. **Parcours manuel en production**, exécuté et rapporté : créer l'événement,
   s'inscrire avec un compte de test, recevoir le courriel, annuler, vérifier que la
   place se libère et que le compteur redescend.
3. **Vérification du cron** : appel manuel de la route avec `CRON_SECRET` avant de
   compter dessus.

Un vrai cadre de tests (Vitest) est proposé **après** l'événement.

---

## 12. Risques connus

| Risque | Parade |
|---|---|
| Vercel refuse un 5ᵉ cron | Replier le rappel dans `holistic-reminders` |
| Le déploiement échoue à cause de `vercel.json` | Vérifier `vercel.json` **avant** chaque déploiement — c'est ce qui a figé la prod 20 jours |
| Migration Prisma en production | La migration est appliquée au build par `scripts/migrate-deploy-safe.mjs` ; les deux tables sont neuves, donc sans risque pour les données existantes |
| Détails de l'événement manquants | L'admin permet à Annabelle de les saisir ; seule **l'heure de début** doit être connue avant publication |
| Peu de trafic membre (22 comptes) | Les 58 abonnés infolettre sont le vrai bassin — prévoir un envoi d'annonce |

### Bogue existant, hors périmètre

`src/app/(holistique)/soins/reserver/[practitionerId]/page.tsx:1168` construit un lien
`/soins/auth/login?redirect=...`, alors que la page de connexion ne lit que `?next=`
(`src/app/(holistique)/soins/auth/login/page.tsx:18`).

Conséquence : une cliente qui a choisi sa praticienne, son service, son jour et son
heure puis clique « Connectez-vous pour finaliser votre réservation » atterrit sur son
tableau de bord et perd toute sa sélection. Correction d'une ligne, **en attente de
décision**.

---

## 13. Données de l'événement Lughnasadh

À saisir dans l'admin avant publication :

| Champ | Valeur |
|---|---|
| Titre | Rituel de Lughnasadh |
| Date | samedi 8 août 2026 |
| Heure de début | **à confirmer** — « 1 heure » signifiait-il 13h ? |
| Heure de fin | à confirmer |
| Lieu | à confirmer |
| Présentiel / en ligne | à confirmer |
| Places | 15 |
| Description | à rédiger (proposition possible) |
| Quoi apporter | à confirmer |
