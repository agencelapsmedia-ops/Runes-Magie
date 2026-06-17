# Spec — RDV manuel (praticienne / admin) + activation de compte client (module soins)

**Date :** 2026-06-17
**Module :** Plateforme holistique (`/soins/*`)
**Statut :** design approuvé (sections 1-8), prêt pour relecture puis plan d'implémentation

## Contexte

Aujourd'hui un RDV holistique ne se crée que par le **parcours public payant** : la
cliente connectée réserve un créneau → `POST /api/holistique/checkout` crée le RDV en
`PENDING`, ouvre une session Stripe Checkout (acompte 25 $ + solde), et le webhook
(`/api/holistique/webhooks/stripe`) passe le RDV en `CONFIRMED` + envoie les courriels +
crée la salle Daily + l'événement Google Agenda.

Il existe bien un endpoint direct `POST /api/holistique/appointments` (sans Stripe), mais
il prend toujours **l'utilisateur connecté comme cliente**, crée en `PENDING`, et n'envoie
aucun courriel : il ne répond pas au besoin.

**Besoin :** permettre à la **praticienne** (pour elle-même) et à l'**admin** (pour
n'importe quelle praticienne) de créer un RDV à la main pour une cliente, en bloquant le
créneau immédiatement, avec trois modes de paiement (comptant / lien Stripe / virement
Interac) et la création/activation du compte cliente.

Deux mécanismes **n'existent pas encore** et sont ajoutés ici :
1. Création d'un **compte cliente** hors inscription publique (par courriel, ou « interne » si pas de courriel).
2. Un parcours **« définir mon mot de passe »** (lien signé, sans nouvelle colonne) — réutilisable plus tard pour un « mot de passe oublié ».

## Objectifs

- Endpoint sécurisé `POST /api/holistique/appointments/manual` créant un RDV `CONFIRMED`
  (créneau bloqué immédiatement) pour une cliente, avec compte retrouvé/créé.
- Trois modes de paiement : **Comptant** (réglé), **Lien Stripe** (lien envoyé, réglé au
  webhook), **Virement Interac** (infos envoyées, réglé à la main par l'admin).
- Courriel d'**activation** (« Crée ton mot de passe » + infos RDV) pour tout nouveau
  compte avec vrai courriel ; page `/soins/auth/definir-mot-de-passe`.
- Cas **« pas de courriel »** : compte interne, **comptant uniquement**, aucun courriel.
- Formulaire dans le dashboard praticienne **et** dans l'admin consultations.

## Hors périmètre (YAGNI)

- **Self-service cliente** pour créer/déplacer/annuler (praticienne + admin only — déjà la règle).
- **Remboursement automatisé** (manuel via Stripe, comme l'annulation existante).
- **Paiement Interac automatisé / rapprochement bancaire** : l'admin marque « payé » à la main.
- **SMS** (les comptes internes n'ont ni courriel ni SMS → contact téléphonique humain).
- **Migration du parcours public** vers le helper Stripe partagé (optionnel, non requis ici —
  ne pas modifier le comportement actuel du checkout public).
- **Contrainte du créneau aux disponibilités publiées** : la praticienne/l'admin choisit
  librement (on vérifie seulement les conflits réels — RDV existants + occupation Google).

---

## Briques partagées

### B1. Colonne `paymentMode` (migration additive)

Rien ne permet aujourd'hui de distinguer un RDV comptant d'un RDV en attente de virement,
ni de savoir si un RDV `PENDING` attend un virement Interac ou un paiement Stripe.

- Ajouter `HolisticAppointment.paymentMode String?` — valeurs `CASH | STRIPE_LINK | INTERAC`
  (null = RDV du parcours public classique). Nullable/additif.
- État « réglé / en attente » : porté par le `HolisticPayment.status` existant (`PENDING | PAID`),
  qu'on crée désormais aussi pour les RDV manuels. Donc :
  - `CASH` → `HolisticPayment.status = PAID` (réglé d'emblée), `depositPaidAt = now`.
  - `STRIPE_LINK` → `PENDING` jusqu'au webhook → `PAID` (comme aujourd'hui).
  - `INTERAC` → `PENDING` jusqu'à ce que l'admin clique « Marquer payé » → `PAID`.
- `paymentMode` sert à savoir **quel** PENDING peut être réglé à la main (INTERAC) vs réglé
  par Stripe (STRIPE_LINK), et à afficher le bon libellé.
- Migration SQL dans `prisma/migrations/<timestamp>_add_payment_mode/migration.sql`, appliquée
  à Supabase (même procédure que la migration `reminder*SentAt` du 2026-06-16). Champ ajouté au
  modèle `HolisticAppointment` dans `prisma/schema.prisma`.

### B2. Config Interac + adresse de support (`src/lib/constants.ts`)

Centraliser les infos de virement (modifiables facilement) :

```ts
/** Virement Interac — paramètres affichés dans le courriel « infos de virement ». */
export const INTERAC_EMAIL = 'comptabilite@runesetmagie.ca';
export const INTERAC_MESSAGE = 'Inscrivez votre nom dans la description du virement.';
export const INTERAC_ANSWER = 'Magie123'; // réponse secrète / mot de passe du virement
```

(`INTERAC_ANSWER` est un secret partagé peu sensible — laissé en constante pour édition
facile, déplaçable en variable d'env plus tard si besoin.)

### B3. Compte « interne » + détection (`isInternalEmail`)

Pour la cliente sans courriel : un compte est quand même créé avec une adresse **interne
non routable** dérivée du téléphone, pour satisfaire la contrainte `@unique` sans jamais
risquer un envoi réel.

- `INTERNAL_EMAIL_DOMAIN = 'interne.invalid'` (TLD `.invalid` réservé RFC 2606 → jamais délivré).
- Adresse interne = `${chiffresDuTelephone}@interne.invalid` (ex. `4505551234@interne.invalid`).
- Helper `isInternalEmail(email: string): boolean` → `email.endsWith('@' + INTERNAL_EMAIL_DOMAIN)`.
- **Aucun courriel** (activation, confirmation, rappels) n'est envoyé à une adresse interne.

### B4. Jeton signé « définir mot de passe » (sans nouvelle colonne, sans nouvelle dépendance)

Nouveau `src/lib/holistic-password-token.ts`, basé sur Node `crypto` (HMAC-SHA256) et
`process.env.AUTH_SECRET` (déjà utilisé par NextAuth v5) :

- `signSetPasswordToken(user: { id, hashedPassword }): string`
  - payload = `base64url(JSON({ uid, exp }))` avec `exp = now + 7 jours`.
  - signature = `base64url(HMAC_SHA256(AUTH_SECRET, ` `${uid}.${exp}.${hashedPassword}` `))`.
  - jeton = `${payload}.${signature}`.
- `verifySetPasswordToken(token): Promise<string | null>` → recharge l'utilisateur, vérifie
  `exp > now` et recalcule l'HMAC avec le `hashedPassword` **courant** (comparaison à temps
  constant). Retourne `uid` ou `null`.
- **Usage unique de fait** : le jeton est signé sur le `hashedPassword` actuel ; dès que la
  cliente définit son mot de passe, `hashedPassword` change → l'ancien jeton ne valide plus.
  Même mécanisme réutilisable pour un futur « mot de passe oublié ».

### B5. Helper de compte cliente (`findOrCreateHolisticClient`)

Nouveau helper (dans `src/lib/holistic-clients.ts` ou à côté de l'auth) :

```
findOrCreateHolisticClient({ firstName, lastName, phone, email? })
  → { user: HolisticUser, created: boolean, internal: boolean }
```

- **Avec courriel** : `findUnique({ email })`. Si trouvé → réutilise (`created: false`).
  Sinon → `create` (`role: 'CLIENT'`, `hashedPassword` = bcrypt d'un mot de passe aléatoire,
  coût 12), `created: true, internal: false`.
- **Sans courriel** : email interne dérivée du téléphone (B3) ; `findUnique` puis `create`
  si absent ; `internal: true`. (Le mot de passe aléatoire haché reste inutilisable — la
  cliente ne se connecte jamais ; contact téléphonique.)
- Réutilise exactement le pattern de `src/app/api/holistique/auth/register/route.ts:41`
  (`prisma.holisticUser.create`, `bcrypt.hash(pw, 12)`).

### B6. Helper session Stripe (`src/lib/holistic-stripe.ts`)

Extraire la création de session Stripe Checkout dans un helper réutilisable (montant
**complet**, sans logique d'acompte — propre au flux manuel) :

```
createHolisticPaymentLink({ appointment, practitioner, amountCad, label }): Promise<string /* url */>
```

- `payment_method_types: ['card']`, 1 item (`unit_amount` = montant complet), `metadata`
  contenant `appointmentId` (+ `usesDeposit: 'false'`, `v2BookingId` si présent) pour que le
  **webhook existant** se comporte correctement (passe `HolisticPayment` → `PAID`, envoie la
  confirmation finale).
- `success_url = /soins/reservation-confirmee?appointment={id}`, `cancel_url =
  /soins/dashboard/client`. Split Stripe Connect repris si `practitioner.stripeAccountReady`.
- Réutilisé par le flux manuel ; le checkout public n'est **pas** modifié dans cette itération.

---

## Feature 1 — Endpoint RDV manuel

`POST /api/holistique/appointments/manual` (nouveau fichier
`src/app/api/holistique/appointments/manual/route.ts`).

### Auth
- `holisticSession()`. Autorisé si :
  - `role === 'PRACTITIONER'` **et** la cible est elle-même (`body.practitionerId === session.user.practitionerId`), **ou**
  - `role === 'ADMIN'` (n'importe quelle praticienne).
  - Sinon `403`. (Même logique que le `PATCH` de déplacement.)

### Body
```jsonc
{
  "practitionerId": "string",          // imposé = soi-même pour une praticienne
  "client": { "firstName": "...", "lastName": "...", "phone": "...", "email": "" /* optionnel */ },
  "offeringId": "string",              // soin choisi → fixe durée + prix
  "startsAt": "ISO",                   // endsAt calculé via offering.durationMinutes
  "mode": "IN_PERSON" | "VIRTUAL",
  "paymentMode": "CASH" | "STRIPE_LINK" | "INTERAC",
  "notes": "string?"                   // optionnel
}
```

### Validations
- Champs cliente requis : `firstName`, `lastName`, `phone`. `email` optionnel mais validé si présent.
- `offeringId` appartient à la praticienne ; `startsAt` dans le futur ; `endsAt = startsAt + durationMinutes`.
- **Règle paiement / courriel** : `STRIPE_LINK` et `INTERAC` **exigent un courriel** → sinon
  `400` (« Ce mode de paiement nécessite un courriel »). Sans courriel → `paymentMode` doit être `CASH`.
- **Conflits** → `409` avec message clair :
  - chevauchement avec un RDV non annulé de la praticienne (`startsAt < endsAt && endsAt > startsAt`, `status != CANCELLED`) ;
  - **occupation Google** : `getBusyPeriods(practitionerId, startsAt, endsAt)` (best-effort ;
    ignoré si la praticienne n'est pas connectée à Google) qui chevauche le créneau.

### Effet (transaction)
1. `findOrCreateHolisticClient(...)` (B5) → `{ user, created, internal }`.
2. Calcule `totalAmount` = `offering.price`. Crée le RDV :
   `status: 'CONFIRMED'`, `clientId`, `practitionerId`, `startsAt`, `endsAt`, `paymentMode`,
   `totalAmount`, `depositAmount: null`, `remainingAmount: null`, `notes` enrichi
   (`Service: <nom>` + `Mode: Présentiel/Virtuel` + notes saisies).
3. Crée le `HolisticPayment` (`amountTotal`, `amountCommission`, `amountPractitioner` calculés
   via `commissionPct`) avec `status` selon mode (B1).

### Effets de bord (best-effort, non bloquants)
- **Salle Daily** si `VIRTUAL` (création immédiate → lien disponible pour les courriels).
- **Événement Google Agenda** : `createCalendarEventForAppointment(id)` (le créneau apparaît
  tout de suite chez la praticienne ; idempotent — voir note webhook).
- **Sync V2** : `mirrorAppointmentToBooking({ appointment, noStripeFlow: true })` → Booking V2 `CONFIRMED`.
- **Branche paiement + courriels** (Feature 3) selon `paymentMode`.

### Réponse
`201` avec `{ appointmentId, paymentMode, paymentLink? }` (le lien Stripe si `STRIPE_LINK`, pour
affichage/copie côté praticienne en plus de l'envoi courriel).

---

## Feature 2 — Définir son mot de passe

### Page
`src/app/(holistique)/soins/auth/definir-mot-de-passe/page.tsx` (lit `?token=…`) :
formulaire « nouveau mot de passe » + confirmation. Soumet à l'endpoint ci-dessous, puis
redirige vers `/soins/auth/login` avec un message de succès.

### Endpoint
`POST /api/holistique/auth/definir-mot-de-passe/route.ts` :
- Body `{ token, password }`. Valide la robustesse du mot de passe (min. 8 caractères).
- `verifySetPasswordToken(token)` (B4) → `uid` ou `401` (« lien invalide ou expiré »).
- `hashedPassword = bcrypt.hash(password, 12)` → `update` le `HolisticUser`. Le jeton devient
  caduc automatiquement (signé sur l'ancien hash).
- `200`. (Réutilisable tel quel pour un futur « mot de passe oublié ».)

---

## Feature 3 — Courriels

Toutes les fonctions vivent dans `src/lib/holistic-booking-email.ts` (mêmes utilitaires
`Resend`/`FROM`/`APP_URL`/`formatMontrealDateTime` déjà en place). **Jamais** d'envoi si
`isInternalEmail(clientEmail)`.

> **Bloc montant adapté au mode.** Les RDV manuels n'ont pas d'acompte/solde
> (`depositAmount`/`remainingAmount` = null) : les courriels ne doivent **pas** afficher le
> libellé « acompte payé / solde à venir » du parcours public. `BookingEmailData` porte donc
> `paymentMode`, et le bloc montant affiche le **total** avec un statut adapté :
> comptant → « Réglé (comptant) » ; lien Stripe → « À régler en ligne (lien ci-dessous) » ;
> virement → « À régler par virement Interac ». `buildBookingEmailData` charge `paymentMode`
> depuis le RDV (null = parcours public → comportement acompte/solde actuel **inchangé**).

- `sendSetPasswordEmail(data, token)` — **nouveau** : « Un compte a été créé pour toi —
  clique pour définir ton mot de passe » + lien `${APP_URL}/soins/auth/definir-mot-de-passe?token=…`
  + récap du RDV (sert aussi de bienvenue/confirmation pour le cas comptant).
- `sendPaymentLinkToClient(data, url)` — **nouveau** : récap RDV + bouton « Payer maintenant »
  (lien Stripe). La confirmation finale part au paiement (webhook existant).
- `sendInteracInstructionsToClient(data)` — **nouveau** : récap RDV + bloc Interac
  (`INTERAC_EMAIL`, montant = `totalAmount`, `INTERAC_MESSAGE`, réponse secrète `INTERAC_ANSWER`).
- Réutilise l'existant : `sendBookingConfirmationToClient` (confirmation comptant pour un
  compte **déjà existant**) ; `sendBookingNotificationToPractitioner` (uniquement si le RDV
  est créé par l'**admin** — inutile si la praticienne le crée pour elle-même).

### Matrice des envois (à la cliente)

| Cas | Courriel(s) |
|---|---|
| Comptant · nouveau compte · courriel | `sendSetPasswordEmail` (contient activation **et** récap RDV) |
| Comptant · compte existant · courriel | `sendBookingConfirmationToClient` |
| Comptant · sans courriel (interne) | **aucun** |
| Lien Stripe · nouveau compte | `sendSetPasswordEmail` + `sendPaymentLinkToClient` → (au paiement) `sendBookingConfirmationToClient` (webhook) |
| Lien Stripe · compte existant | `sendPaymentLinkToClient` → (au paiement) confirmation (webhook) |
| Virement · nouveau compte | `sendSetPasswordEmail` + `sendInteracInstructionsToClient` |
| Virement · compte existant | `sendInteracInstructionsToClient` |

> Note webhook : pour les RDV `STRIPE_LINK` manuels, le RDV est déjà `CONFIRMED` et l'événement
> Google / la salle Daily peuvent déjà exister. Le webhook existant doit rester **idempotent**
> (ne pas recréer l'événement si `googleEventId` est déjà présent, ni la salle si `dailyRoomUrl`
> l'est) tout en envoyant la confirmation finale au paiement. À vérifier/garantir au plan.

---

## Feature 4 — Formulaire UI

Composant client `ManualAppointmentButton.tsx` (modale) — réutilisé aux deux endroits :
- Dashboard praticienne (`src/app/(holistique)/soins/dashboard/praticien/page.tsx`) : bouton
  « + Ajouter un rendez-vous » → crée **pour elle-même** (`practitionerId` imposé).
- Admin consultations (`src/app/admin/consultations/page.tsx`) : même bouton + **sélecteur de
  praticienne**.

Champs : cliente (prénom, nom, téléphone obligatoire, courriel optionnel) · soin (déroulant
des `Offering` de la praticienne → fixe durée + prix) · date + heure · présentiel/virtuel ·
mode de paiement · notes. Le sélecteur de paiement **désactive Stripe/Virement** si le champ
courriel est vide (règle « comptant only sans courriel »). Soumet à l'endpoint, affiche les
erreurs (`409` créneau occupé : RDV existant ou plage Google), puis `router.refresh()`.

---

## Feature 5 — Marquer un virement comme payé

Pour clore le cas Interac (« réglé à la main quand reçu ») :
- `POST /api/holistique/appointments/[id]/mark-paid/route.ts` (**admin only**) →
  `HolisticPayment.status = 'PAID'`, `paidAt = now`, `HolisticAppointment.depositPaidAt = now`.
  Refus si `paymentMode !== 'INTERAC'` ou déjà payé.
- Bouton « Marquer payé » dans l'admin consultations, visible seulement si
  `paymentMode === 'INTERAC'` et paiement `PENDING`.

---

## Feature 6 — Garde « comptes internes » dans les rappels

`src/app/api/cron/holistic-reminders/route.ts` envoie un rappel à `data.clientEmail` sans
filtre. Ajouter un saut si `isInternalEmail(data.clientEmail)` dans les deux boucles (3j / 24h)
— le compte interne n'a pas de vraie adresse. (Les marqueurs `reminder*SentAt` peuvent être
posés quand même pour éviter de re-traiter à chaque passage, ou la condition filtre en amont —
choix tranché au plan.)

---

## Modèle de données

| Table | Colonne | Type | Note |
|---|---|---|---|
| `HolisticAppointment` | `paymentMode` | `String?` | `CASH \| STRIPE_LINK \| INTERAC` ; null = parcours public |

Migration additive (nullable), appliquée à Supabase comme la migration `reminder*SentAt`.
L'état « payé / en attente » réutilise `HolisticPayment.status` (aucune colonne supplémentaire).

## Fichiers touchés (récap)

- `prisma/schema.prisma` + nouvelle migration SQL — colonne `paymentMode`
- `src/lib/constants.ts` — `INTERAC_EMAIL` / `INTERAC_MESSAGE` / `INTERAC_ANSWER` / `INTERNAL_EMAIL_DOMAIN`
- `src/lib/holistic-password-token.ts` — **nouveau** : `signSetPasswordToken` / `verifySetPasswordToken`
- `src/lib/holistic-clients.ts` — **nouveau** : `findOrCreateHolisticClient` + `isInternalEmail`
- `src/lib/holistic-stripe.ts` — **nouveau** : `createHolisticPaymentLink`
- `src/lib/holistic-booking-email.ts` — `sendSetPasswordEmail` + `sendPaymentLinkToClient` + `sendInteracInstructionsToClient`
- `src/app/api/holistique/appointments/manual/route.ts` — **nouveau** : endpoint RDV manuel
- `src/app/api/holistique/auth/definir-mot-de-passe/route.ts` — **nouveau** : pose du mot de passe
- `src/app/(holistique)/soins/auth/definir-mot-de-passe/page.tsx` — **nouvelle** page
- `src/app/api/holistique/appointments/[id]/mark-paid/route.ts` — **nouveau** : marquer virement payé
- `src/components/holistique/ManualAppointmentButton.tsx` — **nouveau** composant (emplacement à confirmer)
- `src/app/(holistique)/soins/dashboard/praticien/page.tsx` — bouton « + Ajouter un rendez-vous »
- `src/app/admin/consultations/page.tsx` — bouton « + Ajouter un rendez-vous » + sélecteur praticienne + « Marquer payé »
- `src/app/api/cron/holistic-reminders/route.ts` — garde `isInternalEmail`
- `src/app/api/holistique/webhooks/stripe/route.ts` — idempotence Google/Daily (vérif/garantie)

## Vérification

- `npm run dev` cassé en local (le `#` du dossier) → typecheck isolé :
  `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`, filtré sur les fichiers
  touchés (ignorer le bruit `.next/` et l'erreur pré-existante `actions.ts`).
- Test fonctionnel en prod (après déploiement Vercel), un RDV manuel par mode :
  - **Comptant + courriel** → créneau bloqué, événement Google créé, courriel d'activation reçu,
    le lien permet de définir le mot de passe et de se connecter.
  - **Comptant + sans courriel** → créneau bloqué, événement Google, **aucun** courriel.
  - **Lien Stripe** → courriel avec lien ; payer → RDV reste `CONFIRMED`, `HolisticPayment` → `PAID`,
    confirmation finale reçue (pas de doublon d'événement Google ni de salle Daily).
  - **Virement** → courriel Interac (bonnes infos) ; « Marquer payé » → `PAID`.
  - Conflit : tenter un créneau chevauchant (RDV existant ou plage Google) → `409` clair.
- Commits français, push sur `main` → déploiement Vercel auto (après autorisation).
