# RDV manuel (praticienne / admin) + activation de compte client — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à la praticienne (pour elle-même) et à l'admin (pour n'importe quelle praticienne) de créer un RDV à la main pour une cliente — créneau bloqué immédiatement (statut CONFIRMED), trois modes de paiement (comptant / lien Stripe / virement Interac), création/activation du compte cliente, avec courriels adaptés et sync Google Agenda.

**Architecture:** App Next.js 16 (App Router, React 19) + Prisma 6/Supabase. Logique métier dans `src/lib/*`, route handlers dans `src/app/api/*`, UI client dans `src/components/holistique/` et les dashboards. Effets de bord (Daily.co, Google Agenda, Resend, Stripe, Booking V2) tous **best-effort** : ils ne bloquent jamais la requête. Jeton « définir mot de passe » signé HMAC (Node `crypto` + `AUTH_SECRET`), sans colonne DB, à usage unique (lié au hash courant).

**Tech Stack:** TypeScript, Prisma, Stripe, Resend (email), Daily.co, googleapis, bcryptjs, Node crypto.

## Global Constraints

*(Chaque tâche hérite implicitement de cette section.)*

- **Next.js 16.2.1 / React 19** : les route handlers `[id]` reçoivent `{ params }: { params: Promise<{ id: string }> }` (params est une **Promise** — `await params`). Avant d'utiliser une API App Router inhabituelle, lire `node_modules/next/dist/docs/` (cf. `AGENTS.md`).
- **Pas de framework de test dans ce projet** (aucun jest/vitest). Vérification par tâche = `tsc --noEmit` filtré sur les fichiers touchés. **Ne PAS introduire de harness de test** (hors périmètre, YAGNI). Commande réutilisée partout (remplacer `<FICHIER>` par un fragment de chemin) :
  ```bash
  node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "<FICHIER>" || echo "OK: pas d'erreur dans <FICHIER>"
  ```
  Erreurs pré-existantes à **ignorer** : bruit `.next/types/…`, et `src/app/admin/praticiens/modifications/actions.ts`.
- **Tout en français** : UI, courriels, messages d'erreur, commits, commentaires.
- **Prisma 6 / Supabase** : migration **additive nullable** ; appliquée automatiquement au build Vercel (`scripts/migrate-deploy-safe.mjs`). `npx prisma generate` régénère le client sous `src/generated/prisma`.
- **Auth** : NextAuth v5 (beta). Session via `holisticSession()` exposant `user.id`, `user.role` (`CLIENT|PRACTITIONER|ADMIN`), `user.practitionerId`. Hash mot de passe = `bcrypt.hash(pw, 12)` (`bcryptjs`). Signature de jeton = `process.env.AUTH_SECRET`.
- **Stripe** : `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any })`.
- **Email** : Resend, `from = process.env.FROM_EMAIL`, `APP_URL = process.env.NEXT_PUBLIC_APP_URL`. **Jamais** d'envoi à un compte interne (`isInternalEmail`).
- **`npm run dev` est cassé en local** (le `#` du dossier) — ne pas s'y fier ; le rendu se valide en prod après déploiement.
- **Commits + push** : commit français après chaque tâche. Le **push sur `main` déploie en prod** (runesetmagie.ca) ET applique la migration → **demander l'autorisation de l'utilisateur avant de pousser** (Task 14).

**Spec de référence :** `docs/superpowers/specs/2026-06-17-holistique-rdv-manuel-design.md`

---

## File Structure

- `prisma/schema.prisma` — +1 colonne `paymentMode` sur `HolisticAppointment`
- `prisma/migrations/20260617000000_add_payment_mode/migration.sql` — migration additive
- `src/lib/constants.ts` — +`INTERNAL_EMAIL_DOMAIN`, +config Interac
- `src/lib/holistic-password-token.ts` — **nouveau** : `signSetPasswordToken` / `verifySetPasswordToken`
- `src/lib/holistic-clients.ts` — **nouveau** : `isInternalEmail` / `findOrCreateHolisticClient`
- `src/lib/holistic-stripe.ts` — **nouveau** : `createHolisticPaymentLink`
- `src/lib/holistic-booking-email.ts` — +5 fonctions d'envoi (activation, lien Stripe, Interac, confirmation comptant, notif praticienne)
- `src/app/api/holistique/appointments/manual/route.ts` — **nouveau** : endpoint RDV manuel (POST)
- `src/app/api/holistique/auth/definir-mot-de-passe/route.ts` — **nouveau** : pose du mot de passe (POST)
- `src/app/(holistique)/soins/auth/definir-mot-de-passe/page.tsx` — **nouvelle** page
- `src/app/api/holistique/appointments/[id]/mark-paid/route.ts` — **nouveau** : marquer un virement payé (POST, admin)
- `src/components/holistique/ManualAppointmentButton.tsx` — **nouveau** composant client (modale, réutilisé)
- `src/components/holistique/MarkPaidButton.tsx` — **nouveau** petit composant client (admin)
- `src/app/(holistique)/soins/dashboard/praticien/page.tsx` — bouton « + Ajouter un rendez-vous »
- `src/app/admin/consultations/page.tsx` — bouton « + Ajouter » + sélecteur praticienne + « Marquer payé »
- `src/app/api/cron/holistic-reminders/route.ts` — garde `isInternalEmail`

> **Note webhook (aucun changement requis) :** le webhook Stripe (`src/app/api/holistique/webhooks/stripe/route.ts`) est **déjà idempotent** pour le flux Stripe-link manuel — `createCalendarEventForAppointment` ne recrée pas si `googleEventId` existe, et `createDailyRoomForAppointment` réutilise une salle existante. Au paiement d'un lien manuel, le webhook met `HolisticPayment` → `PAID`, renvoie la confirmation finale, sans rien dupliquer. Ne pas le modifier.

---

## Task 1 : Colonne `paymentMode` (schéma + migration)

**Files:**
- Modify: `prisma/schema.prisma` (modèle `HolisticAppointment`)
- Create: `prisma/migrations/20260617000000_add_payment_mode/migration.sql`

**Interfaces:**
- Produces: champ `HolisticAppointment.paymentMode: string | null` (valeurs `CASH | STRIPE_LINK | INTERAC`).

- [ ] **Step 1 : Ajouter le champ au schéma**

Dans `prisma/schema.prisma`, modèle `HolisticAppointment`, juste après la ligne `notes          String?` :

```prisma
  paymentMode    String? // RDV manuel : CASH | STRIPE_LINK | INTERAC (null = parcours public Stripe)
```

- [ ] **Step 2 : Créer la migration SQL**

Créer `prisma/migrations/20260617000000_add_payment_mode/migration.sql` :

```sql
-- AlterTable: mode de paiement des RDV manuels (colonne additive nullable)
ALTER TABLE "HolisticAppointment" ADD COLUMN "paymentMode" TEXT;
```

- [ ] **Step 3 : Régénérer le client Prisma**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sans erreur (le champ `paymentMode` apparaît dans le client généré).

- [ ] **Step 4 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "schema|HolisticAppointment" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 5 : Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260617000000_add_payment_mode
git commit -m "DB : colonne paymentMode sur HolisticAppointment (RDV manuel)"
```

---

## Task 2 : Constantes (domaine interne + Interac)

**Files:**
- Modify: `src/lib/constants.ts`

**Interfaces:**
- Produces: `INTERNAL_EMAIL_DOMAIN`, `INTERAC_EMAIL`, `INTERAC_MESSAGE`, `INTERAC_ANSWER` (string).

- [ ] **Step 1 : Ajouter les constantes**

À la fin de `src/lib/constants.ts`, ajouter :

```ts
/**
 * Domaine interne NON routable (TLD `.invalid`, réservé RFC 2606) pour les clientes
 * créées sans courriel lors d'un RDV manuel. Aucun courriel n'est jamais envoyé à
 * une adresse de ce domaine (cf. `isInternalEmail` dans holistic-clients.ts).
 */
export const INTERNAL_EMAIL_DOMAIN = 'interne.invalid';

/** Virement Interac — paramètres affichés dans le courriel « infos de virement ». */
export const INTERAC_EMAIL = 'comptabilite@runesetmagie.ca';
export const INTERAC_MESSAGE = 'Inscrivez votre nom dans la description du virement.';
export const INTERAC_ANSWER = 'Magie123'; // réponse secrète / mot de passe du virement
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "constants" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add src/lib/constants.ts
git commit -m "Config : domaine interne + parametres de virement Interac"
```

---

## Task 3 : Jeton « définir mot de passe » (lib)

**Files:**
- Create: `src/lib/holistic-password-token.ts`

**Interfaces:**
- Consumes: `process.env.AUTH_SECRET`, `prisma`.
- Produces:
  - `signSetPasswordToken(user: { id: string; hashedPassword: string }): string`
  - `verifySetPasswordToken(token: string): Promise<string | null>` (retourne l'`id` utilisateur si valide).

- [ ] **Step 1 : Créer la lib**

Créer `src/lib/holistic-password-token.ts` :

```ts
/**
 * Jeton signé « définir mon mot de passe » — sans colonne DB, sans dépendance externe.
 *
 * Format : `<payloadBase64url>.<hmacBase64url>` où le HMAC-SHA256 (clé = AUTH_SECRET)
 * couvre `<payload>.<hashedPassword actuel>`. Lier la signature au hash courant rend
 * le jeton À USAGE UNIQUE : dès que la cliente définit son mot de passe, le hash change
 * et l'ancien jeton ne valide plus. Réutilisable tel quel pour un futur « mot de passe oublié ».
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET manquant — requis pour signer les jetons de mot de passe');
  return s;
}

function sign(payloadB64: string, hashedPassword: string): string {
  return createHmac('sha256', getSecret()).update(`${payloadB64}.${hashedPassword}`).digest('base64url');
}

/** Signe un jeton lié au hash actuel de l'utilisateur (→ usage unique). */
export function signSetPasswordToken(user: { id: string; hashedPassword: string }): string {
  const payload = { uid: user.id, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64, user.hashedPassword)}`;
}

/** Vérifie un jeton ; retourne l'id utilisateur si valide et non expiré, sinon null. */
export async function verifySetPasswordToken(token: string): Promise<string | null> {
  try {
    const [payloadB64, sig] = (token ?? '').split('.');
    if (!payloadB64 || !sig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      uid?: string;
      exp?: number;
    };
    if (!payload?.uid || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;

    const user = await prisma.holisticUser.findUnique({
      where: { id: payload.uid },
      select: { id: true, hashedPassword: true },
    });
    if (!user) return null;

    const expected = sign(payloadB64, user.hashedPassword);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return user.id;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-password-token" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add src/lib/holistic-password-token.ts
git commit -m "Auth : jeton signe definir-mot-de-passe (HMAC, usage unique, sans colonne DB)"
```

---

## Task 4 : Compte cliente (lib)

**Files:**
- Create: `src/lib/holistic-clients.ts`

**Interfaces:**
- Consumes: `bcryptjs`, `prisma`, `INTERNAL_EMAIL_DOMAIN` (Task 2).
- Produces:
  - `isInternalEmail(email: string | null | undefined): boolean`
  - `findOrCreateHolisticClient(input: { firstName: string; lastName: string; phone: string; email?: string | null }): Promise<{ user: { id: string; email: string; firstName: string; lastName: string; hashedPassword: string; phone: string | null }; created: boolean; internal: boolean }>`

- [ ] **Step 1 : Créer la lib**

Créer `src/lib/holistic-clients.ts` :

```ts
/**
 * Helpers de compte cliente pour le RDV manuel.
 *  - findOrCreateHolisticClient : retrouve (par courriel) ou crée un HolisticUser CLIENT.
 *    Sans courriel → compte « interne » avec adresse non routable dérivée du téléphone.
 *  - isInternalEmail : true pour ces comptes internes (→ aucun courriel ne leur est envoyé).
 */
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { INTERNAL_EMAIL_DOMAIN } from '@/lib/constants';

/** True si l'adresse appartient au domaine interne non routable (compte sans courriel). */
export function isInternalEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

/** Adresse interne dérivée du téléphone (chiffres uniquement), repli aléatoire si vide. */
function internalEmailFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '') || randomBytes(5).toString('hex');
  return `${digits}@${INTERNAL_EMAIL_DOMAIN}`;
}

export async function findOrCreateHolisticClient(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}): Promise<{
  user: { id: string; email: string; firstName: string; lastName: string; hashedPassword: string; phone: string | null };
  created: boolean;
  internal: boolean;
}> {
  const rawEmail = (input.email ?? '').trim().toLowerCase();
  const internal = rawEmail === '';
  const email = internal ? internalEmailFromPhone(input.phone) : rawEmail;

  const existing = await prisma.holisticUser.findUnique({ where: { email } });
  if (existing) {
    return { user: existing, created: false, internal };
  }

  // Mot de passe aléatoire haché : champ jamais vide ; inutilisable tant que la cliente
  // n'a pas défini le sien via le courriel d'activation (compte interne = jamais).
  const randomPassword = randomBytes(24).toString('hex');
  const hashedPassword = await bcrypt.hash(randomPassword, 12);
  const user = await prisma.holisticUser.create({
    data: {
      email,
      hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: 'CLIENT',
    },
  });
  return { user, created: true, internal };
}
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-clients" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add src/lib/holistic-clients.ts
git commit -m "Clients : findOrCreateHolisticClient + isInternalEmail (compte interne sans courriel)"
```

---

## Task 5 : Lien de paiement Stripe (lib)

**Files:**
- Create: `src/lib/holistic-stripe.ts`

**Interfaces:**
- Produces: `createHolisticPaymentLink(params): Promise<string | null>` (retourne l'URL Checkout).
  `params = { appointmentId: string; v2BookingId?: string | null; practitioner: { stripeAccountId: string | null; stripeAccountReady: boolean; commissionPct: number }; amountCad: number; productName: string; description: string; returnBase: string }`

> Le webhook existant (`checkout.session.completed`) lit `metadata.appointmentId` + `usesDeposit: 'false'` → passe `HolisticPayment` à `PAID` et envoie la confirmation finale. **Validité du lien : 24 h** (limite des sessions Stripe Checkout). Si un lien plus long est requis un jour, migrer vers Stripe Payment Links — hors périmètre ici.

- [ ] **Step 1 : Créer la lib**

Créer `src/lib/holistic-stripe.ts` :

```ts
/**
 * Création d'un lien de paiement Stripe (montant complet, sans acompte) pour un RDV manuel.
 * Réutilise le webhook holistique existant via metadata.appointmentId. Best-effort côté caller.
 *
 * Limite Stripe Checkout : la session expire après 24 h (défaut). Pour un lien plus durable,
 * voir Stripe Payment Links (hors périmètre).
 */
import Stripe from 'stripe';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' as any });

export async function createHolisticPaymentLink(params: {
  appointmentId: string;
  v2BookingId?: string | null;
  practitioner: { stripeAccountId: string | null; stripeAccountReady: boolean; commissionPct: number };
  amountCad: number;
  productName: string;
  description: string;
  returnBase: string;
}): Promise<string | null> {
  const { appointmentId, v2BookingId, practitioner, amountCad, productName, description, returnBase } = params;
  const usesStripeConnect = !!(practitioner.stripeAccountId && practitioner.stripeAccountReady);
  const commissionRate = (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkoutParams: any = {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: { name: productName, description },
          unit_amount: Math.round(amountCad * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId,
      amountTotalCad: amountCad.toFixed(2),
      usesDeposit: 'false', // paiement complet → webhook marque HolisticPayment PAID
      payoutMode: usesStripeConnect ? 'auto-split' : 'manual',
      ...(v2BookingId ? { v2BookingId } : {}),
    },
    success_url: `${returnBase}/soins/reservation-confirmee?appointment=${appointmentId}`,
    cancel_url: `${returnBase}/soins/dashboard/client`,
    mode: 'payment',
  };

  if (usesStripeConnect) {
    const commissionOnThisCharge = amountCad * commissionRate;
    checkoutParams.payment_intent_data = {
      application_fee_amount: Math.round(commissionOnThisCharge * 100),
      transfer_data: { destination: practitioner.stripeAccountId },
    };
  }

  const session = await stripe.checkout.sessions.create(checkoutParams);
  return session.url;
}
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-stripe" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add src/lib/holistic-stripe.ts
git commit -m "Stripe : createHolisticPaymentLink (lien de paiement RDV manuel)"
```

---

## Task 6 : Courriels du RDV manuel

**Files:**
- Modify: `src/lib/holistic-booking-email.ts` (imports + ajout en fin de fichier)

**Interfaces:**
- Consumes: `BookingEmailData`, `emailShell`, `locationHtml`, `formatMontrealDateTime`, `FROM`, `APP_URL`, `resend` (déjà dans le fichier) ; `INTERAC_EMAIL`/`INTERAC_MESSAGE`/`INTERAC_ANSWER` (Task 2).
- Produces (toutes `: Promise<void>`) :
  - `sendSetPasswordEmail(data: BookingEmailData, token: string)`
  - `sendManualCashConfirmationToClient(data: BookingEmailData)`
  - `sendPaymentLinkToClient(data: BookingEmailData, paymentUrl: string)`
  - `sendInteracInstructionsToClient(data: BookingEmailData)`
  - `sendManualNotificationToPractitioner(data: BookingEmailData, clientPhone: string, paymentMode: string)`

- [ ] **Step 1 : Importer la config Interac**

En haut de `src/lib/holistic-booking-email.ts`, remplacer :

```ts
import { BOUTIQUE_LOCATION } from '@/lib/constants';
```

par :

```ts
import { BOUTIQUE_LOCATION, INTERAC_EMAIL, INTERAC_MESSAGE, INTERAC_ANSWER } from '@/lib/constants';
```

- [ ] **Step 2 : Ajouter les 5 fonctions en fin de fichier**

À la fin de `src/lib/holistic-booking-email.ts`, ajouter :

```ts
/** Libellé lisible d'un mode de paiement manuel. */
function paymentModeLabel(mode: string): string {
  if (mode === 'CASH') return 'Comptant';
  if (mode === 'STRIPE_LINK') return 'Lien de paiement (carte)';
  if (mode === 'INTERAC') return 'Virement Interac';
  return mode;
}

/** Bloc HTML « récap du RDV » (service, praticienne, date, lieu/lien). */
function bookingRecapHtml(data: BookingEmailData): string {
  return `
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Praticien·ne :</strong> ${data.practitionerFirstName} ${data.practitionerLastName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date et heure :</strong> ${formatMontrealDateTime(data.startsAt)}</p>
      ${locationHtml(data)}
    </div>`;
}

/** Courriel d'ACTIVATION (nouveau compte) : bienvenue + lien « définir mon mot de passe » + récap RDV. */
export async function sendSetPasswordEmail(data: BookingEmailData, token: string): Promise<void> {
  const setUrl = `${APP_URL}/soins/auth/definir-mot-de-passe?token=${encodeURIComponent(token)}`;
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Bienvenue chez Runes &amp; Magie ✨</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, un compte a été créé pour toi afin de suivre ton rendez-vous.
      Choisis ton mot de passe pour l'activer :
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${setUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Définir mon mot de passe</a>
    </div>
    ${bookingRecapHtml(data)}
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(74,45,122,0.3);">
      Ce lien est valide 7 jours. Une question ? Écris-nous à <a href="mailto:info@runesetmagie.ca" style="color:#2EC4B6;">info@runesetmagie.ca</a>.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Activation compte (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: 'Crée ton mot de passe — Runes & Magie', html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi activation compte', err);
  }
}

/** Courriel de confirmation d'un RDV manuel réglé COMPTANT (compte déjà existant). */
export async function sendManualCashConfirmationToClient(data: BookingEmailData): Promise<void> {
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous est confirmé ✨</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance est réservée. Voici un récapitulatif :
    </p>
    ${bookingRecapHtml(data)}
    <div style="background:rgba(46,196,182,0.1);border:1px solid rgba(46,196,182,0.3);border-radius:6px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#E8DCC8;font-size:14px;"><strong>Paiement :</strong> réglé comptant — ${data.totalAmount.toFixed(2)} $</p>
    </div>
  `);
  if (!resend) {
    console.log('[Email holistique] Confirmation comptant (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Confirmation de ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi confirmation comptant', err);
  }
}

/** Courriel avec le LIEN DE PAIEMENT Stripe (RDV réservé, à régler en ligne). */
export async function sendPaymentLinkToClient(data: BookingEmailData, paymentUrl: string): Promise<void> {
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous est réservé 💳</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance est réservée. Il reste à régler le paiement :
    </p>
    ${bookingRecapHtml(data)}
    <div style="text-align:center;margin:24px 0;">
      <a href="${paymentUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">Payer ${data.totalAmount.toFixed(2)} $</a>
    </div>
    <p style="color:rgba(245,240,232,0.5);font-size:13px;line-height:1.6;margin:16px 0 0;">
      Ce lien de paiement est valide 24 h. Tu recevras une confirmation dès le paiement reçu.
    </p>
  `);
  if (!resend) {
    console.log('[Email holistique] Lien de paiement (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Paiement de ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi lien de paiement', err);
  }
}

/** Courriel avec les INSTRUCTIONS DE VIREMENT Interac. */
export async function sendInteracInstructionsToClient(data: BookingEmailData): Promise<void> {
  const html = emailShell(`
    <h2 style="color:#C9A84C;font-size:22px;margin:0 0 16px;">Ton rendez-vous est réservé 🏦</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.clientFirstName}, ta séance est réservée. Merci de régler par virement Interac :
    </p>
    ${bookingRecapHtml(data)}
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#C9A84C;font-size:14px;"><strong>💳 Virement Interac</strong></p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Destinataire :</strong> ${INTERAC_EMAIL}</p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Montant :</strong> ${data.totalAmount.toFixed(2)} $</p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Description :</strong> ${INTERAC_MESSAGE}</p>
      <p style="margin:4px 0;color:#E8DCC8;font-size:14px;"><strong>Réponse secrète :</strong> ${INTERAC_ANSWER}</p>
    </div>
  `);
  if (!resend) {
    console.log('[Email holistique] Infos Interac (Resend non configuré) :', data.clientEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.clientEmail, subject: `Virement pour ton RDV — ${data.serviceName}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi infos Interac', err);
  }
}

/** Courriel à la PRATICIENNE : un RDV a été ajouté manuellement (par l'admin). */
export async function sendManualNotificationToPractitioner(
  data: BookingEmailData,
  clientPhone: string,
  paymentMode: string,
): Promise<void> {
  const dashboardUrl = `${APP_URL}/soins/dashboard/praticien`;
  const html = emailShell(`
    <h2 style="color:#2EC4B6;font-size:22px;margin:0 0 16px;">📅 Nouveau rendez-vous ajouté</h2>
    <p style="color:#F5F0E8;font-size:16px;line-height:1.6;">
      Bonjour ${data.practitionerFirstName}, un rendez-vous a été ajouté à ton agenda.
    </p>
    <div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:20px 0;">
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Client·e :</strong> ${data.clientFirstName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Téléphone :</strong> ${clientPhone}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Service :</strong> ${data.serviceName}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Date et heure :</strong> ${formatMontrealDateTime(data.startsAt)}</p>
      <p style="margin:4px 0;color:#E8DCC8;"><strong>Paiement :</strong> ${paymentModeLabel(paymentMode)}</p>
    </div>
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#4A2D7A,#2D1B4E);color:#C9A84C;text-decoration:none;border-radius:4px;font-size:14px;">Voir mon tableau de bord</a>
    </div>
  `, 'Runes &amp; Magie — Notification automatique');
  if (!resend) {
    console.log('[Email holistique] Notif praticienne RDV manuel (Resend non configuré) :', data.practitionerEmail);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to: data.practitionerEmail, subject: `Nouveau RDV — ${data.clientFirstName} le ${formatMontrealDateTime(data.startsAt)}`, html });
  } catch (err) {
    console.error('[Email holistique] Échec envoi notif praticienne RDV manuel', err);
  }
}
```

- [ ] **Step 3 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-booking-email" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 4 : Commit**

```bash
git add src/lib/holistic-booking-email.ts
git commit -m "Email : courriels RDV manuel (activation, comptant, lien Stripe, Interac, notif praticienne)"
```

---

## Task 7 : Endpoint RDV manuel

**Files:**
- Create: `src/app/api/holistique/appointments/manual/route.ts`

**Interfaces:**
- Consumes: tout des Tasks 2-6 + `holisticSession`, `prisma`, `createDailyRoomForAppointment`, `createCalendarEventForAppointment`, `getBusyPeriods`, `mirrorAppointmentToBooking`, `mirrorPaymentToV2`, `buildBookingEmailData`.
- Produces: `POST /api/holistique/appointments/manual` → `201 { appointmentId, paymentMode, paymentLink }`.

- [ ] **Step 1 : Créer la route**

Créer `src/app/api/holistique/appointments/manual/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import { findOrCreateHolisticClient, isInternalEmail } from '@/lib/holistic-clients';
import { signSetPasswordToken } from '@/lib/holistic-password-token';
import { createHolisticPaymentLink } from '@/lib/holistic-stripe';
import { createDailyRoomForAppointment } from '@/lib/daily-co';
import { createCalendarEventForAppointment, getBusyPeriods } from '@/lib/google-calendar';
import { mirrorAppointmentToBooking, mirrorPaymentToV2 } from '@/lib/holistic-v2-sync';
import {
  buildBookingEmailData,
  sendSetPasswordEmail,
  sendManualCashConfirmationToClient,
  sendPaymentLinkToClient,
  sendInteracInstructionsToClient,
  sendManualNotificationToPractitioner,
} from '@/lib/holistic-booking-email';

/** Domaine de retour Stripe : origine de la requête si runesetmagie/vercel, sinon APP_URL. */
function getReturnBase(req: Request): string {
  const origin = (req.headers.get('origin') ?? '').trim();
  if (/^https:\/\/([a-z0-9-]+\.)*(runesetmagie\.ca|vercel\.app)$/i.test(origin)) return origin;
  const raw = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca').trim();
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
    const session = await holisticSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { practitionerId, client, offeringId, startsAt, mode, paymentMode, notes } = body ?? {};

    // Auth : admin (n'importe quelle praticienne) OU praticienne (elle-même uniquement)
    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.role === 'PRACTITIONER' && user.practitionerId === practitionerId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Action réservée à la praticienne ou à un admin' }, { status: 403 });
    }

    // Validation de base
    if (!practitionerId || !offeringId || !startsAt || !client?.firstName || !client?.lastName || !client?.phone) {
      return NextResponse.json({ error: 'Champs requis manquants (cliente, soin, date).' }, { status: 400 });
    }
    const modeValue: 'IN_PERSON' | 'VIRTUAL' = mode === 'VIRTUAL' ? 'VIRTUAL' : 'IN_PERSON';
    const payment: 'CASH' | 'STRIPE_LINK' | 'INTERAC' | null =
      paymentMode === 'CASH' || paymentMode === 'STRIPE_LINK' || paymentMode === 'INTERAC' ? paymentMode : null;
    if (!payment) return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 });

    const email = typeof client.email === 'string' ? client.email.trim() : '';
    if (!email && payment !== 'CASH') {
      return NextResponse.json(
        { error: 'Un courriel est requis pour le paiement par lien Stripe ou par virement.' },
        { status: 400 },
      );
    }

    const practitioner = await prisma.practitioner.findUnique({
      where: { id: practitionerId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!practitioner) return NextResponse.json({ error: 'Praticienne introuvable' }, { status: 404 });

    const offering = await prisma.offering.findUnique({ where: { id: offeringId } });
    if (!offering || offering.practitionerId !== practitionerId) {
      return NextResponse.json({ error: 'Soin introuvable pour cette praticienne' }, { status: 404 });
    }

    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    if (start.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 });
    }
    const end = new Date(start.getTime() + offering.durationMinutes * 60 * 1000);

    // Conflit avec un RDV non annulé de la praticienne (chevauchement)
    const conflict = await prisma.holisticAppointment.findFirst({
      where: {
        practitionerId,
        status: { not: 'CANCELLED' },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
    });
    if (conflict) {
      return NextResponse.json({ error: 'Ce créneau chevauche un autre rendez-vous.' }, { status: 409 });
    }

    // Conflit avec l'agenda Google (best-effort — ignoré si non connectée)
    try {
      const busy = await getBusyPeriods(practitionerId, start, end);
      const overlaps = busy.some((b) => new Date(b.start) < end && new Date(b.end) > start);
      if (overlaps) {
        return NextResponse.json(
          { error: 'Ce créneau est occupé dans l\'agenda Google de la praticienne.' },
          { status: 409 },
        );
      }
    } catch (err) {
      console.error('[rdv manuel] vérif Google free/busy échouée (non-bloquant)', err);
    }

    // Retrouve ou crée le compte cliente
    const { user: clientUser, created } = await findOrCreateHolisticClient({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: email || null,
    });

    // Notes enrichies (même format que le parcours public → parsé par buildBookingEmailData / Google)
    const enrichedNotes = [
      `Service : ${offering.name}`,
      `Mode : ${modeValue === 'IN_PERSON' ? 'Présentiel' : 'Virtuel (vidéo)'}`,
      typeof notes === 'string' && notes.trim() ? notes.trim() : null,
    ]
      .filter(Boolean)
      .join('\n');

    const amountTotal = offering.price;
    const commissionRate = (practitioner.commissionPct ?? parseFloat(process.env.COMMISSION_RATE || '35')) / 100;
    const amountCommission = amountTotal * commissionRate;
    const amountPractitioner = amountTotal - amountCommission;

    // RDV créé CONFIRMED → créneau bloqué immédiatement
    const appointment = await prisma.holisticAppointment.create({
      data: {
        clientId: clientUser.id,
        practitionerId,
        startsAt: start,
        endsAt: end,
        status: 'CONFIRMED',
        notes: enrichedNotes,
        paymentMode: payment,
        totalAmount: amountTotal,
        ...(payment === 'CASH' ? { depositPaidAt: new Date() } : {}),
      },
    });

    // Paiement : PAID pour comptant (réglé), PENDING pour Stripe/Interac
    await prisma.holisticPayment.create({
      data: {
        appointmentId: appointment.id,
        amountTotal,
        amountCommission,
        amountPractitioner,
        status: payment === 'CASH' ? 'PAID' : 'PENDING',
        paidAt: payment === 'CASH' ? new Date() : null,
      },
    });

    // Salle Daily si virtuel (best-effort)
    if (modeValue === 'VIRTUAL') {
      try {
        await createDailyRoomForAppointment({ appointmentId: appointment.id, endsAt: end });
      } catch (err) {
        console.error('[rdv manuel] création salle Daily échouée (non-bloquant)', err);
      }
    }

    // Événement Google (best-effort) — le créneau apparaît tout de suite chez la praticienne
    try {
      await createCalendarEventForAppointment(appointment.id);
    } catch (err) {
      console.error('[rdv manuel] création événement Google échouée (non-bloquant)', err);
    }

    // Sync V2 (best-effort)
    let v2BookingId: string | null = null;
    try {
      const booking = await mirrorAppointmentToBooking({ appointment, noStripeFlow: true });
      v2BookingId = booking?.id ?? null;
      if (booking) {
        await mirrorPaymentToV2({
          bookingId: booking.id,
          amountTotal,
          amountCommission,
          amountPractitioner,
          commissionPct: commissionRate * 100,
          status: payment === 'CASH' ? 'PAID' : 'PENDING',
        });
      }
    } catch (err) {
      console.error('[rdv manuel] sync V2 échouée (non-bloquant)', err);
    }

    // Lien Stripe si demandé
    let paymentLink: string | null = null;
    if (payment === 'STRIPE_LINK') {
      try {
        paymentLink = await createHolisticPaymentLink({
          appointmentId: appointment.id,
          v2BookingId,
          practitioner: {
            stripeAccountId: practitioner.stripeAccountId,
            stripeAccountReady: practitioner.stripeAccountReady,
            commissionPct: practitioner.commissionPct,
          },
          amountCad: amountTotal,
          productName: `${offering.name} — ${practitioner.user.firstName} ${practitioner.user.lastName}`.trim(),
          description: `Séance du ${start.toLocaleDateString('fr-CA')}`,
          returnBase: getReturnBase(req),
        });
      } catch (err) {
        console.error('[rdv manuel] création lien Stripe échouée (non-bloquant)', err);
      }
    }

    // Courriels (best-effort) — jamais aux comptes internes
    try {
      const data = await buildBookingEmailData(appointment.id);
      if (data) {
        if (!isInternalEmail(data.clientEmail)) {
          if (created) {
            const token = signSetPasswordToken({ id: clientUser.id, hashedPassword: clientUser.hashedPassword });
            await sendSetPasswordEmail(data, token);
          }
          if (payment === 'CASH' && !created) await sendManualCashConfirmationToClient(data);
          if (payment === 'STRIPE_LINK' && paymentLink) await sendPaymentLinkToClient(data, paymentLink);
          if (payment === 'INTERAC') await sendInteracInstructionsToClient(data);
        }
        // Notif praticienne uniquement si l'admin a créé le RDV pour elle
        if (isAdmin) {
          await sendManualNotificationToPractitioner(data, client.phone, payment);
        }
      }
    } catch (err) {
      console.error('[rdv manuel] envoi courriels échoué (non-bloquant)', err);
    }

    return NextResponse.json({ appointmentId: appointment.id, paymentMode: payment, paymentLink }, { status: 201 });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    console.error('[POST /api/holistique/appointments/manual] error', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: e?.message ?? 'Erreur lors de la création du rendez-vous.' }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "appointments/manual" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add "src/app/api/holistique/appointments/manual/route.ts"
git commit -m "RDV manuel : endpoint POST (compte cliente, conflits DB+Google, 3 paiements, courriels)"
```

---

## Task 8 : Page + endpoint « définir mon mot de passe »

**Files:**
- Create: `src/app/api/holistique/auth/definir-mot-de-passe/route.ts`
- Create: `src/app/(holistique)/soins/auth/definir-mot-de-passe/page.tsx`

**Interfaces:**
- Consumes: `verifySetPasswordToken` (Task 3), `prisma`, `bcryptjs`.
- Produces: `POST /api/holistique/auth/definir-mot-de-passe` `{ token, password }` → `200 { ok: true }` / `401` / `400`.

- [ ] **Step 1 : Créer l'endpoint**

Créer `src/app/api/holistique/auth/definir-mot-de-passe/route.ts` :

```ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { verifySetPasswordToken } from '@/lib/holistic-password-token';

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
  }

  const uid = await verifySetPasswordToken(typeof token === 'string' ? token : '');
  if (!uid) return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 401 });

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.holisticUser.update({ where: { id: uid }, data: { hashedPassword } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2 : Créer la page**

Créer `src/app/(holistique)/soins/auth/definir-mot-de-passe/page.tsx` :

```tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function DefinirMotDePasseForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.');
    setPending(true);
    try {
      const res = await fetch('/api/holistique/auth/definir-mot-de-passe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? 'Échec. Réessaie.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/soins/auth/login'), 1800);
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setPending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    marginTop: '6px',
    borderRadius: '4px',
    border: '1px solid rgba(201,168,76,0.3)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--parchemin)',
    fontSize: '1rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir-nuit)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--charbon-mystere)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', padding: '40px 32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.4rem', color: 'var(--or-ancien)', marginBottom: '24px', textAlign: 'center' }}>
          Définir mon mot de passe
        </h1>
        {done ? (
          <p style={{ color: 'var(--turquoise-cristal)', textAlign: 'center', fontSize: '1rem' }}>
            ✓ Mot de passe enregistré. Redirection vers la connexion…
          </p>
        ) : !token ? (
          <p style={{ color: '#f87171', textAlign: 'center' }}>Lien invalide : jeton manquant.</p>
        ) : (
          <form onSubmit={submit}>
            <label style={{ display: 'block', color: 'rgba(232,220,190,0.7)', fontSize: '0.85rem' }}>
              Nouveau mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>
            <label style={{ display: 'block', color: 'rgba(232,220,190,0.7)', fontSize: '0.85rem', marginTop: '16px' }}>
              Confirmer le mot de passe
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" />
            </label>
            {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
            <button
              type="submit"
              disabled={pending}
              style={{ width: '100%', marginTop: '24px', padding: '12px', background: 'linear-gradient(135deg,#4A2D7A,#2D1B4E)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '4px', fontSize: '0.9rem', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}
            >
              {pending ? '…' : 'Activer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DefinirMotDePassePage() {
  return (
    <Suspense fallback={null}>
      <DefinirMotDePasseForm />
    </Suspense>
  );
}
```

- [ ] **Step 3 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "definir-mot-de-passe" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 4 : Commit**

```bash
git add "src/app/api/holistique/auth/definir-mot-de-passe/route.ts" "src/app/(holistique)/soins/auth/definir-mot-de-passe/page.tsx"
git commit -m "Auth : page + endpoint definir-mot-de-passe (active le compte via jeton signe)"
```

---

## Task 9 : Endpoint « marquer un virement payé »

**Files:**
- Create: `src/app/api/holistique/appointments/[id]/mark-paid/route.ts`

**Interfaces:**
- Produces: `POST /api/holistique/appointments/[id]/mark-paid` → `200 { ok: true }` (admin only, INTERAC uniquement).

- [ ] **Step 1 : Créer la route**

Créer `src/app/api/holistique/appointments/[id]/mark-paid/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/holistique/appointments/[id]/mark-paid
 * Marque un virement Interac comme reçu (admin only). Passe HolisticPayment → PAID.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await holisticSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Action réservée à un admin' }, { status: 403 });
  }

  const { id } = await params;
  const appt = await prisma.holisticAppointment.findUnique({ where: { id }, include: { payment: true } });
  if (!appt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  if (appt.paymentMode !== 'INTERAC') {
    return NextResponse.json({ error: 'Action réservée aux virements Interac' }, { status: 400 });
  }
  if (appt.payment?.status === 'PAID') {
    return NextResponse.json({ error: 'Ce paiement est déjà réglé' }, { status: 400 });
  }

  await prisma.holisticPayment.update({
    where: { appointmentId: id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  await prisma.holisticAppointment.update({ where: { id }, data: { depositPaidAt: new Date() } });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "mark-paid" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add "src/app/api/holistique/appointments/[id]/mark-paid/route.ts"
git commit -m "Paiement : endpoint mark-paid (admin marque un virement Interac recu)"
```

---

## Task 10 : Composant `ManualAppointmentButton`

**Files:**
- Create: `src/components/holistique/ManualAppointmentButton.tsx`

**Interfaces:**
- Consumes: `POST /api/holistique/appointments/manual` (Task 7).
- Produces (props) :
  ```ts
  interface OfferingOption { id: string; name: string; durationMinutes: number; price: number }
  interface PractitionerOption { id: string; name: string; offerings: OfferingOption[] }
  interface Props { practitioners: PractitionerOption[]; lockedPractitionerId?: string; variant?: 'dark' | 'light' }
  ```

- [ ] **Step 1 : Créer le composant**

Créer `src/components/holistique/ManualAppointmentButton.tsx` :

```tsx
'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface OfferingOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}
interface PractitionerOption {
  id: string;
  name: string;
  offerings: OfferingOption[];
}
interface Props {
  practitioners: PractitionerOption[];
  /** Si fourni, la praticienne est imposée (cas dashboard praticienne) — pas de sélecteur. */
  lockedPractitionerId?: string;
  variant?: 'dark' | 'light';
}

export default function ManualAppointmentButton({ practitioners, lockedPractitionerId, variant = 'dark' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [practitionerId, setPractitionerId] = useState(lockedPractitionerId ?? practitioners[0]?.id ?? '');
  const [offeringId, setOfferingId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'STRIPE_LINK' | 'INTERAC'>('CASH');
  const [notes, setNotes] = useState('');

  const offerings = useMemo(
    () => practitioners.find((p) => p.id === practitionerId)?.offerings ?? [],
    [practitioners, practitionerId],
  );
  const hasEmail = email.trim().length > 0;

  function reset() {
    setOfferingId(''); setFirstName(''); setLastName(''); setPhone(''); setEmail('');
    setStartsAt(''); setMode('IN_PERSON'); setPaymentMode('CASH'); setNotes('');
    setError(null); setInfo(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);
    if (!practitionerId || !offeringId || !firstName || !lastName || !phone || !startsAt) {
      setError('Remplis la praticienne, le soin, la cliente (prénom, nom, téléphone) et la date.');
      return;
    }
    if (!hasEmail && paymentMode !== 'CASH') {
      setError('Sans courriel, seul le paiement comptant est possible.');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/holistique/appointments/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            practitionerId,
            offeringId,
            startsAt: new Date(startsAt).toISOString(),
            mode,
            paymentMode,
            notes: notes.trim() || undefined,
            client: { firstName, lastName, phone, email: email.trim() || undefined },
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(j.error ?? 'Échec de la création.');
          return;
        }
        if (j.paymentLink) {
          setInfo('RDV créé. Lien de paiement envoyé par courriel.');
        }
        reset();
        setOpen(false);
        router.refresh();
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  const triggerStyle: React.CSSProperties =
    variant === 'light'
      ? { padding: '10px 18px', fontSize: '0.85rem', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }
      : { padding: '10px 20px', fontFamily: 'var(--font-cinzel)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(201,168,76,0.12)', color: 'var(--or-ancien)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '2px', cursor: 'pointer' };

  const field: React.CSSProperties = { width: '100%', padding: '9px 11px', marginTop: '4px', borderRadius: '4px', border: '1px solid #C4B5FD', background: '#fff', color: '#1F2937', fontSize: '0.9rem' };
  const label: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#4B5563', marginBottom: '10px', fontWeight: 600 };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>+ Ajouter un rendez-vous</button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' }}
          onClick={() => !pending && setOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.25rem', color: '#2D1B4E', marginBottom: '20px' }}>Nouveau rendez-vous</h2>
            <form onSubmit={submit}>
              {!lockedPractitionerId && practitioners.length > 1 && (
                <label style={label}>Praticienne
                  <select value={practitionerId} onChange={(e) => { setPractitionerId(e.target.value); setOfferingId(''); }} style={field}>
                    {practitioners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              )}

              <label style={label}>Soin
                <select value={offeringId} onChange={(e) => setOfferingId(e.target.value)} style={field}>
                  <option value="">— Choisir un soin —</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.durationMinutes} min — {o.price.toFixed(2)} $)</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ ...label, flex: 1 }}>Prénom
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={field} />
                </label>
                <label style={{ ...label, flex: 1 }}>Nom
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={field} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label style={{ ...label, flex: 1 }}>Téléphone
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} style={field} />
                </label>
                <label style={{ ...label, flex: 1 }}>Courriel (optionnel)
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
                </label>
              </div>

              <label style={label}>Date et heure
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={field} />
              </label>

              <div style={label}>Mode
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontWeight: 400 }}>
                  <label style={{ fontSize: '0.85rem' }}><input type="radio" checked={mode === 'IN_PERSON'} onChange={() => setMode('IN_PERSON')} /> Présentiel</label>
                  <label style={{ fontSize: '0.85rem' }}><input type="radio" checked={mode === 'VIRTUAL'} onChange={() => setMode('VIRTUAL')} /> Virtuel</label>
                </div>
              </div>

              <div style={label}>Paiement
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontWeight: 400 }}>
                  <label style={{ fontSize: '0.85rem' }}><input type="radio" checked={paymentMode === 'CASH'} onChange={() => setPaymentMode('CASH')} /> Comptant</label>
                  <label style={{ fontSize: '0.85rem', opacity: hasEmail ? 1 : 0.4 }}>
                    <input type="radio" checked={paymentMode === 'STRIPE_LINK'} disabled={!hasEmail} onChange={() => setPaymentMode('STRIPE_LINK')} /> Lien de paiement (carte)
                  </label>
                  <label style={{ fontSize: '0.85rem', opacity: hasEmail ? 1 : 0.4 }}>
                    <input type="radio" checked={paymentMode === 'INTERAC'} disabled={!hasEmail} onChange={() => setPaymentMode('INTERAC')} /> Virement Interac
                  </label>
                </div>
                {!hasEmail && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '6px 0 0', fontWeight: 400 }}>Sans courriel : comptant uniquement.</p>}
              </div>

              <label style={label}>Notes (optionnel)
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...field, minHeight: '60px' }} />
              </label>

              {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: '8px 0' }}>{error}</p>}
              {info && <p style={{ color: '#065F46', fontSize: '0.85rem', margin: '8px 0' }}>{info}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => { reset(); setOpen(false); }} disabled={pending} style={{ padding: '10px 18px', background: 'transparent', color: '#6B7280', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={pending} style={{ padding: '10px 18px', background: '#6B3FA0', color: '#fff', border: 'none', borderRadius: '6px', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}>{pending ? 'Création…' : 'Créer le RDV'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "ManualAppointmentButton" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 3 : Commit**

```bash
git add "src/components/holistique/ManualAppointmentButton.tsx"
git commit -m "UI : composant ManualAppointmentButton (modale RDV manuel)"
```

---

## Task 11 : Bouton dans le dashboard praticienne

**Files:**
- Modify: `src/app/(holistique)/soins/dashboard/praticien/page.tsx`

- [ ] **Step 1 : Importer le composant**

Après `import RescheduleButton from './RescheduleButton';` (déjà présent), ajouter :

```ts
import ManualAppointmentButton from '@/components/holistique/ManualAppointmentButton';
```

- [ ] **Step 2 : Charger les soins de la praticienne**

Dans le `Promise.all([...])` qui récupère `upcomingAppointments, monthRevenue, totalCompleted, pendingChangesCount`, **ajouter une 5ᵉ requête** en fin de tableau. Remplacer :

```ts
  const [upcomingAppointments, monthRevenue, totalCompleted, pendingChangesCount] = await Promise.all([
```

par :

```ts
  const [upcomingAppointments, monthRevenue, totalCompleted, pendingChangesCount, myOfferings] = await Promise.all([
```

puis, juste avant la parenthèse fermante `]);` de ce `Promise.all` (après le bloc `prisma.pendingPractitionerChange.count({ ... })`), ajouter :

```ts
    prisma.offering.findMany({
      where: { practitionerId, isActive: true },
      select: { id: true, name: true, durationMinutes: true, price: true },
      orderBy: { name: 'asc' },
    }),
```

- [ ] **Step 3 : Afficher le bouton dans l'en-tête de la section RDV**

Remplacer le titre de la section « Rendez-vous à venir » :

```tsx
        <section style={{ marginBottom: '48px' }}>
          <h2 style={sectionTitle}>Rendez-vous à venir</h2>
```

par (titre + bouton sur une ligne) :

```tsx
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}>
            <h2 style={{ ...sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>Rendez-vous à venir</h2>
            <ManualAppointmentButton
              practitioners={[{ id: practitionerId, name: `${practitioner.user.firstName} ${practitioner.user.lastName}`, offerings: myOfferings }]}
              lockedPractitionerId={practitionerId}
            />
          </div>
```

- [ ] **Step 4 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "dashboard/praticien/page" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 5 : Commit**

```bash
git add "src/app/(holistique)/soins/dashboard/praticien/page.tsx"
git commit -m "Dashboard praticienne : bouton + Ajouter un rendez-vous (RDV manuel pour soi-meme)"
```

---

## Task 12 : Bouton + « Marquer payé » dans l'admin consultations

**Files:**
- Create: `src/components/holistique/MarkPaidButton.tsx`
- Modify: `src/app/admin/consultations/page.tsx`

- [ ] **Step 1 : Créer le bouton « Marquer payé »**

Créer `src/components/holistique/MarkPaidButton.tsx` :

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function MarkPaidButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function markPaid() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/holistique/appointments/${appointmentId}/mark-paid`, { method: 'POST' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error ?? 'Échec.');
          return;
        }
        router.refresh();
      } catch {
        setError('Erreur réseau.');
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={markPaid}
        disabled={pending}
        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: '6px', cursor: pending ? 'default' : 'pointer' }}
      >
        {pending ? '…' : 'Marquer payé'}
      </button>
      {error && <p style={{ color: '#DC2626', fontSize: '0.72rem', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2 : Importer les composants + charger les praticiennes/soins dans l'admin**

En haut de `src/app/admin/consultations/page.tsx`, après `import RescheduleButton from '@/app/(holistique)/soins/dashboard/praticien/RescheduleButton';`, ajouter :

```ts
import ManualAppointmentButton from '@/components/holistique/ManualAppointmentButton';
import MarkPaidButton from '@/components/holistique/MarkPaidButton';
```

Puis, dans `ConsultationsAdminPage`, après le `const appointments = await prisma.holisticAppointment.findMany({ ... });`, ajouter la requête des praticiennes approuvées + leurs soins :

```ts
  const practitionerRows = await prisma.practitioner.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
      offerings: {
        where: { isActive: true },
        select: { id: true, name: true, durationMinutes: true, price: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { user: { firstName: 'asc' } },
  });
  const practitionerOptions = practitionerRows.map((p) => ({
    id: p.id,
    name: `${p.user.firstName} ${p.user.lastName}`,
    offerings: p.offerings,
  }));
```

- [ ] **Step 3 : Afficher le bouton « + Ajouter » dans l'en-tête**

Remplacer le bloc Header :

```tsx
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
          ᛜ Consultations Holistiques
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
          {appointments.length} consultation{appointments.length !== 1 ? 's' : ''} au total
        </p>
      </div>
```

par :

```tsx
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.75rem', fontWeight: 700, color: '#2D1B4E', marginBottom: '8px' }}>
            ᛜ Consultations Holistiques
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
            {appointments.length} consultation{appointments.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <ManualAppointmentButton practitioners={practitionerOptions} variant="light" />
      </div>
```

- [ ] **Step 4 : Afficher « Marquer payé » dans la cellule Actions**

Dans la cellule `{/* Actions */}`, remplacer :

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

par (ajoute « Marquer payé » pour les virements Interac en attente) :

```tsx
                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      {appt.status === 'CONFIRMED' && (
                        <RescheduleButton
                          appointmentId={appt.id}
                          currentStartsAt={new Date(appt.startsAt).toISOString()}
                          variant="light"
                        />
                      )}
                      {appt.paymentMode === 'INTERAC' && appt.payment?.status !== 'PAID' && (
                        <MarkPaidButton appointmentId={appt.id} />
                      )}
                      {appt.status !== 'CONFIRMED' && !(appt.paymentMode === 'INTERAC' && appt.payment?.status !== 'PAID') && (
                        <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>—</span>
                      )}
                    </div>
                  </td>
```

- [ ] **Step 5 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "admin/consultations|MarkPaidButton" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 6 : Commit**

```bash
git add "src/components/holistique/MarkPaidButton.tsx" "src/app/admin/consultations/page.tsx"
git commit -m "Admin consultations : bouton + Ajouter (toutes praticiennes) + Marquer paye (Interac)"
```

---

## Task 13 : Garde « comptes internes » dans le cron des rappels

**Files:**
- Modify: `src/app/api/cron/holistic-reminders/route.ts`

- [ ] **Step 1 : Importer `isInternalEmail`**

Modifier l'import existant :

```ts
import { buildBookingEmailData, sendReminderToClient } from '@/lib/holistic-booking-email';
```

en ajoutant la ligne :

```ts
import { isInternalEmail } from '@/lib/holistic-clients';
```

- [ ] **Step 2 : Sauter les comptes internes (boucle 3 jours)**

Dans la boucle `for (const a of due3d)`, remplacer le bloc `if (data) { ... }` par :

```ts
      if (data) {
        if (isInternalEmail(data.clientEmail)) {
          // Compte interne (sans courriel) → on marque comme traité sans envoyer.
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder3dSentAt: new Date() } });
        } else {
          await sendReminderToClient(data, '3d');
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder3dSentAt: new Date() } });
          sent3d++;
        }
      }
```

- [ ] **Step 3 : Sauter les comptes internes (boucle 24h)**

Dans la boucle `for (const a of due24h)`, remplacer le bloc `if (data) { ... }` par :

```ts
      if (data) {
        if (isInternalEmail(data.clientEmail)) {
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder24hSentAt: new Date() } });
        } else {
          await sendReminderToClient(data, '24h');
          await prisma.holisticAppointment.update({ where: { id: a.id }, data: { reminder24hSentAt: new Date() } });
          sent24h++;
        }
      }
```

- [ ] **Step 4 : Typecheck**

Run: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-reminders" || echo "OK: pas d'erreur"`
Expected: `OK: pas d'erreur`

- [ ] **Step 5 : Commit**

```bash
git add "src/app/api/cron/holistic-reminders/route.ts"
git commit -m "Cron rappels : ignorer les comptes internes (sans courriel)"
```

---

## Task 14 : Vérification finale + déploiement

- [ ] **Step 1 : Typecheck complet (tous fichiers touchés)**

Run:
```bash
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json 2>&1 | grep -vE "^\.next/" | grep -E "holistic-password-token|holistic-clients|holistic-stripe|holistic-booking-email|appointments/manual|definir-mot-de-passe|mark-paid|ManualAppointmentButton|MarkPaidButton|dashboard/praticien/page|admin/consultations|holistic-reminders|constants" || echo "OK: aucun fichier touché en erreur"
```
Expected: `OK: aucun fichier touché en erreur` (seule erreur `src/` tolérée : `actions.ts` pré-existante).

- [ ] **Step 2 : Lint des fichiers touchés (recommandé)**

Run: `npm run lint 2>&1 | tail -30`
Expected: pas de NOUVELLE erreur sur les fichiers créés/modifiés (le projet a une dette ESLint pré-existante ; ne pas régresser).

- [ ] **Step 3 : Push (déclenche le déploiement Vercel + applique la migration)**

> **Demander l'autorisation de l'utilisateur avant de pousser sur `main`** (déploie en prod sur runesetmagie.ca et applique la migration `paymentMode`).

```bash
git push origin main
```

- [ ] **Step 4 : Vérification post-déploiement (manuel, en prod)**

Une fois le build Vercel terminé :
1. **Migration** : dans les logs de build Vercel, vérifier que `migrate-deploy-safe.mjs` a appliqué `20260617000000_add_payment_mode` sans erreur.
2. **Comptant + courriel (nouveau compte)** : depuis le dashboard praticienne, créer un RDV comptant avec un courriel de test → le créneau se bloque (RDV CONFIRMED visible), l'événement apparaît dans Google Agenda (si connecté), le courriel « Crée ton mot de passe » arrive ; cliquer le lien → définir un mot de passe → se connecter sur `/soins/auth/login`.
3. **Comptant + sans courriel** : créer un RDV comptant sans courriel → créneau bloqué, **aucun** courriel ; vérifier dans `/admin/consultations` que la cliente a une adresse `@interne.invalid`.
4. **Lien Stripe** : créer un RDV « Lien de paiement » → la cliente reçoit le courriel avec le lien ; payer → le webhook passe `HolisticPayment` à `PAID` (colonne Paiement « Payé » dans l'admin) et la confirmation finale arrive (sans doublon d'événement Google/salle Daily).
5. **Virement** : créer un RDV « Virement Interac » → courriel Interac reçu (bonnes infos : `comptabilite@runesetmagie.ca`, montant, réponse `Magie123`) ; dans l'admin, cliquer « Marquer payé » → statut « Payé ».
6. **Admin pour une praticienne** : depuis `/admin/consultations`, créer un RDV en choisissant une praticienne → elle reçoit la notification ; le RDV apparaît dans son dashboard.
7. **Conflit** : tenter un créneau chevauchant un RDV existant (ou une plage occupée Google) → message d'erreur clair (409).

- [ ] **Step 5 : Mettre à jour la doc de suivi**

Cocher la fonctionnalité « RDV manuel » dans `SUIVI_HOLISTIQUE.md` (et la retirer de `CHOSES_A_FAIRE.md` si elle y figure). Commit :

```bash
git add SUIVI_HOLISTIQUE.md CHOSES_A_FAIRE.md
git commit -m "Doc : RDV manuel (praticienne/admin) + activation compte livre"
```

---

## Self-Review

- **Spec coverage :**
  - B1 colonne `paymentMode` → T1 ; B2 config Interac + domaine interne → T2 ; B3 `isInternalEmail`/compte interne → T4 ; B4 jeton mot de passe → T3 ; B5 `findOrCreateHolisticClient` → T4 ; B6 `createHolisticPaymentLink` → T5.
  - Feature 1 endpoint manuel (auth, validation, conflits DB+Google, compte, RDV CONFIRMED, paiement, Daily, Google, V2, lien Stripe, courriels) → T7.
  - Feature 2 définir-mot-de-passe (page + endpoint) → T8.
  - Feature 3 courriels (5 fonctions + matrice) → T6, branchés en T7.
  - Feature 4 formulaire UI (dashboard + admin + sélecteur praticienne) → T10/T11/T12.
  - Feature 5 marquer virement payé (endpoint + bouton) → T9/T12.
  - Feature 6 garde rappels internes → T13.
  - Note webhook (idempotence) : aucun changement requis (vérifié dans le code existant). Couvert par observation, pas de tâche.
- **Placeholders :** aucun — code complet à chaque étape.
- **Cohérence des types :**
  - `findOrCreateHolisticClient` retourne `{ user, created, internal }` ; T7 utilise `clientUser.id` + `clientUser.hashedPassword` (présents dans le type retourné).
  - `signSetPasswordToken({ id, hashedPassword })` (T3) ↔ appel en T7 ; `verifySetPasswordToken(token)` (T3) ↔ appel en T8.
  - `createHolisticPaymentLink(params)` (T5) ↔ appel en T7 (mêmes clés, dont `practitioner.{stripeAccountId,stripeAccountReady,commissionPct}`).
  - Emails (T6) : signatures `sendSetPasswordEmail(data, token)`, `sendManualCashConfirmationToClient(data)`, `sendPaymentLinkToClient(data, url)`, `sendInteracInstructionsToClient(data)`, `sendManualNotificationToPractitioner(data, phone, mode)` ↔ appels identiques en T7.
  - `ManualAppointmentButton` props `{ practitioners: {id,name,offerings:{id,name,durationMinutes,price}[]}[], lockedPractitionerId?, variant? }` (T10) ↔ données fournies en T11 (`myOfferings` sélectionne `id,name,durationMinutes,price`) et T12 (`practitionerOptions` même forme).
  - `paymentMode` (`CASH|STRIPE_LINK|INTERAC`) cohérent T1/T7/T9/T12.
  - `isInternalEmail` (T4) ↔ T7 et T13.
- **Inter-tâches :** T7 dépend de T1-T6 ; T11/T12 dépendent de T10 ; T12 dépend de T9. Ordre du plan respecté.
