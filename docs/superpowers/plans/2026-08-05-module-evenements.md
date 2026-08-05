# Module Événements — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser `superpowers:subagent-driven-development`
> (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche.
> Les étapes utilisent des cases à cocher (`- [ ]`).

**But :** permettre à Runes & Magie d'annoncer ses événements, de recevoir des inscriptions
en ligne limitées en places, de suivre les inscrits dans le back-office et d'envoyer les
courriels de confirmation, de rappel et d'annulation.

**Architecture :** deux tables Prisma dédiées (`Event`, `EventRegistration`) strictement
séparées du module soins. L'inscription exige un compte, créé via le formulaire existant
`/soins/auth/register` réutilisé tel quel. La limite de places est garantie par une
transaction Postgres en isolation `Serializable`, pas par un simple compteur applicatif.

**Pile technique :** Next.js 16 (App Router, React 19), TypeScript, Prisma 6 + Postgres
Supabase, NextAuth v5, Resend, Tailwind v4.

**Devis de référence :** `docs/superpowers/specs/2026-08-05-module-evenements-design.md`

---

## Contraintes globales

- **Tout en français** : interface, commits, commentaires, noms de variables métier.
- **Next.js 16** : `params` et `searchParams` des pages et routes sont des **`Promise`**
  qu'il faut `await`. Lire `node_modules/next/dist/docs/` avant d'utiliser une API
  incertaine — les signatures diffèrent des versions antérieures.
- **Aucune infrastructure de tests** dans le projet (`package.json` n'a pas de script
  `test`). Ne pas en introduire. La vérification passe par : `npx tsc --noEmit`, un
  script de concurrence réel, et un parcours manuel en production.
- **Toute route `/api/admin/*`** commence par `const guard = await requireAdmin(); if (guard) return guard;`
- **Toute route dynamique** exporte `export const dynamic = 'force-dynamic';`
- **Envoi de courriel** : toujours dégrader gracieusement si `RESEND_API_KEY` est absente
  (log console, pas d'exception).
- **Déploiement** : `git push` **puis `vercel --prod`** — le déploiement automatique Git
  ne fonctionne pas sur ce projet. Vérifier `vercel.json` avant chaque déploiement.
- **Ne jamais toucher** aux modèles `Offering`, `Booking`, `HolisticAppointment`,
  `BookingService`, `Appointment`, ni aux routes `/soins/*` existantes.

---

## Structure des fichiers

**Créés**
| Fichier | Responsabilité |
|---|---|
| `prisma/migrations/<horodatage>_add_events/migration.sql` | Les deux tables |
| `src/lib/email-template.ts` | Gabarit HTML partagé des courriels |
| `src/lib/evenements.ts` | Logique métier : inscription, annulation, places |
| `src/lib/evenement-email.ts` | Les six courriels du module |
| `src/app/api/evenements/[slug]/inscription/route.ts` | Inscription |
| `src/app/api/evenements/annulation/[token]/route.ts` | Annulation par jeton |
| `src/app/api/membre/evenements/route.ts` | Mes inscriptions |
| `src/app/api/admin/evenements/route.ts` | Liste + création |
| `src/app/api/admin/evenements/[id]/route.ts` | Lecture, modification, suppression |
| `src/app/api/admin/evenements/[id]/inscrits/route.ts` | Inscrits + export CSV |
| `src/app/api/admin/evenements/[id]/inscrits/[registrationId]/route.ts` | Désinscription manuelle |
| `src/app/api/admin/evenements/[id]/message/route.ts` | Écrire à tous |
| `src/app/api/admin/evenements/[id]/annuler/route.ts` | Annuler l'événement |
| `src/app/api/cron/event-reminders/route.ts` | Rappel quotidien |
| `src/app/evenements/page.tsx` | Liste publique |
| `src/app/evenements/[slug]/page.tsx` | Fiche publique |
| `src/app/evenements/[slug]/FormulaireInscription.tsx` | Îlot client du formulaire |
| `src/app/evenements/annulation/[token]/page.tsx` | Page de confirmation d'annulation |
| `src/app/(membre)/compte/evenements/page.tsx` | Mes événements |
| `src/app/(membre)/compte/evenements/MesInscriptions.tsx` | Îlot client (bouton annuler) |
| `src/app/admin/evenements/page.tsx` | Liste admin |
| `src/app/admin/evenements/nouveau/page.tsx` | Création |
| `src/app/admin/evenements/[id]/page.tsx` | Édition + inscrits |
| `src/app/admin/evenements/FormulaireEvenement.tsx` | Formulaire partagé création/édition |
| `src/app/admin/evenements/[id]/ActionsInscrits.tsx` | Îlot client (CSV, message, annuler) |
| `scripts/test-evenement-places.ts` | Test de concurrence sur la limite |
| `scripts/creer-lughnasadh.ts` | Création de l'événement du 8 août |

**Modifiés**
| Fichier | Modification |
|---|---|
| `prisma/schema.prisma` | +2 modèles, +1 enum, +1 relation inverse sur `HolisticUser` |
| `src/app/admin/layout.tsx:11-32` | +1 entrée `navItems` |
| `src/components/membre/MembreShell.tsx:14-22` | +1 entrée `NAV_ITEMS` |
| `src/app/(membre)/compte/page.tsx` | +1 carte |
| `vercel.json` | +1 cron |

---

### Task 1 : Schéma Prisma et migration

**Fichiers**
- Modifier : `prisma/schema.prisma` (fin de fichier + `HolisticUser` ligne 331-354)
- Créer : `prisma/migrations/20260805120000_add_events/migration.sql`

**Interfaces**
- Produit : modèles `Event`, `EventRegistration`, enum `EventRegistrationStatus`,
  accessibles via `prisma.event` et `prisma.eventRegistration`.

- [ ] **Étape 1 : ajouter la relation inverse sur `HolisticUser`**

Dans `prisma/schema.prisma`, à la fin du bloc `model HolisticUser` (après
`courseProgress CourseProgress[]`, ligne 353) :

```prisma
  // ── Événements (rituels, veillées) ──
  eventRegistrations EventRegistration[]
```

- [ ] **Étape 2 : ajouter les deux modèles à la fin de `prisma/schema.prisma`**

```prisma
// ─────────────────────────────────────────────────────────────
// ÉVÉNEMENTS — rituels, veillées, célébrations.
// Module volontairement SÉPARÉ des soins (Offering/Booking/
// HolisticAppointment) : un événement est un rassemblement de
// groupe à date fixe, pas un rendez-vous individuel sur créneau.
// ─────────────────────────────────────────────────────────────

enum EventRegistrationStatus {
  CONFIRMED
  CANCELLED
}

model Event {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  excerpt     String?
  description String
  imageUrl    String?
  startsAt    DateTime
  endsAt      DateTime?
  location    String
  isOnline    Boolean   @default(false)
  onlineUrl   String?
  capacity    Int
  bringItems  String?
  isPublished Boolean   @default(false)
  cancelledAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  registrations EventRegistration[]

  @@index([isPublished, startsAt])
}

model EventRegistration {
  id      String @id @default(cuid())
  eventId String
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId  String
  user    HolisticUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Copie figée à l'inscription : si la personne change son courriel dans son
  // profil plus tard, la liste de présence de l'événement reste exacte.
  email     String
  firstName String
  lastName  String
  phone     String?

  note           String?
  status         EventRegistrationStatus @default(CONFIRMED)
  cancelToken    String                  @unique @default(cuid())
  reminderSentAt DateTime?
  createdAt      DateTime                @default(now())
  cancelledAt    DateTime?

  @@unique([eventId, userId])
  @@index([eventId, status])
}
```

- [ ] **Étape 3 : générer la migration**

```bash
npx prisma migrate dev --name add_events --create-only
```

`--create-only` écrit le SQL sans l'appliquer : on relit avant d'exécuter.

- [ ] **Étape 4 : relire le SQL généré**

Ouvrir `prisma/migrations/<horodatage>_add_events/migration.sql`. Vérifier qu'il ne
contient **que** des `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX` et
`ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`. **Aucun `DROP`, aucun `ALTER COLUMN`**
sur une table existante. Si un `DROP` apparaît, arrêter et signaler — le schéma de
production diverge des migrations sur ce projet.

- [ ] **Étape 5 : appliquer et régénérer le client**

```bash
npx prisma migrate deploy && npx prisma generate
```

- [ ] **Étape 6 : vérifier que les tables existent**

```bash
npx tsx -e "import{PrismaClient}from'@prisma/client';const p=new PrismaClient();p.event.count().then(n=>console.log('Table Event OK, lignes:',n)).finally(()=>p.\$disconnect())"
```

Attendu : `Table Event OK, lignes: 0`

- [ ] **Étape 7 : commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Evenements : modeles Event et EventRegistration"
```

---

### Task 2 : Gabarit de courriel partagé

**Fichiers**
- Créer : `src/lib/email-template.ts`

**Interfaces**
- Produit : `gabaritCourriel(contenu: string): string`, `encoderHtml(texte: string): string`,
  `BOUTON(href: string, libelle: string): string`

Le gabarit est aujourd'hui dupliqué dans `src/lib/order-email.ts:31`,
`src/lib/holistic-booking-email.ts` et 6 routes API. On l'extrait pour les nouveaux
courriels **sans réécrire les anciens**.

- [ ] **Étape 1 : créer le fichier**

```ts
/**
 * Gabarit HTML partagé des courriels Runes & Magie.
 *
 * Extrait de `src/lib/order-email.ts:31`, où il était privé et recopié à
 * l'identique dans plusieurs fichiers. Les courriels existants n'ont pas été
 * migrés (risque inutile) ; tout NOUVEAU courriel doit utiliser ce module.
 */

const OR = '#C9A84C';
const PARCHEMIN = '#F5F0E8';
const PARCHEMIN_DOUX = '#E8DCC8';

/**
 * Échappe le texte destiné à être inséré dans du HTML.
 * Indispensable : le message libre d'un participant finit dans le courriel que
 * reçoit l'administration. Sans échappement, il peut y injecter du HTML.
 */
export function encoderHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function bouton(href: string, libelle: string): string {
  return `<div style="text-align:center;margin:28px 0;"><a href="${href}" style="display:inline-block;padding:14px 32px;background:linear-gradient(to right,#4A2D7A,#2D1B4E);border:1px solid ${OR};border-radius:4px;color:${OR};font-family:Georgia,serif;font-size:14px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${libelle}</a></div>`;
}

export function encadre(contenu: string): string {
  return `<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:16px 0;">${contenu}</div>`;
}

export function gabaritCourriel(contenu: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:${PARCHEMIN};font-family:Georgia,serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><h1 style="color:${OR};font-size:28px;margin:0;letter-spacing:2px;">Runes &amp; Magie</h1><p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p></div><div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">${contenu}</div><div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;"><p>Runes &amp; Magie - Annabelle Dionne, Guide Spirituelle</p><p style="font-size:11px;">www.runesetmagie.ca</p></div></div></body></html>`;
}

export const COULEURS = { OR, PARCHEMIN, PARCHEMIN_DOUX } as const;
```

> **Note pour l'exécutant :** l'en-tête contient encore « BOUTIQUE-ECOLE DE SORCELLERIE ».
> Le renommage vers « Magie » est une décision en attente du client — **ne pas le changer
> ici de sa propre initiative**.

- [ ] **Étape 2 : vérifier les types**

```bash
npx tsc --noEmit
```

Attendu : aucune nouvelle erreur. (Une erreur préexistante subsiste dans
`src/app/admin/praticiens/modifications/actions.ts:150` — elle n'est pas de notre fait.)

- [ ] **Étape 3 : commit**

```bash
git add src/lib/email-template.ts
git commit -m "Courriels : gabarit HTML partage extrait pour les nouveaux envois"
```

---

### Task 3 : Logique métier des inscriptions

**Fichiers**
- Créer : `src/lib/evenements.ts`
- Créer : `scripts/test-evenement-places.ts`

**Interfaces**
- Consomme : `prisma` de `@/lib/db`, modèles de la Task 1.
- Produit :
  - `placesRestantes(eventId: string): Promise<number>`
  - `inscrire(params: ParamsInscription): Promise<EventRegistration>`
  - `annulerParJeton(token: string): Promise<{ registration; event } | null>`
  - `annulerParMembre(registrationId: string, userId: string): Promise<boolean>`
  - Erreurs : `EvenementIntrouvable`, `EvenementIndisponible`, `EvenementPasse`,
    `EvenementComplet`, `DejaInscrit`

- [ ] **Étape 1 : créer `src/lib/evenements.ts`**

```ts
import { Prisma, type EventRegistration } from '@prisma/client';
import { prisma } from '@/lib/db';

export class EvenementIntrouvable extends Error {}
export class EvenementIndisponible extends Error {}
export class EvenementPasse extends Error {}
export class EvenementComplet extends Error {}
export class DejaInscrit extends Error {}

export interface ParamsInscription {
  eventId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  note: string | null;
}

export async function placesRestantes(eventId: string): Promise<number> {
  const [evenement, pris] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId }, select: { capacity: true } }),
    prisma.eventRegistration.count({ where: { eventId, status: 'CONFIRMED' } }),
  ]);
  if (!evenement) return 0;
  return Math.max(0, evenement.capacity - pris);
}

/**
 * Rejoue une transaction annulée par Postgres pour cause de conflit de
 * sérialisation (Prisma P2034). En isolation Serializable, deux inscriptions
 * simultanées sur la dernière place font échouer l'une des deux : c'est le
 * comportement voulu, mais il faut la rejouer pour qu'elle constate le
 * « complet » plutôt que de renvoyer une erreur technique.
 */
async function avecReessais<T>(operation: () => Promise<T>, maximum = 5): Promise<T> {
  let derniereErreur: unknown;
  for (let essai = 0; essai < maximum; essai++) {
    try {
      return await operation();
    } catch (erreur) {
      const conflit =
        erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === 'P2034';
      if (!conflit) throw erreur;
      derniereErreur = erreur;
      await new Promise((resoudre) => setTimeout(resoudre, 25 * (essai + 1)));
    }
  }
  throw derniereErreur;
}

/**
 * Inscrit une personne à un événement.
 *
 * La vérification du nombre de places et l'insertion se font dans UNE SEULE
 * transaction en isolation Serializable. Un `count()` suivi d'un `create()`
 * hors transaction laisserait passer deux inscriptions sur la dernière place.
 */
export async function inscrire(params: ParamsInscription): Promise<EventRegistration> {
  return avecReessais(() =>
    prisma.$transaction(
      async (tx) => {
        const evenement = await tx.event.findUnique({ where: { id: params.eventId } });
        if (!evenement) throw new EvenementIntrouvable();
        if (!evenement.isPublished || evenement.cancelledAt) throw new EvenementIndisponible();
        if (evenement.startsAt.getTime() < Date.now()) throw new EvenementPasse();

        const existante = await tx.eventRegistration.findUnique({
          where: { eventId_userId: { eventId: params.eventId, userId: params.userId } },
        });
        if (existante && existante.status === 'CONFIRMED') throw new DejaInscrit();

        const pris = await tx.eventRegistration.count({
          where: { eventId: params.eventId, status: 'CONFIRMED' },
        });
        if (pris >= evenement.capacity) throw new EvenementComplet();

        // Réinscription après annulation : on réactive la ligne existante.
        // La contrainte @@unique([eventId, userId]) interdit d'en créer une seconde.
        if (existante) {
          return tx.eventRegistration.update({
            where: { id: existante.id },
            data: {
              status: 'CONFIRMED',
              cancelledAt: null,
              reminderSentAt: null,
              note: params.note,
              phone: params.phone,
              email: params.email,
              firstName: params.firstName,
              lastName: params.lastName,
            },
          });
        }

        return tx.eventRegistration.create({ data: { ...params, status: 'CONFIRMED' } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );
}

export async function annulerParJeton(token: string) {
  const inscription = await prisma.eventRegistration.findUnique({
    where: { cancelToken: token },
    include: { event: true },
  });
  if (!inscription) return null;
  if (inscription.status === 'CANCELLED') return inscription;

  return prisma.eventRegistration.update({
    where: { id: inscription.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
    include: { event: true },
  });
}

export async function annulerParMembre(registrationId: string, userId: string) {
  const resultat = await prisma.eventRegistration.updateMany({
    where: { id: registrationId, userId, status: 'CONFIRMED' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  return resultat.count === 1;
}

/** Formate « samedi 8 août 2026 à 13 h » pour l'affichage et les courriels. */
export function formaterDateEvenement(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  }).format(date);
}
```

- [ ] **Étape 2 : écrire le test de concurrence**

C'est le seul vrai test du module. Il vérifie la propriété qui coûterait le plus cher
si elle cassait : 18 personnes qui se présentent pour 15 places.

Créer `scripts/test-evenement-places.ts` :

```ts
/**
 * Test de concurrence sur la limite de places.
 *
 * Cree un evenement de test a 15 places, lance 20 inscriptions SIMULTANEES,
 * et verifie qu'il en passe exactement 15. Nettoie tout a la fin.
 *
 * Usage : npx tsx scripts/test-evenement-places.ts
 */
import { PrismaClient } from '@prisma/client';
import { inscrire, EvenementComplet } from '../src/lib/evenements';

const prisma = new PrismaClient();

const CAPACITE = 15;
const TENTATIVES = 20;

async function main() {
  const evenement = await prisma.event.create({
    data: {
      slug: `test-concurrence-${Date.now()}`,
      title: 'Test de concurrence',
      description: 'Evenement temporaire de test.',
      location: 'Nulle part',
      capacity: CAPACITE,
      startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      isPublished: true,
    },
  });

  const membres = await Promise.all(
    Array.from({ length: TENTATIVES }, (_, i) =>
      prisma.holisticUser.create({
        data: {
          email: `test-concurrence-${Date.now()}-${i}@exemple.test`,
          hashedPassword: 'x'.repeat(60),
          firstName: 'Test',
          lastName: `Numero${i}`,
        },
      }),
    ),
  );

  const resultats = await Promise.allSettled(
    membres.map((m) =>
      inscrire({
        eventId: evenement.id,
        userId: m.id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: null,
        note: null,
      }),
    ),
  );

  const reussies = resultats.filter((r) => r.status === 'fulfilled').length;
  const complets = resultats.filter(
    (r) => r.status === 'rejected' && r.reason instanceof EvenementComplet,
  ).length;
  const autresErreurs = resultats.filter(
    (r) => r.status === 'rejected' && !(r.reason instanceof EvenementComplet),
  );

  const enBase = await prisma.eventRegistration.count({
    where: { eventId: evenement.id, status: 'CONFIRMED' },
  });

  console.log(`Inscriptions reussies   : ${reussies}`);
  console.log(`Refus « complet »       : ${complets}`);
  console.log(`Confirmees en base      : ${enBase}`);
  if (autresErreurs.length > 0) {
    console.log('Erreurs inattendues :');
    for (const e of autresErreurs) {
      console.log('  -', (e as PromiseRejectedResult).reason);
    }
  }

  // Nettoyage
  await prisma.eventRegistration.deleteMany({ where: { eventId: evenement.id } });
  await prisma.event.delete({ where: { id: evenement.id } });
  await prisma.holisticUser.deleteMany({ where: { id: { in: membres.map((m) => m.id) } } });

  const succes = reussies === CAPACITE && enBase === CAPACITE && autresErreurs.length === 0;
  console.log(succes ? '\nRESULTAT : SUCCES' : '\nRESULTAT : ECHEC');
  process.exitCode = succes ? 0 : 1;
}

main()
  .catch((e) => {
    console.error('ERREUR :', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Étape 3 : exécuter le test**

```bash
npx tsx scripts/test-evenement-places.ts
```

Attendu :
```
Inscriptions reussies   : 15
Refus « complet »       : 5
Confirmees en base      : 15
RESULTAT : SUCCES
```

**Si le nombre de réussites dépasse 15**, la transaction ne protège pas : ne pas
continuer, corriger `inscrire()` avant toute autre tâche.

**Si des erreurs inattendues apparaissent** avec le code `P2034` malgré les réessais,
augmenter `maximum` à 10 dans `avecReessais`.

- [ ] **Étape 4 : commit**

```bash
git add src/lib/evenements.ts scripts/test-evenement-places.ts
git commit -m "Evenements : logique d'inscription avec verrou anti-surreservation"
```

---

### Task 4 : Les six courriels

**Fichiers**
- Créer : `src/lib/evenement-email.ts`

**Interfaces**
- Consomme : `gabaritCourriel`, `encoderHtml`, `bouton`, `encadre` (Task 2) ;
  `formaterDateEvenement` (Task 3).
- Produit :
  - `envoyerConfirmationInscription(donnees: DonneesCourrielEvenement)`
  - `envoyerNotificationAdmin(donnees, placesPrises, capacite)`
  - `envoyerRappel(donnees)`
  - `envoyerConfirmationAnnulation(donnees)`
  - `envoyerAnnulationEvenement(destinataires: string[], titre, dateFormatee, motif)`
  - `envoyerMessageAuxInscrits(destinataires: string[], titre, sujet, message)`

- [ ] **Étape 1 : créer le fichier**

```ts
import { Resend } from 'resend';
import { gabaritCourriel, encoderHtml, bouton, encadre } from '@/lib/email-template';
import { formaterDateEvenement } from '@/lib/evenements';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || 'Runes & Magie <noreply@runesetmagie.ca>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.runesetmagie.ca';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@runesetmagie.com';

export interface DonneesCourrielEvenement {
  prenom: string;
  nom: string;
  courriel: string;
  titre: string;
  debut: Date;
  lieu: string;
  enLigne: boolean;
  lienEnLigne?: string | null;
  aApporter?: string | null;
  note?: string | null;
  jetonAnnulation: string;
}

async function envoyer(to: string | string[], subject: string, html: string, quoi: string) {
  if (!resend) {
    console.log(`[Courriel] ${quoi} ->`, to);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

function blocDetails(d: DonneesCourrielEvenement): string {
  const lieu = d.enLigne
    ? `En ligne${d.lienEnLigne ? ` — <a href="${d.lienEnLigne}" style="color:#C9A84C;">rejoindre</a>` : ''}`
    : encoderHtml(d.lieu);
  return encadre(
    `<p style="margin:4px 0;color:#C9A84C;font-size:18px;"><strong>${encoderHtml(d.titre)}</strong></p>` +
      `<p style="margin:4px 0;color:#E8DCC8;">${formaterDateEvenement(d.debut)}</p>` +
      `<p style="margin:4px 0;color:#E8DCC8;">${lieu}</p>` +
      (d.aApporter
        ? `<p style="margin:12px 0 4px;color:#C9A84C;font-size:13px;letter-spacing:1px;">À APPORTER</p><p style="margin:0;color:#E8DCC8;">${encoderHtml(d.aApporter)}</p>`
        : ''),
  );
}

export async function envoyerConfirmationInscription(d: DonneesCourrielEvenement) {
  const lienAnnulation = `${APP_URL}/evenements/annulation/${d.jetonAnnulation}`;
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Votre place est réservée &#10024;</h2>` +
      `<p style="color:#F5F0E8;">Bonjour ${encoderHtml(d.prenom)},</p>` +
      `<p style="color:#F5F0E8;">Votre inscription est confirmée. Nous avons hâte de vous accueillir.</p>` +
      blocDetails(d) +
      bouton(`${APP_URL}/compte/evenements`, 'Mes événements') +
      `<p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;">Un empêchement ? <a href="${lienAnnulation}" style="color:#C9A84C;">Annulez votre place</a> pour la libérer.</p>`,
  );
  await envoyer(d.courriel, `Inscription confirmée — ${d.titre}`, html, 'confirmation inscription');
}

export async function envoyerNotificationAdmin(
  d: DonneesCourrielEvenement,
  placesPrises: number,
  capacite: number,
) {
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Nouvelle inscription</h2>` +
      `<p style="color:#F5F0E8;"><strong>${encoderHtml(d.prenom)} ${encoderHtml(d.nom)}</strong> — ${encoderHtml(d.courriel)}</p>` +
      blocDetails(d) +
      (d.note
        ? `<p style="color:#C9A84C;font-size:13px;letter-spacing:1px;margin-bottom:4px;">SON MESSAGE</p><p style="color:#E8DCC8;white-space:pre-wrap;">${encoderHtml(d.note)}</p>`
        : '') +
      `<p style="color:#C9A84C;font-size:20px;text-align:center;margin-top:24px;"><strong>${placesPrises} / ${capacite} places</strong></p>`,
  );
  await envoyer(ADMIN_EMAIL, `${placesPrises}/${capacite} — ${d.titre}`, html, 'notification admin');
}

export async function envoyerRappel(d: DonneesCourrielEvenement) {
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">C'est bientôt &#127769;</h2>` +
      `<p style="color:#F5F0E8;">Bonjour ${encoderHtml(d.prenom)},</p>` +
      `<p style="color:#F5F0E8;">Petit rappel de votre inscription.</p>` +
      blocDetails(d) +
      `<p style="color:rgba(245,240,232,0.6);font-size:13px;text-align:center;">Empêchement de dernière minute ? <a href="${APP_URL}/evenements/annulation/${d.jetonAnnulation}" style="color:#C9A84C;">Libérez votre place</a>.</p>`,
  );
  await envoyer(d.courriel, `Rappel — ${d.titre}`, html, 'rappel');
}

export async function envoyerConfirmationAnnulation(d: DonneesCourrielEvenement) {
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Votre place a été libérée</h2>` +
      `<p style="color:#F5F0E8;">Bonjour ${encoderHtml(d.prenom)},</p>` +
      `<p style="color:#F5F0E8;">Votre inscription à <strong>${encoderHtml(d.titre)}</strong> (${formaterDateEvenement(d.debut)}) est annulée. Au plaisir de vous voir à une prochaine occasion.</p>` +
      bouton(`${APP_URL}/evenements`, 'Voir les prochains événements'),
  );
  await Promise.all([
    envoyer(d.courriel, `Annulation confirmée — ${d.titre}`, html, 'annulation participant'),
    envoyer(
      ADMIN_EMAIL,
      `Désistement — ${d.titre}`,
      gabaritCourriel(
        `<h2 style="color:#C9A84C;margin-top:0;">Un désistement</h2>` +
          `<p style="color:#F5F0E8;">${encoderHtml(d.prenom)} ${encoderHtml(d.nom)} (${encoderHtml(d.courriel)}) a annulé sa place pour <strong>${encoderHtml(d.titre)}</strong>. Une place est de nouveau disponible.</p>`,
      ),
      'annulation admin',
    ),
  ]);
}

export async function envoyerAnnulationEvenement(
  destinataires: string[],
  titre: string,
  debut: Date,
  motif: string | null,
) {
  if (destinataires.length === 0) return;
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">Événement annulé</h2>` +
      `<p style="color:#F5F0E8;">Nous sommes désolés : <strong>${encoderHtml(titre)}</strong>, prévu le ${formaterDateEvenement(debut)}, est annulé.</p>` +
      (motif ? `<p style="color:#E8DCC8;white-space:pre-wrap;">${encoderHtml(motif)}</p>` : '') +
      bouton(`${APP_URL}/evenements`, 'Voir les autres événements'),
  );
  // Envoi individuel : jamais de liste de destinataires en clair (Loi 25).
  for (const destinataire of destinataires) {
    await envoyer(destinataire, `Annulé — ${titre}`, html, 'annulation evenement');
  }
}

export async function envoyerMessageAuxInscrits(
  destinataires: string[],
  titre: string,
  sujet: string,
  message: string,
) {
  if (destinataires.length === 0) return;
  const html = gabaritCourriel(
    `<h2 style="color:#C9A84C;margin-top:0;">${encoderHtml(titre)}</h2>` +
      `<p style="color:#F5F0E8;white-space:pre-wrap;">${encoderHtml(message)}</p>`,
  );
  for (const destinataire of destinataires) {
    await envoyer(destinataire, sujet, html, 'message aux inscrits');
  }
}
```

- [ ] **Étape 2 : vérifier les types puis commit**

```bash
npx tsc --noEmit
git add src/lib/evenement-email.ts
git commit -m "Evenements : les six courriels du module"
```

---

### Task 5 : API publique et membre

**Fichiers**
- Créer : `src/app/api/evenements/[slug]/inscription/route.ts`
- Créer : `src/app/api/evenements/annulation/[token]/route.ts`
- Créer : `src/app/api/membre/evenements/route.ts`

**Interfaces**
- Consomme : `inscrire`, `annulerParJeton`, `placesRestantes` (Task 3) ; les courriels (Task 4).
- Produit : `POST /api/evenements/[slug]/inscription` → `{ ok: true, placesRestantes }`
  ou `{ error, code }` avec `code ∈ { NON_CONNECTE, COMPLET, DEJA_INSCRIT, INDISPONIBLE, PASSE }`.

- [ ] **Étape 1 : route d'inscription**

```ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  inscrire,
  placesRestantes,
  EvenementComplet,
  DejaInscrit,
  EvenementIndisponible,
  EvenementPasse,
  EvenementIntrouvable,
} from '@/lib/evenements';
import { envoyerConfirmationInscription, envoyerNotificationAdmin } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json(
      { error: 'Connexion requise pour vous inscrire.', code: 'NON_CONNECTE' },
      { status: 401 },
    );
  }

  // L'identifiant de session peut appartenir a un AdminUser : on revérifie
  // qu'il s'agit bien d'un membre (meme motif que /api/membre/profil).
  const membre = await prisma.holisticUser.findUnique({ where: { id: userId } });
  if (!membre) {
    return NextResponse.json(
      { error: 'Compte membre introuvable.', code: 'NON_CONNECTE' },
      { status: 401 },
    );
  }

  const evenement = await prisma.event.findUnique({ where: { slug } });
  if (!evenement) {
    return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
  }

  let note: string | null = null;
  try {
    const corps = (await req.json()) as { note?: unknown };
    if (typeof corps.note === 'string' && corps.note.trim()) {
      note = corps.note.trim().slice(0, 1000);
    }
  } catch {
    // Corps vide : le message est optionnel.
  }

  try {
    const inscription = await inscrire({
      eventId: evenement.id,
      userId: membre.id,
      email: membre.email,
      firstName: membre.firstName,
      lastName: membre.lastName,
      phone: membre.phone,
      note,
    });

    const restantes = await placesRestantes(evenement.id);
    const donnees = {
      prenom: membre.firstName,
      nom: membre.lastName,
      courriel: membre.email,
      titre: evenement.title,
      debut: evenement.startsAt,
      lieu: evenement.location,
      enLigne: evenement.isOnline,
      lienEnLigne: evenement.onlineUrl,
      aApporter: evenement.bringItems,
      note,
      jetonAnnulation: inscription.cancelToken,
    };

    // Un echec d'envoi ne doit pas annuler une inscription valide.
    try {
      await Promise.all([
        envoyerConfirmationInscription(donnees),
        envoyerNotificationAdmin(donnees, evenement.capacity - restantes, evenement.capacity),
      ]);
    } catch (erreurCourriel) {
      console.error('[Evenements] Envoi de courriel echoue :', erreurCourriel);
    }

    return NextResponse.json({ ok: true, placesRestantes: restantes }, { status: 201 });
  } catch (erreur) {
    if (erreur instanceof EvenementComplet) {
      return NextResponse.json(
        { error: 'Toutes les places sont prises.', code: 'COMPLET' },
        { status: 409 },
      );
    }
    if (erreur instanceof DejaInscrit) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement.', code: 'DEJA_INSCRIT' },
        { status: 409 },
      );
    }
    if (erreur instanceof EvenementIndisponible) {
      return NextResponse.json(
        { error: 'Cet événement n’accepte plus d’inscriptions.', code: 'INDISPONIBLE' },
        { status: 409 },
      );
    }
    if (erreur instanceof EvenementPasse) {
      return NextResponse.json(
        { error: 'Cet événement a déjà eu lieu.', code: 'PASSE' },
        { status: 409 },
      );
    }
    if (erreur instanceof EvenementIntrouvable) {
      return NextResponse.json({ error: 'Événement introuvable.' }, { status: 404 });
    }
    console.error('[Evenements] Inscription echouee :', erreur);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
```

- [ ] **Étape 2 : route d'annulation par jeton**

```ts
import { NextResponse } from 'next/server';
import { annulerParJeton } from '@/lib/evenements';
import { envoyerConfirmationAnnulation } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const inscription = await annulerParJeton(token);
  if (!inscription) {
    return NextResponse.json({ error: 'Lien d’annulation invalide.' }, { status: 404 });
  }

  try {
    await envoyerConfirmationAnnulation({
      prenom: inscription.firstName,
      nom: inscription.lastName,
      courriel: inscription.email,
      titre: inscription.event.title,
      debut: inscription.event.startsAt,
      lieu: inscription.event.location,
      enLigne: inscription.event.isOnline,
      lienEnLigne: inscription.event.onlineUrl,
      aApporter: inscription.event.bringItems,
      jetonAnnulation: inscription.cancelToken,
    });
  } catch (erreur) {
    console.error('[Evenements] Courriel d’annulation echoue :', erreur);
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Étape 3 : route « mes inscriptions »**

```ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { annulerParMembre } from '@/lib/evenements';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const inscriptions = await prisma.eventRegistration.findMany({
    where: { userId, status: 'CONFIRMED' },
    include: { event: true },
    orderBy: { event: { startsAt: 'asc' } },
  });
  return NextResponse.json({ inscriptions });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { registrationId } = (await req.json()) as { registrationId?: string };
  if (!registrationId) {
    return NextResponse.json({ error: 'Inscription non précisée.' }, { status: 400 });
  }

  const annulee = await annulerParMembre(registrationId, userId);
  if (!annulee) {
    return NextResponse.json({ error: 'Inscription introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Étape 4 : vérifier les types puis commit**

```bash
npx tsc --noEmit
git add src/app/api/evenements src/app/api/membre/evenements
git commit -m "Evenements : routes d'inscription, d'annulation et espace membre"
```

---

### Task 6 : Pages publiques

**Fichiers**
- Créer : `src/app/evenements/page.tsx`
- Créer : `src/app/evenements/[slug]/page.tsx`
- Créer : `src/app/evenements/[slug]/FormulaireInscription.tsx`
- Créer : `src/app/evenements/annulation/[token]/page.tsx`

**Interfaces**
- Consomme : `POST /api/evenements/[slug]/inscription` (Task 5), `formaterDateEvenement` (Task 3).
- Produit : les URLs `/evenements`, `/evenements/[slug]`, `/evenements/annulation/[token]`.

**Modèle visuel :** copier la structure de `src/app/seances/page.tsx` — `SectionTitle`,
`RuneDivider`, `Button` de `src/components/ui/`, classes de thème `font-cinzel`,
`text-or-ancien`, `bg-charbon-mystere`, `border-violet-royal/40`, `text-parchemin-vieilli/70`.

- [ ] **Étape 1 : liste publique `src/app/evenements/page.tsx`**

Page **serveur**. Squelette :

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formaterDateEvenement } from '@/lib/evenements';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Événements | Runes & Magie',
  description:
    'Rituels, veillées et célébrations à Saint-Eustache. Réservez votre place aux prochains rassemblements de Runes & Magie.',
};

export default async function PageEvenements() {
  const evenements = await prisma.event.findMany({
    where: { isPublished: true, cancelledAt: null, startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });

  return (
    <main className="min-h-screen bg-noir-nuit py-20">
      <div className="mx-auto max-w-5xl px-4">
        <SectionTitle title="Événements" subtitle="Rituels, veillées et célébrations" />
        <RuneDivider />

        {evenements.length === 0 ? (
          <p className="mt-12 text-center font-cormorant text-lg text-parchemin-vieilli/70">
            Aucun événement à l’horizon pour le moment. Revenez bientôt — la roue tourne.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {evenements.map((evenement) => {
              const restantes = evenement.capacity - evenement._count.registrations;
              return (
                <Link
                  key={evenement.id}
                  href={`/evenements/${evenement.slug}`}
                  className="block overflow-hidden rounded-lg border border-violet-royal/40 bg-charbon-mystere transition hover:border-or-ancien/60"
                >
                  {evenement.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={evenement.imageUrl} alt="" className="h-56 w-full object-cover" />
                  )}
                  <div className="p-6">
                    <h2 className="font-cinzel text-xl text-or-ancien">{evenement.title}</h2>
                    <p className="mt-2 font-cormorant text-parchemin-vieilli/80">
                      {formaterDateEvenement(evenement.startsAt)}
                    </p>
                    <p className="font-cormorant text-parchemin-vieilli/60">{evenement.location}</p>
                    <p className="mt-4 font-cinzel text-sm tracking-widest text-turquoise-cristal">
                      {restantes > 0 ? `${restantes} place${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}` : 'COMPLET'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Étape 2 : fiche publique `src/app/evenements/[slug]/page.tsx`**

Page **serveur**. Points obligatoires :

1. `const { slug } = await params;` — Next.js 16.
2. `generateMetadata` avec `openGraph.images` = `imageUrl` (les partages Facebook).
3. `notFound()` si l'événement n'existe pas **ou** n'est pas publié.
4. Les événements **passés** restent affichés (les liens partagés ne cassent pas), mais
   sans formulaire — un bandeau « Cet événement a eu lieu ».
5. Si `cancelledAt` est renseigné : bandeau « Événement annulé », pas de formulaire.
6. Lire la session via `auth()` et passer `estConnecte` au composant client.
7. Passer `placesRestantes` et `dejaInscrit` au composant client.

```tsx
const session = await auth();
const userId = (session?.user as { id?: string } | undefined)?.id;
const dejaInscrit = userId
  ? (await prisma.eventRegistration.count({
      where: { eventId: evenement.id, userId, status: 'CONFIRMED' },
    })) > 0
  : false;
```

- [ ] **Étape 3 : îlot client `FormulaireInscription.tsx`**

`'use client'`. Reçoit `{ slug, estConnecte, placesRestantes, dejaInscrit, capacite }`.

Trois états d'affichage :

**Non connecté** — pas de formulaire, mais deux liens, construits comme le bandeau de
`src/app/(holistique)/soins/reserver/[practitionerId]/page.tsx:643` :

```tsx
const retour = encodeURIComponent(
  typeof window !== 'undefined' ? window.location.pathname : `/evenements/${slug}`,
);
// <Link href={`/soins/auth/login?next=${retour}`}>Se connecter</Link>
// <Link href={`/soins/auth/register?next=${retour}`}>Créer mon compte</Link>
```

Avant de quitter la page, mémoriser le message saisi :

```tsx
function memoriserNote(note: string) {
  try {
    if (note.trim()) sessionStorage.setItem(`evenement:${slug}:note`, note.trim());
  } catch {
    // Navigation privée : tant pis, le message n'est pas conserve.
  }
}
```

**Connecté et pas encore inscrit** — un `<textarea>` optionnel (« Un message ? une
allergie ? vous venez accompagné ? ») et un bouton **Je réserve ma place**. Au montage,
réinjecter la note mémorisée puis la supprimer du `sessionStorage`.

À la soumission :

```tsx
const reponse = await fetch(`/api/evenements/${slug}/inscription`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ note }),
});
const donnees = await reponse.json();
if (!reponse.ok) {
  setErreur(donnees.error ?? 'Une erreur est survenue.');
  if (donnees.code === 'COMPLET') setRestantes(0);
  return;
}
setInscrit(true);
setRestantes(donnees.placesRestantes);
```

**Déjà inscrit, ou après succès** — message de confirmation « Votre place est réservée »
+ lien vers `/compte/evenements`. Si `placesRestantes === 0` et non inscrit : bandeau
**COMPLET**, bouton désactivé.

- [ ] **Étape 4 : page d'annulation `src/app/evenements/annulation/[token]/page.tsx`**

Page **serveur** qui rend un petit îlot client. Le client appelle
`POST /api/evenements/annulation/<token>` **au clic sur un bouton de confirmation**,
jamais au chargement — sinon un aperçu de lien dans un client de messagerie annulerait
la place tout seul.

- [ ] **Étape 5 : vérifier, construire, commiter**

```bash
npx tsc --noEmit
npm run build
git add src/app/evenements
git commit -m "Evenements : pages publiques liste, fiche et annulation"
```

---

### Task 7 : Espace membre

**Fichiers**
- Créer : `src/app/(membre)/compte/evenements/page.tsx`
- Créer : `src/app/(membre)/compte/evenements/MesInscriptions.tsx`
- Modifier : `src/components/membre/MembreShell.tsx:14-22`
- Modifier : `src/app/(membre)/compte/page.tsx`

**Interfaces**
- Consomme : `GET` et `DELETE /api/membre/evenements` (Task 5).

- [ ] **Étape 1 : entrée de navigation**

Dans `src/components/membre/MembreShell.tsx`, ajouter à `NAV_ITEMS` **après**
`Mes formations` (ligne 16) :

```ts
  { href: '/compte/evenements', label: 'Mes événements', icon: '🔥' },
```

Ne pas toucher à l'entrée `Les Veillées de Noctura` — c'est une page distincte, en attente.

- [ ] **Étape 2 : carte du tableau de bord**

Dans `src/app/(membre)/compte/page.tsx`, ajouter au tableau `CARDS` une entrée pointant
vers `/compte/evenements`, en copiant exactement la forme des entrées voisines.

- [ ] **Étape 3 : page serveur**

Le layout `src/app/(membre)/compte/layout.tsx` garantit déjà que la personne est un
membre — ne pas refaire la garde. Lire directement les inscriptions via Prisma, séparer
`aVenir` (`event.startsAt >= now`) et `passees`, puis passer le tout à l'îlot client.

- [ ] **Étape 4 : îlot client**

Liste des inscriptions à venir avec un bouton **Annuler ma place** qui appelle
`DELETE /api/membre/evenements` avec `{ registrationId }`, puis retire la ligne de
l'affichage. Les inscriptions passées sont listées sans bouton.

- [ ] **Étape 5 : vérifier et commiter**

```bash
npx tsc --noEmit
git add src/app/\(membre\)/compte/evenements src/components/membre/MembreShell.tsx src/app/\(membre\)/compte/page.tsx
git commit -m "Evenements : mes inscriptions dans l'espace membre"
```

---

### Task 8 : API admin

**Fichiers**
- Créer : `src/app/api/admin/evenements/route.ts`
- Créer : `src/app/api/admin/evenements/[id]/route.ts`
- Créer : `src/app/api/admin/evenements/[id]/inscrits/route.ts`
- Créer : `src/app/api/admin/evenements/[id]/inscrits/[registrationId]/route.ts`
- Créer : `src/app/api/admin/evenements/[id]/message/route.ts`
- Créer : `src/app/api/admin/evenements/[id]/annuler/route.ts`

**Interfaces**
- Consomme : `requireAdmin` de `@/lib/admin-guard`, courriels de la Task 4.
- Produit : le CRUD complet consommé par la Task 9.

- [ ] **Étape 1 : liste et création**

```ts
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Transforme un titre en identifiant d'URL : « Rituel de Lughnasadh » → « rituel-de-lughnasadh ». */
function versSlug(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const evenements = await prisma.event.findMany({
    orderBy: { startsAt: 'desc' },
    include: { _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
  });
  return NextResponse.json({ evenements });
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const corps = (await req.json()) as Record<string, unknown>;

  const titre = typeof corps.title === 'string' ? corps.title.trim() : '';
  const description = typeof corps.description === 'string' ? corps.description.trim() : '';
  const lieu = typeof corps.location === 'string' ? corps.location.trim() : '';
  const capacite = Number(corps.capacity);
  const debut = corps.startsAt ? new Date(String(corps.startsAt)) : null;

  if (!titre) return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'La description est requise.' }, { status: 400 });
  if (!lieu) return NextResponse.json({ error: 'Le lieu est requis.' }, { status: 400 });
  if (!debut || Number.isNaN(debut.getTime())) {
    return NextResponse.json({ error: 'La date de début est invalide.' }, { status: 400 });
  }
  if (!Number.isInteger(capacite) || capacite < 1) {
    return NextResponse.json({ error: 'Le nombre de places doit être un entier positif.' }, { status: 400 });
  }

  const fin = corps.endsAt ? new Date(String(corps.endsAt)) : null;
  if (fin && !Number.isNaN(fin.getTime()) && fin.getTime() <= debut.getTime()) {
    return NextResponse.json({ error: 'La fin doit suivre le début.' }, { status: 400 });
  }

  // Slug unique : on suffixe si le titre est déjà pris.
  const base = versSlug(titre) || 'evenement';
  let slug = base;
  for (let n = 2; await prisma.event.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  const evenement = await prisma.event.create({
    data: {
      slug,
      title: titre,
      excerpt: typeof corps.excerpt === 'string' ? corps.excerpt.trim() || null : null,
      description,
      imageUrl: typeof corps.imageUrl === 'string' ? corps.imageUrl.trim() || null : null,
      startsAt: debut,
      endsAt: fin && !Number.isNaN(fin.getTime()) ? fin : null,
      location: lieu,
      isOnline: corps.isOnline === true,
      onlineUrl: typeof corps.onlineUrl === 'string' ? corps.onlineUrl.trim() || null : null,
      capacity: capacite,
      bringItems: typeof corps.bringItems === 'string' ? corps.bringItems.trim() || null : null,
      isPublished: corps.isPublished === true,
    },
  });

  return NextResponse.json({ evenement }, { status: 201 });
}
```

- [ ] **Étape 2 : lecture, modification, suppression**

`GET`, `PATCH` et `DELETE` sur `[id]`. Règles :
- `PATCH` applique la même validation que `POST` sur les champs fournis. Il **refuse**
  de réduire `capacity` en dessous du nombre d'inscrits confirmés (message :
  « 12 personnes sont déjà inscrites, le nombre de places ne peut pas descendre sous 12. »).
- `DELETE` **refuse** si des inscriptions confirmées existent (message : « Annulez
  l'événement plutôt que de le supprimer : 12 personnes sont inscrites. »). Ne jamais
  effacer silencieusement des inscrits.

- [ ] **Étape 3 : inscrits et export CSV**

```ts
const lignes = [
  ['Prénom', 'Nom', 'Courriel', 'Téléphone', 'Inscrit le', 'Message'],
  ...inscrits.map((i) => [
    i.firstName, i.lastName, i.email, i.phone ?? '',
    i.createdAt.toISOString().slice(0, 10), i.note ?? '',
  ]),
];

/**
 * Neutralise l'injection de formule : une valeur commençant par = + - @
 * est exécutée par Excel à l'ouverture du fichier.
 */
function cellule(valeur: string): string {
  const sur = /^[=+\-@]/.test(valeur) ? `'${valeur}` : valeur;
  return `"${sur.replace(/"/g, '""')}"`;
}

const csv = '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n');
return new NextResponse(csv, {
  headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="inscrits-${evenement.slug}.csv"`,
  },
});
```

Le `﻿` en tête et le `;` comme séparateur sont nécessaires pour qu'Excel en
français ouvre correctement les accents et les colonnes.

- [ ] **Étape 4 : désinscription manuelle, message à tous, annulation**

- `DELETE .../inscrits/[registrationId]` → passe le statut à `CANCELLED`, envoie
  `envoyerConfirmationAnnulation`.
- `POST .../message` → corps `{ sujet, message }`, les deux obligatoires ; appelle
  `envoyerMessageAuxInscrits` avec les courriels des inscrits confirmés.
- `POST .../annuler` → corps `{ motif }` optionnel ; renseigne `cancelledAt`, passe
  toutes les inscriptions confirmées à `CANCELLED`, puis appelle
  `envoyerAnnulationEvenement`. **Récupérer les courriels AVANT** de passer les
  inscriptions à `CANCELLED`.

- [ ] **Étape 5 : vérifier et commiter**

```bash
npx tsc --noEmit
git add src/app/api/admin/evenements
git commit -m "Evenements : API d'administration complete"
```

---

### Task 9 : Écrans d'administration

**Fichiers**
- Créer : `src/app/admin/evenements/page.tsx`
- Créer : `src/app/admin/evenements/nouveau/page.tsx`
- Créer : `src/app/admin/evenements/[id]/page.tsx`
- Créer : `src/app/admin/evenements/FormulaireEvenement.tsx`
- Créer : `src/app/admin/evenements/[id]/ActionsInscrits.tsx`
- Modifier : `src/app/admin/layout.tsx:11-32`

**Interfaces**
- Consomme : l'API de la Task 8.

**Modèle visuel :** copier `src/app/admin/todo/page.tsx` (page `'use client'` + `fetch`)
et ses styles **inline** (`style={{...}}`) — violet `#6B3FA0`, titres `#2D1B4E`, gris
`#6B7280`, bordures `#E5E7EB`, or `#C9A84C`, `fontFamily: 'var(--font-cinzel, serif)'`.
L'admin n'utilise pas les classes Tailwind du thème public.

- [ ] **Étape 1 : entrée du menu latéral**

Dans `src/app/admin/layout.tsx`, ajouter à `navItems` **après** l'entrée `To-do liste`
(ligne 29) :

```ts
  { label: 'Événements', href: '/admin/evenements', icon: 'ᛝ', match: ['/admin/evenements'] },
```

- [ ] **Étape 2 : liste**

Tableau : titre, date, `« 12 / 15 inscrits »`, état (Publié / Brouillon / Annulé),
lien vers la fiche. Bouton **Nouvel événement**.

- [ ] **Étape 3 : formulaire partagé**

`FormulaireEvenement.tsx` (`'use client'`), utilisé par `nouveau` et `[id]`. Champs :
titre, accroche, description (`<textarea>`), URL d'image, début (`datetime-local`), fin
(`datetime-local`), lieu, case « En ligne », URL de visioconférence (affichée seulement
si « En ligne » est coché), places (`number`, min 1), quoi apporter, case « Publié ».

⚠️ `datetime-local` renvoie une chaîne **sans fuseau** (`2026-08-08T13:00`). La convertir
explicitement pour l'heure de l'Est avant l'envoi, sinon un événement saisi à 13h est
enregistré à 13h UTC (donc 9h à Montréal). Utiliser :

```ts
/** « 2026-08-08T13:00 » saisi au Québec → Date UTC correcte. */
function versDateEst(valeur: string): string {
  // L'Est est à UTC-4 en heure avancée (mars→novembre), UTC-5 sinon.
  const local = new Date(`${valeur}:00`);
  const enEst = new Date(local.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const decalage = local.getTime() - enEst.getTime();
  return new Date(local.getTime() + decalage).toISOString();
}
```

Et l'inverse pour préremplir le formulaire en édition.

- [ ] **Étape 4 : fiche d'édition + inscrits**

Formulaire en haut, liste des inscrits en dessous (nom, courriel, téléphone, date,
message, bouton **Désinscrire**), puis `ActionsInscrits.tsx` : bouton **Exporter en CSV**
(lien direct vers `?format=csv`), **Écrire à tous les inscrits** (modale sujet + message),
**Annuler l'événement** (modale avec motif optionnel).

Les modales sont des `<div>` en position fixe — **jamais `confirm()` ni `alert()`**.

- [ ] **Étape 5 : vérifier, construire, commiter**

```bash
npx tsc --noEmit
npm run build
git add src/app/admin/evenements src/app/admin/layout.tsx
git commit -m "Evenements : onglet d'administration avec editeur complet"
```

---

### Task 10 : Rappel automatique

**Fichiers**
- Créer : `src/app/api/cron/event-reminders/route.ts`
- Modifier : `vercel.json`

**Interfaces**
- Consomme : `envoyerRappel` (Task 4).

- [ ] **Étape 1 : la route**

Copier l'authentification de `src/app/api/cron/social-publish/route.ts` :

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { envoyerRappel } from '@/lib/evenement-email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function estAutorise(req: Request): boolean {
  const secret =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.headers.get('x-cron-secret');
  return !!secret && secret === process.env.CRON_SECRET;
}

/**
 * Cron quotidien (9h Est) : rappelle les événements des 48 prochaines heures.
 *
 * Fenêtre de 48 h et non 24 h : le plan Vercel Hobby n'autorise QU'UN passage
 * par jour, donc une fenêtre de 24 h manquerait des événements. `reminderSentAt`
 * garantit qu'un rappel n'est jamais envoyé deux fois.
 */
export async function GET(req: Request) {
  if (!estAutorise(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const maintenant = new Date();
  const limite = new Date(maintenant.getTime() + 48 * 3600 * 1000);

  const inscriptions = await prisma.eventRegistration.findMany({
    where: {
      status: 'CONFIRMED',
      reminderSentAt: null,
      event: { cancelledAt: null, isPublished: true, startsAt: { gte: maintenant, lte: limite } },
    },
    include: { event: true },
    take: 200,
  });

  let envoyes = 0;
  const echecs: string[] = [];

  for (const inscription of inscriptions) {
    try {
      await envoyerRappel({
        prenom: inscription.firstName,
        nom: inscription.lastName,
        courriel: inscription.email,
        titre: inscription.event.title,
        debut: inscription.event.startsAt,
        lieu: inscription.event.location,
        enLigne: inscription.event.isOnline,
        lienEnLigne: inscription.event.onlineUrl,
        aApporter: inscription.event.bringItems,
        jetonAnnulation: inscription.cancelToken,
      });
      // Marqué seulement après un envoi réussi : un échec sera retenté demain.
      await prisma.eventRegistration.update({
        where: { id: inscription.id },
        data: { reminderSentAt: new Date() },
      });
      envoyes++;
    } catch (erreur) {
      console.error('[Rappels] Echec pour', inscription.email, erreur);
      echecs.push(inscription.email);
    }
  }

  return NextResponse.json({ traitees: inscriptions.length, envoyes, echecs: echecs.length });
}
```

- [ ] **Étape 2 : déclarer le cron**

Dans `vercel.json`, ajouter au tableau `crons` :

```json
    {
      "path": "/api/cron/event-reminders",
      "schedule": "0 13 * * *"
    }
```

⚠️ **Uniquement une planification quotidienne.** Le plan Vercel est Hobby : toute
fréquence sub-quotidienne (`*/10 * * * *`, `0 * * * *`) fait **échouer tout le build** —
c'est ce qui a bloqué les déploiements de ce projet pendant 20 jours.

- [ ] **Étape 3 : tester la route à la main**

```bash
npx tsx -e "console.log(process.env.CRON_SECRET ? 'CRON_SECRET presente' : 'ABSENTE')"
```

Puis, une fois déployé, avec la valeur réelle de `CRON_SECRET` :

```bash
curl -s -H "x-cron-secret: <valeur>" https://www.runesetmagie.ca/api/cron/event-reminders
```

Attendu : `{"traitees":N,"envoyes":N,"echecs":0}`

- [ ] **Étape 4 : déployer et vérifier que Vercel accepte le 5ᵉ cron**

```bash
git add src/app/api/cron/event-reminders vercel.json
git commit -m "Evenements : rappel automatique quotidien"
git -c credential.helper="" -c credential.helper="!gh auth git-credential" push origin main
vercel --prod --yes
```

**Si Vercel refuse** avec un message sur la limite de crons : retirer l'entrée de
`vercel.json`, supprimer la route, et déplacer la boucle de rappel à la fin de
`src/app/api/cron/holistic-reminders/route.ts`. Le comportement visible reste identique.

---

### Task 11 : Mise en ligne de Lughnasadh

**Fichiers**
- Créer : `scripts/creer-lughnasadh.ts`

- [ ] **Étape 1 : entrée de menu public**

Ajouter « Événements » via `/admin/site/menu` (interface existante), en `HEADER` et
`FOOTER`, `href` = `/evenements`, `sortOrder` entre École et Boutique. **Le faire dans
l'interface, pas en base directement** — c'est le but de cet écran.

- [ ] **Étape 2 : créer l'événement**

Deux voies, au choix du client :
- via `/admin/evenements/nouveau` (c'est le but du module) ;
- ou via le script, si le client préfère que ce soit fait pour lui.

Le script `scripts/creer-lughnasadh.ts` reprend les valeurs du §13 du devis. **Il ne peut
pas être écrit tant que l'heure de début, le lieu et la description ne sont pas connus.**
Demander ces informations avant d'exécuter cette étape.

- [ ] **Étape 3 : parcours de vérification en production**

À exécuter et **rapporter honnêtement**, y compris les échecs :

1. `/evenements` affiche Lughnasadh avec « 15 places restantes »
2. En navigation privée : la fiche affiche « Créez votre compte », pas de formulaire
3. Créer un compte de test depuis le lien → retour automatique sur la fiche
4. S'inscrire avec un message → confirmation à l'écran, compteur à 14
5. Le courriel de confirmation arrive, la date et le lieu y sont exacts
6. La notification « 1/15 » arrive à l'administration
7. `/compte/evenements` liste l'inscription
8. Le lien d'annulation du courriel fonctionne, le compteur remonte à 15
9. `/admin/evenements` affiche « 0 / 15 » et l'inscription annulée
10. L'export CSV s'ouvre correctement dans Excel, accents compris
11. Supprimer le compte de test

- [ ] **Étape 4 : déploiement final**

```bash
git add scripts/creer-lughnasadh.ts
git commit -m "Evenements : creation du rituel Lughnasadh"
git -c credential.helper="" -c credential.helper="!gh auth git-credential" push origin main
vercel --prod --yes
```

---

## Ordre d'exécution et point de bascule

Les tâches **1 à 6** livrent le parcours d'inscription public complet. **Si le temps
manque avant samedi**, c'est le lot minimal viable : l'événement peut être créé par
script (Task 11 étape 2) et les inscriptions fonctionnent avec leurs courriels.

Les tâches **7 à 10** (espace membre, écrans admin, rappel) peuvent suivre. La liste des
inscrits reste consultable en base entre-temps.

## Auto-revue

**Couverture du devis** — chaque section a sa tâche : §4 données → T1 ; §5 parcours →
T5/T6 ; §6 écrans → T6/T7/T9 ; §7 API → T5/T8 ; §8 courriels → T2/T4 ; §9 rappel → T10 ;
§10 sécurité → gardes en T5/T8, échappement en T2, CSV en T8 ; §11 vérification → T3
étape 3 et T11 étape 3.

**Cohérence des noms** — `inscrire`, `placesRestantes`, `annulerParJeton`,
`annulerParMembre`, `formaterDateEvenement` (T3) sont utilisés sous ces noms exacts en
T5, T6 et T10. `gabaritCourriel`, `encoderHtml`, `bouton`, `encadre` (T2) sont utilisés
sous ces noms en T4. `DonneesCourrielEvenement` (T4) est construit à l'identique en T5 et T10.

**Écart connu et assumé** — cette compétence impose le TDD, mais le projet n'a aucune
infrastructure de tests et on est à trois jours de l'événement. Les étapes de test sont
remplacées par `npx tsc --noEmit`, `npm run build`, le script de concurrence réel de la
Task 3 et le parcours manuel de la Task 11. C'est un compromis délibéré, pas un oubli.
