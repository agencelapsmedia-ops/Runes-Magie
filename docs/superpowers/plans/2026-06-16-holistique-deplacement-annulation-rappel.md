# Déplacement de RDV + courriels d'annulation et de rappel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à la praticienne et à l'admin de déplacer un RDV confirmé (avec maj agenda Google + courriel client), envoyer un courriel d'annulation aux deux parties, et envoyer deux rappels automatiques au client (3 jours + 24h) via un cron Vercel.

**Architecture:** App Next.js 16 (App Router) + Prisma 6/Supabase. Logique métier dans `src/lib/*`, route handlers dans `src/app/api/*`, UI dans le route group `(holistique)` et `admin/`. Sync sortante best-effort (Google Agenda, Resend, Booking V2) qui ne bloque jamais la requête principale. Auth unifiée via `auth()` (= `holisticSession()`) exposant `role` + `practitionerId`.

**Tech Stack:** TypeScript, Prisma, Resend (email), googleapis (Google Calendar), Vercel Cron.

> **⚠️ Vérification — pas de framework de test dans ce projet.** Aucun `test` script, pas de jest/vitest. La vérification par tâche est : `tsc --noEmit` filtré sur les fichiers touchés (le `npm run dev` local est cassé à cause du `#` dans le nom du dossier ; le rendu se vérifie en prod après déploiement). Ne PAS introduire de harness de test (hors périmètre, viole YAGNI). Commande de typecheck réutilisée partout :
>
> ```bash
> node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "<FICHIER>" || echo "OK: pas d'erreur dans <FICHIER>"
> ```
>
> Erreurs pré-existantes à ignorer : bruit `.next/types/validator.ts`, et `src/app/admin/praticiens/modifications/actions.ts(149,...)`.

**Spec de référence :** `docs/superpowers/specs/2026-06-16-holistique-deplacement-annulation-rappel-design.md`

---

## File Structure

- `prisma/schema.prisma` — +2 colonnes sur `HolisticAppointment`
- `prisma/migrations/20260616000000_add_reminder_sent_at/migration.sql` — migration additive
- `src/lib/holistic-booking-email.ts` — +helpers (`emailShell`, `locationHtml`, `buildBookingEmailData`) +4 fonctions d'envoi
- `src/lib/google-calendar.ts` — +`updateCalendarEventForAppointment`
- `src/lib/holistic-v2-sync.ts` — +`updateBookingTimesV2`
- `src/app/api/holistique/appointments/[id]/route.ts` — +`PATCH` (déplacement) ; courriels d'annulation dans `PUT`
- `src/app/(holistique)/soins/dashboard/praticien/RescheduleButton.tsx` — nouveau composant client (réutilisé côté admin)
- `src/app/(holistique)/soins/dashboard/praticien/page.tsx` — bouton « Déplacer »
- `src/app/admin/consultations/page.tsx` — colonne « Actions » avec bouton « Déplacer »
- `src/app/api/cron/holistic-reminders/route.ts` — nouveau cron
- `vercel.json` — entrée cron

---

## Task 1: Colonnes de rappel (schéma + migration)

**Files:**
- Modify: `prisma/schema.prisma` (modèle `HolisticAppointment`, près de `googleEventId`)
- Create: `prisma/migrations/20260616000000_add_reminder_sent_at/migration.sql`

- [ ] **Step 1: Ajouter les champs au schéma**

Dans `prisma/schema.prisma`, modèle `HolisticAppointment`, juste après la ligne `googleEventId String? // id de l'événement Google Agenda (sync sortante)` :

```prisma
  reminder3dSentAt  DateTime? // rappel client 3 jours avant (anti-doublon)
  reminder24hSentAt DateTime? // rappel client 24h avant (anti-doublon)
```

- [ ] **Step 2: Créer la migration SQL**

Créer `prisma/migrations/20260616000000_add_reminder_sent_at/migration.sql` :

```sql
-- AlterTable: marqueurs anti-doublon des rappels client (colonnes additives nullables)
ALTER TABLE "HolisticAppointment" ADD COLUMN     "reminder3dSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder24hSentAt" TIMESTAMP(3);
```

- [ ] **Step 3: Régénérer le client Prisma**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sans erreur (les nouveaux champs apparaissent dans le client généré sous `src/generated/prisma`).

- [ ] **Step 4: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "schema|HolisticAppointment" || echo "OK"`
Expected: `OK` (aucune nouvelle erreur).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260616000000_add_reminder_sent_at
git commit -m "DB : colonnes reminder3dSentAt + reminder24hSentAt sur HolisticAppointment"
```

> Note : la migration sera appliquée à Supabase au prochain déploiement Vercel (`npm run build` → `scripts/migrate-deploy-safe.mjs`).

---

## Task 2: Helpers email partagés

**Files:**
- Modify: `src/lib/holistic-booking-email.ts` (haut du fichier + nouveaux helpers)

- [ ] **Step 1: Ajouter l'import Prisma**

En haut de `src/lib/holistic-booking-email.ts`, après `import { BOUTIQUE_LOCATION } from '@/lib/constants';`, ajouter :

```ts
import { prisma } from '@/lib/db';
```

- [ ] **Step 2: Ajouter les helpers en bas du fichier**

À la fin de `src/lib/holistic-booking-email.ts`, ajouter :

```ts
/** Enveloppe HTML commune (en-tête + pied) des courriels holistiques. */
function emailShell(innerHtml: string, footer = 'Runes &amp; Magie · Annabelle Dionne'): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:0.05em;">Runes &amp; Magie</h1>
      <p style="color:rgba(201,168,76,0.6);font-size:13px;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">Soins holistiques</p>
    </div>
    <div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">
      ${innerHtml}
    </div>
    <div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:12px;"><p>${footer}</p></div>
  </div>
</body></html>`;
}

/** Bloc HTML « mode + lieu/lien » selon présentiel ou virtuel. */
function locationHtml(data: BookingEmailData): string {
  const consultationUrl = `${APP_URL}/soins/consultation/${data.appointmentId}`;
  return data.mode === 'VIRTUAL'
    ? `<p style="margin:4px 0;color:#E8DCC8;"><strong>Mode :</strong> En ligne (vidéoconférence)</p>
       <p style="margin:4px 0;color:#E8DCC8;"><strong>Lien :</strong> <a href="${consultationUrl}" style="color:#2EC4B6;word-break:break-all;">${consultationUrl}</a></p>`
    : `<p style="margin:4px 0;color:#E8DCC8;"><strong>Mode :</strong> En présentiel</p>
       <p style="margin:4px 0;color:#E8DCC8;"><strong>Adresse :</strong> ${BOUTIQUE_LOCATION}</p>`;
}

/**
 * Construit le BookingEmailData à partir d'un appointmentId (charge RDV + client +
 * praticienne, parse le service/mode depuis les notes). null si RDV introuvable.
 * Source unique réutilisée par les courriels de déplacement / annulation / rappel.
 */
export async function buildBookingEmailData(appointmentId: string): Promise<BookingEmailData | null> {
  const appt = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { firstName: true, email: true } },
      practitioner: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
    },
  });
  if (!appt) return null;

  const isVirtual = (appt.notes ?? '').toLowerCase().includes('virtuel');
  const serviceMatch = (appt.notes ?? '').match(/Service\s*:\s*([^\n]+)/);
  const serviceName = serviceMatch ? serviceMatch[1].trim() : 'Consultation';
  const cleanNotes = (appt.notes ?? '')
    .replace(/Service\s*:[^\n]*\n?/g, '')
    .replace(/Mode\s*:[^\n]*\n?/g, '')
    .trim();

  return {
    appointmentId: appt.id,
    clientFirstName: appt.client.firstName,
    clientEmail: appt.client.email,
    practitionerFirstName: appt.practitioner.user.firstName,
    practitionerLastName: appt.practitioner.user.lastName,
    practitionerEmail: appt.practitioner.user.email,
    serviceName,
    startsAt: appt.startsAt,
    endsAt: appt.endsAt,
    mode: (isVirtual ? 'VIRTUAL' : 'IN_PERSON') as 'VIRTUAL' | 'IN_PERSON',
    notes: cleanNotes || null,
    depositAmount: appt.depositAmount ?? 0,
    remainingAmount: appt.remainingAmount ?? 0,
    totalAmount: appt.totalAmount ?? 0,
    dailyRoomUrl: appt.dailyRoomUrl ?? null,
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-booking-email" || echo "OK"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add src/lib/holistic-booking-email.ts
git commit -m "Email holistique : helpers partages (emailShell, locationHtml, buildBookingEmailData)"
```

---

## Task 3: Fonctions d'envoi (déplacement, annulation, rappel)

**Files:**
- Modify: `src/lib/holistic-booking-email.ts` (ajout en fin de fichier)

- [ ] **Step 1: Ajouter les 4 fonctions d'envoi**

À la fin de `src/lib/holistic-booking-email.ts`, ajouter :

```ts
/** Courriel au CLIENT : son RDV a été déplacé. */
export async function sendRescheduleToClient(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const dashboardUrl = `${APP_URL}/soins/dashboard/client`;
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous a été déplacé 🔄</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance a été reprogrammée. Voici la nouvelle date :
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Nouvelle date et heure :</strong> ${dateLabel}</p>
      ${locationHtml(data)}
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Voir mes RDV</a>
    </div>
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(74,45,122,0.3);">
      Une question ? Écris-nous à <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Déplacement client (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Ton RDV a été déplacé — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi déplacement client', err);
  }
}

/** Courriel au CLIENT : son RDV a été annulé. */
export async function sendCancellationToClient(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Rendez-vous annulé</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ton rendez-vous a été annulé.
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date initialement prévue :</strong> ${dateLabel}</p>
    </div>
    <p style="color:rgba(245,240,232,0.6);font-size:14px;line-height:1.6;margin:16px 0 0;">
      Pour toute question, notamment au sujet d'un éventuel remboursement, contacte-nous à
      <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Annulation client (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Annulation de ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi annulation client', err);
  }
}

/** Courriel à la PRATICIENNE : un RDV a été annulé. */
export async function sendCancellationToPractitioner(data: BookingEmailData): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const dashboardUrl = `${APP_URL}/soins/dashboard/praticien`;
  const html = emailShell(`
    <h2 style="color:#2EC4B6;font-size:22px;margin:0 0 16px;">Rendez-vous annulé</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.practitionerFirstName}, un rendez-vous de ton agenda a été annulé.
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Client·e :</strong> ${data.clientFirstName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date initialement prévue :</strong> ${dateLabel}</p>
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;">Voir mon tableau de bord</a>
    </div>
  `, 'Runes &amp; Magie — Notification automatique');
  if (!resend) {
    console.log('[Email holistique] Annulation praticienne (Resend non configuré) :', data.practitionerEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.practitionerEmail, subject: `RDV annulé — ${data.clientFirstName} le ${dateLabel}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi annulation praticienne', err);
  }
}

/** Courriel de rappel au CLIENT (3 jours ou 24h avant). */
export async function sendReminderToClient(data: BookingEmailData, lead: '3d' | '24h'): Promise<void> {
  const dateLabel = formatMontrealDateTime(data.startsAt);
  const dashboardUrl = `${APP_URL}/soins/dashboard/client`;
  const when = lead === '3d' ? 'dans 3 jours' : 'demain';
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Rappel : ta séance ${when} ✨</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, un petit rappel pour ton rendez-vous à venir :
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date et heure :</strong> ${dateLabel}</p>
      ${locationHtml(data)}
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Voir mes RDV</a>
    </div>
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(74,45,122,0.3);">
      Besoin de déplacer ou d'annuler ? Contacte-nous à <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Rappel client (Resend non configuré) :', data.clientEmail, lead);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Rappel : ta séance ${when} — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi rappel client', err);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-booking-email" || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/lib/holistic-booking-email.ts
git commit -m "Email holistique : courriels de deplacement, annulation (client+praticienne) et rappel"
```

---

## Task 4: Mise à jour de l'événement Google Agenda

**Files:**
- Modify: `src/lib/google-calendar.ts` (ajout après `createCalendarEventForAppointment`, avant `deleteCalendarEventForAppointment`)

- [ ] **Step 1: Ajouter `updateCalendarEventForAppointment`**

Dans `src/lib/google-calendar.ts`, ajouter cette fonction (réutilise `APP_URL`, `BOUTIQUE_LOCATION`, `TIMEZONE` déjà présents dans le fichier) :

```ts
/**
 * Met à jour l'événement Google d'un RDV (ex : déplacement). Patch début/fin + lieu.
 * Best-effort : retourne true si patché, false sinon (pas d'événement, non connectée…).
 * Ne lève jamais.
 */
export async function updateCalendarEventForAppointment(
  appointmentId: string,
): Promise<boolean> {
  try {
    const appt = await prisma.holisticAppointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        practitionerId: true,
        googleEventId: true,
        startsAt: true,
        endsAt: true,
        notes: true,
      },
    });
    if (!appt?.googleEventId) return false;

    const calendar = await getCalendarForPractitioner(appt.practitionerId);
    if (!calendar) return false;

    const isVirtual = (appt.notes ?? '').toLowerCase().includes('virtuel');
    const consultationUrl = `${APP_URL}/soins/consultation/${appt.id}`;
    const location = isVirtual ? consultationUrl : BOUTIQUE_LOCATION;

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: appt.googleEventId,
      requestBody: {
        location,
        start: { dateTime: appt.startsAt.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: appt.endsAt.toISOString(), timeZone: TIMEZONE },
      },
    });
    return true;
  } catch (err) {
    console.error('[Google Calendar] échec mise à jour événement', { appointmentId, err });
    return false;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "google-calendar" || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/lib/google-calendar.ts
git commit -m "Google Agenda : updateCalendarEventForAppointment (deplacement de RDV)"
```

---

## Task 5: Mise à jour des horaires Booking V2

**Files:**
- Modify: `src/lib/holistic-v2-sync.ts` (ajout après `syncAppointmentStatusToV2`)

- [ ] **Step 1: Ajouter `updateBookingTimesV2`**

Dans `src/lib/holistic-v2-sync.ts`, ajouter :

```ts
/**
 * Met à jour les horaires d'un Booking V2 après déplacement d'un HolisticAppointment.
 * Le Booking V2 se retrouve par (practitionerId, ANCIEN startsAt, clientId V2), d'où
 * la nécessité de passer `oldStartsAt`. Best-effort : retourne le Booking ou null.
 */
export async function updateBookingTimesV2(params: {
  appointmentId: string;
  oldStartsAt: Date;
  newStartsAt: Date;
  newEndsAt: Date;
}) {
  const a = await prisma.holisticAppointment.findUnique({
    where: { id: params.appointmentId },
    include: { client: { select: { email: true } } },
  });
  if (!a) return null;

  const v2Client = await prisma.user.findUnique({ where: { email: a.client.email } });
  if (!v2Client) return null;

  const booking = await prisma.booking.findFirst({
    where: {
      practitionerId: a.practitionerId,
      startsAt: params.oldStartsAt,
      clientId: v2Client.id,
    },
  });
  if (!booking) return null;

  return prisma.booking.update({
    where: { id: booking.id },
    data: { startsAt: params.newStartsAt, endsAt: params.newEndsAt },
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-v2-sync" || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/lib/holistic-v2-sync.ts
git commit -m "V2-sync : updateBookingTimesV2 (maj horaires Booking apres deplacement)"
```

---

## Task 6: Courriels d'annulation dans le PUT

**Files:**
- Modify: `src/app/api/holistique/appointments/[id]/route.ts`

- [ ] **Step 1: Ajouter les imports**

Modifier le bloc d'imports en haut du fichier pour ajouter les deux fonctions d'annulation et le helper de données :

```ts
import { deleteCalendarEventForAppointment } from '@/lib/google-calendar';
import {
  buildBookingEmailData,
  sendCancellationToClient,
  sendCancellationToPractitioner,
} from '@/lib/holistic-booking-email';
```

(La ligne `import { deleteCalendarEventForAppointment } from '@/lib/google-calendar';` existe déjà — la conserver, ne pas la dupliquer.)

- [ ] **Step 2: Envoyer les courriels dans le bloc CANCELLED**

Dans le handler `PUT`, le bloc `if (status === 'CANCELLED') { ... }` existe déjà (il appelle `deleteCalendarEventForAppointment`). **Avant** d'y supprimer l'événement, construire les données email (avant que quoi que ce soit ne change), puis envoyer après. Remplacer le bloc existant par :

```ts
  // Annulation → courriels aux deux parties + retrait de l'événement agenda Google
  // (best-effort, no-op si non connectée / Resend non configuré).
  if (status === 'CANCELLED') {
    try {
      const emailData = await buildBookingEmailData(id);
      if (emailData) {
        await Promise.allSettled([
          sendCancellationToClient(emailData),
          sendCancellationToPractitioner(emailData),
        ]);
      }
    } catch (err) {
      console.error('[annulation] envoi courriels échoué (non-bloquant)', { appointmentId: id, err });
    }
    try {
      await deleteCalendarEventForAppointment(id);
    } catch (err) {
      console.error('[google calendar] suppression événement à l\'annulation échouée (non-bloquant)', {
        appointmentId: id,
        err,
      });
    }
  }
```

- [ ] **Step 3: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "appointments/\[id\]" || echo "OK"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/holistique/appointments/[id]/route.ts"
git commit -m "Annulation RDV : courriels au client et a la praticienne (PUT statut CANCELLED)"
```

---

## Task 7: Handler PATCH (déplacement de RDV)

**Files:**
- Modify: `src/app/api/holistique/appointments/[id]/route.ts`

- [ ] **Step 1: Ajouter les imports nécessaires**

Compléter les imports en haut du fichier :

```ts
import { updateCalendarEventForAppointment } from '@/lib/google-calendar';
import { sendRescheduleToClient } from '@/lib/holistic-booking-email';
import { updateBookingTimesV2 } from '@/lib/holistic-v2-sync';
```

(Ajouter `updateCalendarEventForAppointment` à l'import existant de `@/lib/google-calendar`, et `sendRescheduleToClient` à l'import existant de `@/lib/holistic-booking-email`.)

- [ ] **Step 2: Ajouter le handler PATCH**

Ajouter cette fonction à la fin de `src/app/api/holistique/appointments/[id]/route.ts` :

```ts
/**
 * PATCH — déplace un RDV confirmé (nouvelle date/heure).
 * Autorisé : la praticienne propriétaire du RDV, ou un admin.
 * Body : { startsAt: string ISO, endsAt?: string ISO } (endsAt recalculé si absent).
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const startsAtRaw = body?.startsAt;
  if (!startsAtRaw) return NextResponse.json({ error: 'startsAt requis' }, { status: 400 });

  const appointment = await prisma.holisticAppointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Auth : admin OU praticienne propriétaire
  const isAdmin = user.role === 'ADMIN';
  const isOwner = user.role === 'PRACTITIONER' && user.practitionerId === appointment.practitionerId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Action réservée à la praticienne ou à un admin' }, { status: 403 });
  }

  if (appointment.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'Seul un RDV confirmé peut être déplacé' }, { status: 400 });
  }

  const oldStartsAt = appointment.startsAt;
  const durationMs = appointment.endsAt.getTime() - appointment.startsAt.getTime();
  const newStartsAt = new Date(startsAtRaw);
  const newEndsAt = body?.endsAt ? new Date(body.endsAt) : new Date(newStartsAt.getTime() + durationMs);

  if (Number.isNaN(newStartsAt.getTime()) || Number.isNaN(newEndsAt.getTime())) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  }
  if (newStartsAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'La nouvelle date doit être dans le futur' }, { status: 400 });
  }

  // Conflit avec un autre RDV non annulé de la même praticienne (exclure le RDV courant)
  const conflict = await prisma.holisticAppointment.findFirst({
    where: {
      id: { not: id },
      practitionerId: appointment.practitionerId,
      status: { not: 'CANCELLED' },
      startsAt: { lt: newEndsAt },
      endsAt: { gt: newStartsAt },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: 'Ce créneau chevauche un autre rendez-vous' }, { status: 409 });
  }

  const updated = await prisma.holisticAppointment.update({
    where: { id },
    data: {
      startsAt: newStartsAt,
      endsAt: newEndsAt,
      reminder3dSentAt: null,
      reminder24hSentAt: null,
    },
  });

  // Effets de bord best-effort (ne bloquent jamais la réponse)
  try {
    await updateCalendarEventForAppointment(id);
  } catch (err) {
    console.error('[deplacement] maj agenda Google échouée (non-bloquant)', { appointmentId: id, err });
  }
  try {
    const emailData = await buildBookingEmailData(id);
    if (emailData) await sendRescheduleToClient(emailData);
  } catch (err) {
    console.error('[deplacement] courriel client échoué (non-bloquant)', { appointmentId: id, err });
  }
  try {
    await updateBookingTimesV2({ appointmentId: id, oldStartsAt, newStartsAt, newEndsAt });
  } catch (err) {
    console.error('[v2-sync] updateBookingTimesV2 échoué (non-bloquant)', { appointmentId: id, err });
  }

  return NextResponse.json(updated);
}
```

> Note : `buildBookingEmailData` est déjà importé à la Task 6. Si la Task 7 est exécutée seule, l'ajouter à l'import de `@/lib/holistic-booking-email`.

- [ ] **Step 3: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "appointments/\[id\]" || echo "OK"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/holistique/appointments/[id]/route.ts"
git commit -m "Deplacement RDV : handler PATCH (auth praticienne/admin, anti-conflit, maj agenda+courriel+V2)"
```

---

## Task 8: Composant client `RescheduleButton`

**Files:**
- Create: `src/app/(holistique)/soins/dashboard/praticien/RescheduleButton.tsx`

- [ ] **Step 1: Créer le composant**

Créer `src/app/(holistique)/soins/dashboard/praticien/RescheduleButton.tsx` :

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  appointmentId: string;
  /** Date/heure actuelle du RDV, ISO, pour préremplir le sélecteur. */
  currentStartsAt: string;
  /** Style du bouton : sombre (dashboard praticienne) ou clair (admin). */
  variant?: 'dark' | 'light';
}

/** Convertit une date ISO en valeur `datetime-local` (heure de Toronto). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  // Décale vers l'heure locale du navigateur puis tronque les secondes
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export default function RescheduleButton({ appointmentId, currentStartsAt, variant = 'dark' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toLocalInput(currentStartsAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/holistique/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startsAt: new Date(value).toISOString() }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? 'Échec du déplacement.');
          return;
        }
        setOpen(false);
        router.refresh();
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  const btnStyle: React.CSSProperties =
    variant === 'light'
      ? { padding: '6px 14px', fontSize: '0.8rem', background: '#EDE9FE', color: '#6B3FA0', border: '1px solid #C4B5FD', borderRadius: '6px', cursor: 'pointer' }
      : { padding: '9px 20px', fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(201,168,76,0.12)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '2px', cursor: 'pointer' };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={btnStyle}>
        Déplacer
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #C4B5FD' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" onClick={submit} disabled={pending} style={{ ...btnStyle, opacity: pending ? 0.6 : 1 }}>
          {pending ? '…' : 'Confirmer'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          disabled={pending}
          style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'transparent', color: '#9CA3AF', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "RescheduleButton" || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add "src/app/(holistique)/soins/dashboard/praticien/RescheduleButton.tsx"
git commit -m "UI : composant RescheduleButton (modale de deplacement de RDV)"
```

---

## Task 9: Bouton « Déplacer » dans le dashboard praticienne

**Files:**
- Modify: `src/app/(holistique)/soins/dashboard/praticien/page.tsx`

- [ ] **Step 1: Importer le composant**

Après `import CompleteAppointmentButton from './CompleteAppointmentButton';` ajouter :

```ts
import RescheduleButton from './RescheduleButton';
```

- [ ] **Step 2: Ajouter le bouton dans la carte RDV**

Dans le `.map((appt) => ...)` des `upcomingAppointments`, dans le `<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>` qui contient les actions, juste avant le `{appt.status === 'CONFIRMED' && (<CompleteAppointmentButton ... />)}`, ajouter :

```tsx
                      {appt.status === 'CONFIRMED' && (
                        <RescheduleButton
                          appointmentId={appt.id}
                          currentStartsAt={new Date(appt.startsAt).toISOString()}
                        />
                      )}
```

- [ ] **Step 3: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "dashboard/praticien/page" || echo "OK"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(holistique)/soins/dashboard/praticien/page.tsx"
git commit -m "Dashboard praticienne : bouton Deplacer sur les RDV confirmes"
```

---

## Task 10: Action « Déplacer » dans l'admin consultations

**Files:**
- Modify: `src/app/admin/consultations/page.tsx`

- [ ] **Step 1: Importer le composant**

Tout en haut de `src/app/admin/consultations/page.tsx`, après `import { prisma } from '@/lib/db';` :

```ts
import RescheduleButton from '@/app/(holistique)/soins/dashboard/praticien/RescheduleButton';
```

- [ ] **Step 2: Ajouter la colonne d'en-tête « Actions »**

Remplacer le tableau d'en-têtes :

```tsx
                {['Date', 'Client', 'Praticien', 'Statut', 'Paiement', 'Durée'].map((h) => (
```

par :

```tsx
                {['Date', 'Client', 'Praticien', 'Statut', 'Paiement', 'Durée', 'Actions'].map((h) => (
```

- [ ] **Step 3: Ajouter la cellule d'action**

Juste après la cellule `{/* Duration */}` (le `<td>` contenant `{durationMin(appt)} min`), ajouter une cellule Actions :

```tsx
                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    {appt.status === 'CONFIRMED' ? (
                      <RescheduleButton
                        appointmentId={appt.id}
                        currentStartsAt={new Date(appt.startsAt).toISOString()}
                        variant="light"
                      />
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
```

- [ ] **Step 4: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "admin/consultations" || echo "OK"`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/consultations/page.tsx"
git commit -m "Admin consultations : action Deplacer sur les RDV confirmes"
```

---

## Task 11: Route cron des rappels

**Files:**
- Create: `src/app/api/cron/holistic-reminders/route.ts`

- [ ] **Step 1: Créer la route**

Créer `src/app/api/cron/holistic-reminders/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildBookingEmailData, sendReminderToClient } from '@/lib/holistic-booking-email';

/**
 * GET /api/cron/holistic-reminders
 *
 * Envoie deux rappels au client : 3 jours avant et 24h avant le RDV.
 * Dédoublonné par `reminder3dSentAt` / `reminder24hSentAt`.
 * Auth : header x-cron-secret OU authorization: Bearer == process.env.CRON_SECRET.
 * Cron horaire (vercel.json).
 */

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return !!secret && secret === process.env.CRON_SECRET;
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  let sent3d = 0;
  let sent24h = 0;
  let failed = 0;

  // Rappel 3 jours : commence dans (24h, 72h], pas encore envoyé
  const due3d = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminder3dSentAt: null,
      startsAt: { gt: in24h, lte: in72h },
    },
    select: { id: true },
  });
  for (const a of due3d) {
    try {
      const data = await buildBookingEmailData(a.id);
      if (data) {
        await sendReminderToClient(data, '3d');
        await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder3dSentAt: new Date() } });
        sent3d++;
      }
    } catch (err) {
      failed++;
      console.error('[cron rappel 3j] échec', { appointmentId: a.id, err });
    }
  }

  // Rappel 24h : commence dans (now, 24h], pas encore envoyé
  const due24h = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      reminder24hSentAt: null,
      startsAt: { gt: now, lte: in24h },
    },
    select: { id: true },
  });
  for (const a of due24h) {
    try {
      const data = await buildBookingEmailData(a.id);
      if (data) {
        await sendReminderToClient(data, '24h');
        await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder24hSentAt: new Date() } });
        sent24h++;
      }
    } catch (err) {
      failed++;
      console.error('[cron rappel 24h] échec', { appointmentId: a.id, err });
    }
  }

  return NextResponse.json({ sent3d, sent24h, failed });
}
```

- [ ] **Step 2: Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-reminders" || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/cron/holistic-reminders/route.ts"
git commit -m "Cron : rappels client 3 jours + 24h avant le RDV"
```

---

## Task 12: Enregistrer le cron dans vercel.json

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Ajouter l'entrée cron**

Remplacer le contenu de `vercel.json` par :

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/clover-retry",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/clover-pull",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/holistic-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "Vercel : cron horaire pour les rappels holistiques"
```

---

## Task 13: Vérification finale + déploiement

- [ ] **Step 1: Typecheck complet (tous fichiers touchés)**

Run:
```bash
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-booking-email|google-calendar|holistic-v2-sync|appointments/\[id\]|RescheduleButton|dashboard/praticien/page|admin/consultations|holistic-reminders" || echo "OK: aucun fichier touché en erreur"
```
Expected: `OK: aucun fichier touché en erreur` (la seule erreur `src/` tolérée est `actions.ts` pré-existante).

- [ ] **Step 2: Lint des fichiers touchés (optionnel mais recommandé)**

Run: `npm run lint 2>&1 | tail -20`
Expected: pas de NOUVELLE erreur sur les fichiers créés/modifiés (le projet a une dette ESLint pré-existante ; ne pas régresser).

- [ ] **Step 3: Push (déclenche le déploiement Vercel + applique la migration)**

> Demander l'autorisation de l'utilisateur avant de pousser sur `main` (déploie en prod sur runesetmagie.ca).

```bash
git push origin main
```

- [ ] **Step 4: Vérification post-déploiement (manuel, en prod)**

Une fois le build Vercel terminé :
1. **Migration** : vérifier dans les logs de build Vercel que `migrate-deploy-safe.mjs` a appliqué `20260616000000_add_reminder_sent_at` sans erreur.
2. **Déplacement** : depuis le dashboard praticienne (ou `/admin/consultations`), déplacer un RDV de test confirmé → vérifier que la date change, que le client reçoit le courriel « déplacé », et (si Google Agenda connecté) que l'événement bouge dans l'agenda.
3. **Annulation** : annuler un RDV confirmé → vérifier les courriels (client + praticienne) et le retrait de l'événement agenda.
4. **Rappels** : déclencher le cron manuellement pour valider :
   ```bash
   curl -s -H "x-cron-secret: <CRON_SECRET>" https://www.runesetmagie.ca/api/cron/holistic-reminders
   ```
   Expected JSON : `{"sent3d":N,"sent24h":M,"failed":0}`.

- [ ] **Step 5: Mettre à jour la doc de suivi**

Déplacer ces features de `AMELIORATIONS-FUTURES.md` (priorité moyenne : « SMS de rappel », « Vue calendrier ») vers `SUIVI_HOLISTIQUE.md` comme livrées, et cocher les éléments correspondants. Commit :

```bash
git add ../AMELIORATIONS-FUTURES.md SUIVI_HOLISTIQUE.md
git commit -m "Doc : deplacement RDV + courriels annulation/rappel livres"
```

---

## Self-Review

- **Spec coverage :** B1 (buildBookingEmailData) → T2 ; B2 (updateCalendarEventForAppointment) → T4 ; B3 (colonnes) → T1 ; Feature 1 déplacement (API+UI praticienne+admin+email+agenda+V2+reset rappels) → T5/T7/T8/T9/T10 ; Feature 2 annulation → T3/T6 ; Feature 3 rappels 3j+24h → T3/T11/T12. Tous couverts.
- **Placeholders :** aucun ; code complet à chaque étape.
- **Cohérence des types :** `BookingEmailData` réutilisé partout ; `sendReminderToClient(data, lead)` signature identique en T3 et T11 ; `buildBookingEmailData(id)` identique en T2/T6/T7/T11 ; `updateBookingTimesV2({appointmentId, oldStartsAt, newStartsAt, newEndsAt})` identique en T5/T7 ; colonnes `reminder3dSentAt`/`reminder24hSentAt` identiques en T1/T7/T11.
- **Note inter-tâches :** T6 et T7 modifient le même fichier (`appointments/[id]/route.ts`) ; les imports de `buildBookingEmailData` (T6) et `sendRescheduleToClient`/`updateCalendarEventForAppointment`/`updateBookingTimesV2` (T7) doivent coexister — voir notes dans les tâches.
