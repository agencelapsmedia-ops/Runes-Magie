# Spec — Déplacement de RDV, courriel d'annulation, rappel 24h (module soins)

**Date :** 2026-06-16
**Module :** Plateforme holistique (`/soins/*`)
**Statut :** validé (design approuvé), prêt pour plan d'implémentation

## Contexte

Le module soins envoie déjà, à la confirmation du paiement (webhook Stripe → RDV
`CONFIRMED`), deux courriels : confirmation au client + notification à la
praticienne (`src/lib/holistic-booking-email.ts`). La sync Google Agenda sortante
crée/supprime l'événement de la praticienne (`src/lib/google-calendar.ts`).

Trois manques à combler :
1. Impossible de **déplacer** un RDV confirmé (le code ne change que le statut).
2. Aucun **courriel à l'annulation** d'un RDV.
3. Aucun **rappel** avant le RDV.

## Objectifs

- Permettre à la **praticienne** (propriétaire du RDV) et à l'**admin** de
  reprogrammer un RDV confirmé, avec mise à jour de l'agenda Google + courriel au client.
- Envoyer un **courriel d'annulation** au client et à la praticienne quand un RDV
  passe en `CANCELLED`.
- Envoyer un **rappel automatique** au client ~24h avant le RDV, via un cron Vercel.

## Hors périmètre (YAGNI)

- **Self-service client** pour déplacer/annuler (décision : praticienne + admin only).
- **Remboursement automatisé** à l'annulation (le courriel reste informationnel ;
  le remboursement éventuel se gère manuellement via Stripe).
- **Rappel SMS** (séparé, nécessite Twilio — reste au backlog).
- **Rappel 1h avant** (on se limite au 24h pour cette itération).
- Contrainte du nouveau créneau aux disponibilités publiées (la praticienne choisit librement).

---

## Briques partagées

### B1. Helper de données courriel
Centraliser la construction du `BookingEmailData` (aujourd'hui faite inline dans le
webhook Stripe en parsant les `notes`) pour la réutiliser par les courriels de
déplacement, d'annulation et de rappel.

- Nouveau `buildBookingEmailData(appointmentId): Promise<BookingEmailData | null>`
  dans `src/lib/holistic-booking-email.ts`. Charge le RDV + `client` + `practitioner.user`,
  extrait `serviceName` (`/Service\s*:\s*(...)/` dans `notes`), déduit `mode`
  (`notes` contient « virtuel »), nettoie les notes, mappe montants + `dailyRoomUrl`.
- Le webhook peut être migré vers ce helper plus tard (non requis ici — ne pas
  modifier son comportement actuel).

### B2. Mise à jour de l'événement Google
- Nouveau `updateCalendarEventForAppointment(appointmentId): Promise<boolean>` dans
  `src/lib/google-calendar.ts`. Si le RDV a un `googleEventId` et que la praticienne
  est connectée : `calendar.events.patch` avec les nouveaux `start`/`end` (et `location`
  recalculé selon présentiel/virtuel). Best-effort, ne lève jamais. No-op si pas
  d'événement (ex. praticienne non connectée).

### B3. Colonne anti-doublon rappel
- `HolisticAppointment.reminderSentAt DateTime?` (nullable, additif).
- Migration SQL dans `prisma/migrations/<timestamp>_add_reminder_sent_at/migration.sql`,
  appliquée à Supabase (même procédure que la migration Google Agenda du 2026-06-08).
- Ajout du champ dans `prisma/schema.prisma` (modèle `HolisticAppointment`).

---

## Feature 1 — Déplacer un RDV

### API
Étendre `src/app/api/holistique/appointments/[id]/route.ts` avec un handler **`PATCH`** :
- **Auth** (`holisticSession`) : autorisé si l'utilisateur est la praticienne
  propriétaire du RDV (`appointment.practitionerId === session.practitionerId`)
  **ou** `role === 'ADMIN'`. Sinon 403.
- **Body** : `{ startsAt: string, endsAt: string }` (ISO). Si `endsAt` absent, le
  recalculer depuis la durée d'origine.
- **Validations** :
  - RDV existe, sinon 404.
  - Statut `CONFIRMED` uniquement (pas `CANCELLED`/`COMPLETED`/`PENDING`), sinon 400.
  - `startsAt` dans le futur, sinon 400.
  - Pas de chevauchement avec un autre RDV non annulé de la praticienne
    (réutiliser la logique `startsAt < endsAt && endsAt > startsAt`, **exclure l'id courant**),
    sinon 409.
- **Effet** : `update` `startsAt`/`endsAt` + `reminderSentAt: null`.
- **Effets de bord (best-effort, non bloquants)** : `updateCalendarEventForAppointment(id)`,
  `sendRescheduleToClient(...)`, mise à jour des horaires Booking V2.

### UI
- **Composant client** `RescheduleButton.tsx` (modale avec `<input type="datetime-local">`
  pré-rempli à la date actuelle du RDV ; affiche la durée conservée ; `PATCH` puis
  `router.refresh()` / reload). Gère erreurs (409 « créneau occupé », etc.).
- **Dashboard praticienne** (`src/app/(holistique)/soins/dashboard/praticien/page.tsx`) :
  bouton « Déplacer » sur chaque carte RDV à venir (`status === 'CONFIRMED'`), à côté
  de « Terminer la séance ».
- **Admin consultations** (`src/app/admin/consultations/page.tsx`) : même action sur
  chaque RDV confirmé (structure exacte à confirmer lors de l'implémentation).

### Courriel
`sendRescheduleToClient(data)` : « Votre rendez-vous a été déplacé », nouvelle date/heure,
mode + adresse (présentiel) ou lien consultation (virtuel), praticienne. Réutilise B1.

---

## Feature 2 — Courriel d'annulation

- `sendCancellationToClient(data)` + `sendCancellationToPractitioner(data)` dans
  `holistic-booking-email.ts` (même style HTML que les confirmations, via B1).
- Branchement dans le `PUT` de `appointments/[id]/route.ts`, **à côté** de la
  suppression d'événement agenda déjà en place (bloc `if (status === 'CANCELLED')`).
  `Promise.allSettled`, best-effort, non bloquant.
- Contenu : service, date/heure, « rendez-vous annulé », note : pour toute question
  sur un remboursement, contacter la boutique. Destinataires : **client + praticienne**.
- S'applique quel que soit l'auteur de l'annulation (client via son espace, ou admin).

---

## Feature 3 — Rappel 24h

- **Route cron** `GET /api/cron/holistic-reminders/route.ts` :
  - Auth identique aux crons Clover : header `x-cron-secret` ou `authorization: Bearer`
    == `process.env.CRON_SECRET`, sinon 401.
  - Sélection : `status === 'CONFIRMED'`, `startsAt` entre `now` et `now + 24h`,
    `reminderSentAt === null`.
  - Pour chacun : `sendReminderToClient(...)` (via B1) puis `update { reminderSentAt: now }`.
    Best-effort par RDV (un échec n'empêche pas les autres). Retourne un récap JSON
    (`{ sent, failed }`).
- **`vercel.json`** : ajouter `{ "path": "/api/cron/holistic-reminders", "schedule": "0 * * * *" }`
  (toutes les heures ; dédoublonné par `reminderSentAt`). 3ᵉ cron (OK Vercel Pro).
- **Courriel** : `sendReminderToClient(data)` — rappel au **client** seulement, avec
  date/heure, mode + adresse/lien, et lien vers son tableau de bord.

---

## Modèle de données

| Table | Colonne | Type | Note |
|---|---|---|---|
| `HolisticAppointment` | `reminderSentAt` | `DateTime?` | anti-doublon du rappel 24h ; remis à `null` au déplacement |

Migration additive (nullable), appliquée à Supabase comme la migration Google Agenda.

## Fichiers touchés (récap)

- `prisma/schema.prisma` + nouvelle migration SQL — colonne `reminderSentAt`
- `src/lib/holistic-booking-email.ts` — `buildBookingEmailData` + `sendRescheduleToClient`
  + `sendCancellationToClient` + `sendCancellationToPractitioner` + `sendReminderToClient`
- `src/lib/google-calendar.ts` — `updateCalendarEventForAppointment`
- `src/lib/holistic-v2-sync.ts` — helper de mise à jour des horaires Booking V2 (best-effort)
- `src/app/api/holistique/appointments/[id]/route.ts` — `PATCH` (déplacement) + courriel d'annulation dans `PUT`
- `src/app/(holistique)/soins/dashboard/praticien/RescheduleButton.tsx` — nouveau composant
- `src/app/(holistique)/soins/dashboard/praticien/page.tsx` — bouton « Déplacer »
- `src/app/admin/consultations/page.tsx` — action « Déplacer »
- `src/app/api/cron/holistic-reminders/route.ts` — nouveau cron
- `vercel.json` — entrée cron

## Vérification

- `npm run dev` est cassé en local (le `#` du dossier) → typecheck isolé :
  `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`, filtrer sur les
  fichiers touchés (ignorer le bruit `.next/` et l'erreur pré-existante `actions.ts`).
- Test fonctionnel en prod après déploiement Vercel : déplacer un RDV de test
  (vérifier agenda Google + courriel), annuler un RDV (courriel + événement retiré),
  déclencher le cron manuellement avec le `CRON_SECRET` pour valider le rappel.
- Commits français, push sur `main` → déploiement Vercel auto (après autorisation).
