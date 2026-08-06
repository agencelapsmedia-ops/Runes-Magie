# Agenda mobile — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser `superpowers:subagent-driven-development`
> (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche.
> Les étapes utilisent des cases à cocher (`- [ ]`).

**But :** permettre à Noctura de créer un rendez-vous client depuis son téléphone en quatre
taps, et rendre l'ensemble de l'administration utilisable sur petit écran.

**Architecture :** quatre pièces indépendantes. La coquille de l'admin devient adaptative
(le menu se rétracte sous 1024 px), un module serveur calcule les créneaux réellement libres
en combinant disponibilités, rendez-vous et Google Agenda, une feuille de création en quatre
temps remplace le formulaire à dix champs, et un manifeste rend le site installable sur
l'écran d'accueil.

**Pile technique :** Next.js 16 (App Router, React 19), TypeScript, Prisma 6 + Postgres
Supabase, FullCalendar 6, Tailwind v4.

**Devis de référence :** `docs/superpowers/specs/2026-08-06-agenda-mobile-design.md`

---

## Contraintes globales

- **Tout en français** : interface, commits, commentaires.
- **Next.js 16** : `params` et `searchParams` des pages et routes sont des **`Promise`** à
  `await`. Lire `node_modules/next/dist/docs/` avant d'utiliser une API incertaine.
- **Le back-office utilise des styles inline React** (`style={{...}}`) avec la palette violet
  `#6B3FA0`, titres `#2D1B4E`, gris `#6B7280`/`#9CA3AF`, bordures `#E5E7EB`, or `#C9A84C`,
  `fontFamily: 'var(--font-cinzel, serif)'`. **Exception** : `src/app/admin/layout.tsx` est
  écrit en classes Tailwind — le conserver ainsi.
- **Jamais `alert()` ni `confirm()`** dans le nouveau code.
- **Zones tapables d'au moins 44 × 44 px** sur tout élément interactif ajouté.
- **Aucune infrastructure de tests** ne doit être introduite. Vérification : `npx tsc --noEmit`,
  le script de la Task 3, et un parcours manuel sur téléphone réel.
- `npx tsc --noEmit` remonte **une erreur préexistante** dans
  `src/app/admin/praticiens/modifications/actions.ts:150`. Elle n'est de personne ici.
  Critère : aucune erreur NOUVELLE.
- **`npm run build` échoue dans cet environnement** pour une raison sans rapport : le `#` du
  chemin Dropbox casse le chargement CSS de Turbopack. Reproductible sans nos fichiers. Ne
  pas s'en servir comme vérification, ne pas tenter de le réparer.
- **Déploiement** : `git push` **puis `vercel --prod`** — le déploiement automatique Git ne
  fonctionne pas sur ce projet. Vérifier `vercel.json` avant chaque déploiement (une
  planification de cron sub-quotidienne fait échouer tout le build).
- **Ne pas toucher** à `src/app/(holistique)/soins/reserver/[practitionerId]/page.tsx` :
  cette page encaisse les paiements et est hors périmètre.

---

## Structure des fichiers

**Créés**
| Fichier | Responsabilité |
|---|---|
| `src/app/manifest.ts` | Manifeste d'application (installation sur l'écran d'accueil) |
| `src/lib/creneaux.ts` | Calcul serveur des créneaux libres |
| `src/app/api/admin/agenda/creneaux/route.ts` | Expose les créneaux à l'interface |
| `src/app/admin/calendrier/FeuilleRendezVous.tsx` | Feuille de création en quatre temps |
| `scripts/test-creneaux.ts` | Vérification du calcul sur les vraies disponibilités |

**Modifiés**
| Fichier | Modification |
|---|---|
| `src/app/admin/layout.tsx` | Coquille adaptative : menu rétractable, barre supérieure |
| `src/app/layout.tsx` | Métadonnées `themeColor` et `appleWebApp` |
| `src/app/api/holistique/appointments/manual/route.ts:93-105` | Indicateur `forcerMalgreAgenda` |
| `src/app/admin/calendrier/CalendrierClient.tsx` | Vue liste sur mobile, bouton flottant, feuille |
| `package.json` | Dépendance `@fullcalendar/list` |

---

### Task 1 : La coquille adaptative

**Fichiers**
- Modifier : `src/app/admin/layout.tsx` (bloc `AdminShell`, lignes 78-142)

**Interfaces**
- Produit : rien d'importable. Effet : sous 1024 px, `<main>` occupe toute la largeur.

C'est la tâche la plus rentable du plan : elle débloque **toutes** les pages de l'admin, pas
seulement l'agenda. Aujourd'hui `<aside className="fixed ... w-64">` et
`<main className="ml-64 p-8">` laissent 70 px de contenu sur un écran de 390 px.

- [ ] **Étape 1 : ajouter l'état d'ouverture du menu**

Dans `AdminShell`, juste après les hooks existants (`useSession`, `usePathname`, `useRouter`) :

```tsx
const [menuOuvert, setMenuOuvert] = useState(false);

// Le panneau se referme à chaque navigation : sur téléphone, garder le menu
// ouvert après un clic masquerait la page qu'on vient d'ouvrir.
useEffect(() => {
  setMenuOuvert(false);
}, [pathname]);
```

Ajouter `useState` à l'import de `react` (le fichier importe déjà `useEffect`).

- [ ] **Étape 2 : la barre supérieure, visible sous 1024 px uniquement**

Juste avant `<aside>` :

```tsx
{/* Barre mobile : n'existe que sous 1024 px, où le menu latéral est rétracté */}
<header className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center gap-3 px-4"
        style={{ background: 'linear-gradient(90deg, #2D1B4E 0%, #1A1A2E 100%)' }}>
  <button
    type="button"
    onClick={() => setMenuOuvert(true)}
    aria-label="Ouvrir le menu"
    aria-expanded={menuOuvert}
    className="flex items-center justify-center w-11 h-11 -ml-2 text-or-ancien"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  </button>
  <span className="font-cinzel text-or-ancien text-base truncate">
    {navItems.find((i) => (i.exact ? pathname === i.href : i.match.some((p) => pathname.startsWith(p))))?.label
      ?? 'Administration'}
  </span>
</header>
```

- [ ] **Étape 3 : le voile de fond**

Juste après la barre supérieure :

```tsx
{/* Voile : fermer en tapant à côté est le geste attendu sur téléphone */}
<div
  onClick={() => setMenuOuvert(false)}
  aria-hidden="true"
  className={`lg:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
    menuOuvert ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
/>
```

- [ ] **Étape 4 : rendre le menu latéral rétractable**

Remplacer la ligne d'ouverture de `<aside>` (ligne 82) par :

```tsx
<aside
  className={`fixed inset-y-0 left-0 w-64 flex flex-col z-50 transition-transform duration-300 ${
    menuOuvert ? 'translate-x-0' : '-translate-x-full'
  } lg:translate-x-0 lg:z-30`}
  style={{ background: 'linear-gradient(180deg, #2D1B4E 0%, #1A1A2E 100%)' }}
>
```

`lg:translate-x-0` garantit que **rien ne change au-dessus de 1024 px** : le menu y reste
affiché en permanence, comme aujourd'hui.

- [ ] **Étape 5 : élargir le contenu et respecter la barre supérieure**

Remplacer la ligne 141 :

```tsx
<main className="ml-0 lg:ml-64 pt-14 lg:pt-0 p-4 lg:p-8">{children}</main>
```

`pt-14` réserve la hauteur de la barre mobile ; `lg:pt-0` la retire sur ordinateur.

- [ ] **Étape 6 : vérifier les types**

```bash
npx tsc --noEmit
```

Attendu : uniquement l'erreur préexistante de `praticiens/modifications/actions.ts:150`.

- [ ] **Étape 7 : commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "Admin : menu retractable sous 1024 px"
```

---

### Task 2 : Installation sur l'écran d'accueil

**Fichiers**
- Créer : `src/app/manifest.ts`
- Modifier : `src/app/layout.tsx` (objet `metadata`)

**Interfaces**
- Produit : `/manifest.webmanifest` servi par Next.js.

- [ ] **Étape 1 : créer le manifeste**

```ts
import type { MetadataRoute } from 'next';

/**
 * Manifeste d'application — permet « Ajouter à l'écran d'accueil ».
 *
 * `start_url` pointe sur /admin : ce manifeste est un outil de travail pour
 * l'équipe, pas une fonctionnalité destinée aux visiteuses. À revoir le jour
 * où l'on voudrait proposer l'installation aux clientes.
 *
 * `display: 'standalone'` retire la barre d'adresse du navigateur, ce qui
 * regagne environ 15 % de hauteur d'écran — décisif sur un agenda.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Runes & Magie — Administration',
    short_name: 'Runes & Magie',
    description: 'Agenda, boutique et clientèle de Runes & Magie.',
    start_url: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0A12',
    theme_color: '#2D1B4E',
    lang: 'fr-CA',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
```

- [ ] **Étape 2 : les métadonnées iOS**

iOS ignore le manifeste pour le plein écran : il lui faut ses propres balises. Dans
`src/app/layout.tsx`, ajouter à l'objet `metadata` exporté :

```ts
  appleWebApp: {
    capable: true,
    title: 'Runes & Magie',
    statusBarStyle: 'black-translucent',
  },
```

Et exporter le viewport (Next.js 16 le veut séparé de `metadata`) :

```ts
export const viewport = {
  themeColor: '#2D1B4E',
  width: 'device-width',
  initialScale: 1,
};
```

Si un `export const viewport` existe déjà, y ajouter `themeColor` sans dupliquer.

- [ ] **Étape 3 : vérifier**

```bash
npx tsc --noEmit
```

Après déploiement, `curl -s https://www.runesetmagie.ca/manifest.webmanifest` doit renvoyer
le JSON ci-dessus.

- [ ] **Étape 4 : commit**

```bash
git add src/app/manifest.ts src/app/layout.tsx
git commit -m "Site installable sur l'ecran d'accueil"
```

---

### Task 3 : Le calcul des créneaux libres

**Fichiers**
- Créer : `src/lib/creneaux.ts`
- Créer : `scripts/test-creneaux.ts`

**Interfaces**
- Consomme : `prisma` de `@/lib/db`, `getBusyPeriods` de `@/lib/google-calendar`.
- Produit :
  - `interface Creneau { debut: string; debutIso: string; disponible: boolean; motif?: 'RENDEZ_VOUS' | 'AGENDA_PERSONNEL'; etiquette?: string }`
  - `calculerCreneaux(params: { practitionerId: string; date: string; offeringId: string }): Promise<{ creneaux: Creneau[]; agendaGoogleConsulte: boolean }>`

- [ ] **Étape 1 : créer le module**

```ts
import { prisma } from '@/lib/db';
import { getBusyPeriods } from '@/lib/google-calendar';

const FUSEAU = 'America/Toronto';

export interface Creneau {
  /** Heure locale affichable, ex. « 13:15 ». */
  debut: string;
  /** Instant exact, à renvoyer tel quel à la route de création. */
  debutIso: string;
  disponible: boolean;
  /** Pourquoi le créneau est pris. Absent s'il est libre. */
  motif?: 'RENDEZ_VOUS' | 'AGENDA_PERSONNEL';
  /** Nom de l'événement personnel, pour l'avertissement. */
  etiquette?: string;
}

export interface ResultatCreneaux {
  creneaux: Creneau[];
  /** false si l'agenda Google n'a pas pu être consulté : l'interface doit le dire. */
  agendaGoogleConsulte: boolean;
}

/** « 2026-08-11 » + « 13:15 » (heure de l'Est) → instant UTC exact. */
function instantEst(date: string, heure: string): Date {
  const [an, mois, jour] = date.split('-').map(Number);
  const [h, min] = heure.split(':').map(Number);
  // On part d'une estimation UTC, on lit l'heure qu'elle donne à Toronto,
  // et on corrige de l'écart. Deux passes suffisent, y compris aux bascules
  // d'heure avancée. Ne jamais coder -4 ou -5 en dur.
  let estimation = Date.UTC(an, mois - 1, jour, h, min);
  for (let passe = 0; passe < 2; passe++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(estimation));
    const lu = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const obtenu = Date.UTC(lu('year'), lu('month') - 1, lu('day'), lu('hour') % 24, lu('minute'));
    const ecart = Date.UTC(an, mois - 1, jour, h, min) - obtenu;
    if (ecart === 0) break;
    estimation += ecart;
  }
  return new Date(estimation);
}

/** Jour de la semaine (0 = dimanche) de cette date, à Toronto. */
function jourSemaine(date: string): number {
  return instantEst(date, '12:00').getUTCDay() === new Date(`${date}T12:00:00Z`).getUTCDay()
    ? new Date(`${date}T12:00:00Z`).getUTCDay()
    : new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Découpe un bloc « 10:45 »–« 12:15 » en départs possibles, pas de 15 minutes. */
function departsPossibles(debut: string, fin: string, dureeMinutes: number): string[] {
  const [hD, mD] = debut.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  const depart = hD * 60 + mD;
  const finBloc = hF * 60 + mF;
  const sorties: string[] = [];
  for (let t = depart; t + dureeMinutes <= finBloc; t += 15) {
    sorties.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return sorties;
}

export async function calculerCreneaux(params: {
  practitionerId: string;
  /** « 2026-08-11 » */
  date: string;
  offeringId: string;
}): Promise<ResultatCreneaux> {
  const { practitionerId, date, offeringId } = params;

  const offering = await prisma.offering.findUnique({
    where: { id: offeringId },
    select: { durationMinutes: true, practitionerId: true },
  });
  if (!offering || offering.practitionerId !== practitionerId) {
    return { creneaux: [], agendaGoogleConsulte: false };
  }
  const duree = offering.durationMinutes;

  const jour = new Date(`${date}T12:00:00Z`).getUTCDay();
  const debutJournee = instantEst(date, '00:00');
  const finJournee = new Date(debutJournee.getTime() + 24 * 3600 * 1000);

  // 1) Les blocs déclarés : récurrents du bon jour, ou ponctuels à cette date.
  const dispos = await prisma.holisticAvailability.findMany({
    where: {
      practitionerId,
      isActive: true,
      OR: [
        { date: null, dayOfWeek: jour },
        { date: { gte: debutJournee, lt: finJournee } },
      ],
    },
    orderBy: { startTime: 'asc' },
  });

  // 2) Les rendez-vous déjà pris ce jour-là.
  const rdv = await prisma.holisticAppointment.findMany({
    where: {
      practitionerId,
      status: { not: 'CANCELLED' },
      startsAt: { lt: finJournee },
      endsAt: { gt: debutJournee },
    },
    select: { startsAt: true, endsAt: true },
  });

  // 3) L'agenda Google. Un échec ne doit jamais vider la liste : mieux vaut
  //    des créneaux à vérifier qu'un écran vide.
  let occupes: Array<{ start: string; end: string; summary?: string }> = [];
  let agendaGoogleConsulte = false;
  try {
    occupes = (await getBusyPeriods(practitionerId, debutJournee, finJournee)) as typeof occupes;
    agendaGoogleConsulte = true;
  } catch (err) {
    console.error('[creneaux] agenda Google injoignable (non bloquant)', err);
  }

  const creneaux: Creneau[] = [];
  for (const bloc of dispos) {
    for (const heure of departsPossibles(bloc.startTime, bloc.endTime, duree)) {
      const debutIso = instantEst(date, heure);
      const fin = new Date(debutIso.getTime() + duree * 60 * 1000);

      const prisParRdv = rdv.some((r) => r.startsAt < fin && r.endsAt > debutIso);
      const perso = occupes.find((o) => new Date(o.start) < fin && new Date(o.end) > debutIso);

      creneaux.push({
        debut: heure,
        debutIso: debutIso.toISOString(),
        // Un événement personnel n'interdit pas : il avertit (voir §8 du devis).
        disponible: !prisParRdv,
        motif: prisParRdv ? 'RENDEZ_VOUS' : perso ? 'AGENDA_PERSONNEL' : undefined,
        etiquette: !prisParRdv && perso ? (perso.summary ?? 'Événement personnel') : undefined,
      });
    }
  }

  // Les créneaux déjà passés n'ont pas d'intérêt.
  const maintenant = Date.now();
  return {
    creneaux: creneaux.filter((c) => new Date(c.debutIso).getTime() > maintenant),
    agendaGoogleConsulte,
  };
}
```

> **Note pour l'exécutant :** la fonction `jourSemaine` ci-dessus est redondante avec le
> calcul fait en ligne dans `calculerCreneaux`. **La supprimer** ; elle n'est là que pour
> signaler le piège. Le jour de la semaine se lit sur `new Date(\`${date}T12:00:00Z\`)` :
> midi UTC tombe le même jour civil à Toronto quelle que soit la saison.

- [ ] **Étape 2 : écrire le script de vérification**

Créer `scripts/test-creneaux.ts` :

```ts
/**
 * Verifie le calcul des creneaux sur les VRAIES disponibilites de Noctura.
 * Lecture seule : n'ecrit rien en base.
 *
 * Usage : npx tsx scripts/test-creneaux.ts
 */
import { PrismaClient } from '@prisma/client';
import { calculerCreneaux } from '../src/lib/creneaux';

const prisma = new PrismaClient();

/** Prochaine date (AAAA-MM-JJ) tombant sur ce jour de la semaine. */
function prochain(jour: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  while (d.getUTCDay() !== jour) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const noctura: any = await prisma.practitioner.findFirst({ where: { slug: 'noctura' } });
  if (!noctura) throw new Error('Noctura introuvable');
  const offering: any = await prisma.offering.findFirst({
    where: { practitionerId: noctura.id, isActive: true },
    orderBy: { durationMinutes: 'asc' },
  });
  if (!offering) throw new Error('Aucun soin actif');
  console.log(`Soin de test : ${offering.name} (${offering.durationMinutes} min)\n`);

  let succes = true;

  const mardi = await calculerCreneaux({ practitionerId: noctura.id, date: prochain(2), offeringId: offering.id });
  console.log(`Mardi ${prochain(2)} : ${mardi.creneaux.length} creneau(x), Google consulte : ${mardi.agendaGoogleConsulte}`);
  console.log('  ' + mardi.creneaux.map((c) => `${c.debut}${c.disponible ? '' : '(pris)'}`).join(' '));
  if (mardi.creneaux.length === 0) { console.log('  ECHEC : un mardi devrait offrir des creneaux'); succes = false; }

  const lundi = await calculerCreneaux({ practitionerId: noctura.id, date: prochain(1), offeringId: offering.id });
  console.log(`\nLundi ${prochain(1)} : ${lundi.creneaux.length} creneau(x)`);
  if (lundi.creneaux.length !== 0) { console.log('  ECHEC : Noctura ne travaille pas le lundi'); succes = false; }

  const premier = mardi.creneaux[0];
  if (premier) {
    const heureLocale = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(premier.debutIso));
    console.log(`\nCoherence du fuseau : etiquette « ${premier.debut} » vs instant reel « ${heureLocale} »`);
    if (heureLocale.replace('h', ':').trim() !== premier.debut) {
      console.log('  ECHEC : l heure affichee ne correspond pas a l instant enregistre');
      succes = false;
    }
  }

  console.log(succes ? '\nRESULTAT : SUCCES' : '\nRESULTAT : ECHEC');
  process.exitCode = succes ? 0 : 1;
}

main().catch((e) => { console.error('ERREUR :', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
```

- [ ] **Étape 3 : exécuter le script**

```bash
npx tsx scripts/test-creneaux.ts
```

Attendu :
- Un mardi : plusieurs créneaux, correspondant aux blocs 10:45–12:15, 13:15–14:45, 15:00–16:30
- Un lundi : **0 créneau** (Noctura ne travaille pas le lundi)
- L'heure affichée correspond à l'instant enregistré

**Si le lundi renvoie des créneaux**, le filtre de jour est faux : corriger avant de continuer.
**Si le fuseau ne correspond pas**, corriger `instantEst` : une heure fausse ferait se
présenter des clientes au mauvais moment.

- [ ] **Étape 4 : vérifier les types puis commiter**

```bash
npx tsc --noEmit
git add src/lib/creneaux.ts scripts/test-creneaux.ts
git commit -m "Agenda : calcul des creneaux libres cote serveur"
```

---

### Task 4 : L'API des créneaux

**Fichiers**
- Créer : `src/app/api/admin/agenda/creneaux/route.ts`

**Interfaces**
- Consomme : `calculerCreneaux` (Task 3), `requireAdmin` de `@/lib/admin-guard`.
- Produit : `GET /api/admin/agenda/creneaux?practitionerId=&date=&offeringId=` →
  `{ creneaux: Creneau[], agendaGoogleConsulte: boolean }`

- [ ] **Étape 1 : créer la route**

```ts
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { calculerCreneaux } from '@/lib/creneaux';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const params = new URL(req.url).searchParams;
  const practitionerId = params.get('practitionerId');
  const date = params.get('date');
  const offeringId = params.get('offeringId');

  if (!practitionerId || !date || !offeringId) {
    return NextResponse.json(
      { error: 'Paramètres requis : practitionerId, date, offeringId.' },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Date attendue au format AAAA-MM-JJ.' }, { status: 400 });
  }

  const resultat = await calculerCreneaux({ practitionerId, date, offeringId });
  return NextResponse.json(resultat);
}
```

- [ ] **Étape 2 : vérifier et commiter**

```bash
npx tsc --noEmit
git add src/app/api/admin/agenda/creneaux
git commit -m "Agenda : route des creneaux libres"
```

---

### Task 5 : Autoriser à forcer malgré l'agenda personnel

**Fichiers**
- Modifier : `src/app/api/holistique/appointments/manual/route.ts` (lignes 36 et 93-105)

**Interfaces**
- Produit : la route accepte désormais `forcerMalgreAgenda?: boolean` dans son corps JSON.

Aujourd'hui la route refuse (409) aussi bien sur un rendez-vous client que sur un événement
personnel Google. Le devis (§8) distingue les deux : le premier reste inconditionnel, le
second devient un avertissement que Noctura peut lever.

- [ ] **Étape 1 : lire le nouvel indicateur**

Ligne 36, ajouter `forcerMalgreAgenda` à la déstructuration :

```ts
const { practitionerId, client, offeringId, startsAt, mode, paymentMode, notes, forcerMalgreAgenda } = body ?? {};
```

- [ ] **Étape 2 : conditionner le refus Google**

Remplacer le bloc `try` des lignes 93-105 par :

```ts
    // Conflit avec l'agenda Google. Contrairement au conflit ci-dessus, celui-ci
    // n'est PAS bloquant si la praticienne a explicitement choisi de passer outre :
    // seule elle sait si l'événement personnel est déplaçable. Le refus renvoie
    // l'intitulé pour que l'interface puisse le lui montrer.
    try {
      const busy = await getBusyPeriods(practitionerId, start, end);
      const chevauche = busy.find((b) => new Date(b.start) < end && new Date(b.end) > start);
      if (chevauche && forcerMalgreAgenda !== true) {
        return NextResponse.json(
          {
            error: 'Ce créneau est occupé dans l\'agenda Google de la praticienne.',
            code: 'AGENDA_PERSONNEL',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            etiquette: (chevauche as any).summary ?? 'Événement personnel',
          },
          { status: 409 },
        );
      }
    } catch (err) {
      console.error('[rdv manuel] vérif Google free/busy échouée (non-bloquant)', err);
    }
```

**Ne pas toucher** au bloc de conflit `HolisticAppointment` juste au-dessus : il doit rester
inconditionnel.

- [ ] **Étape 3 : vérifier et commiter**

```bash
npx tsc --noEmit
git add src/app/api/holistique/appointments/manual/route.ts
git commit -m "RDV manuel : l'agenda personnel avertit au lieu de bloquer"
```

---

### Task 6 : La feuille de création en quatre temps

**Fichiers**
- Créer : `src/app/admin/calendrier/FeuilleRendezVous.tsx`

**Interfaces**
- Consomme : `GET /api/admin/agenda/creneaux` (Task 4), `GET /api/admin/clients/search?q=`
  (existante), `POST /api/holistique/appointments/manual` (Task 5).
- Produit : composant `FeuilleRendezVous` :

```tsx
interface Props {
  ouverte: boolean;
  onFermer: () => void;
  onCree: () => void;              // rafraîchir le calendrier
  practitionerId: string;          // Noctura par défaut
  practitionerNom: string;
  offerings: Array<{ id: string; name: string; durationMinutes: number; price: number }>;
  dateInitiale?: string;           // « 2026-08-11 » si on a tapé une case du calendrier
}
```

**Contrat exact de la route de création** (à respecter à la lettre) :

```ts
POST /api/holistique/appointments/manual
{
  practitionerId: string,
  client: { firstName: string, lastName: string, phone: string, email?: string },
  offeringId: string,
  startsAt: string,                       // ISO, celui du créneau choisi
  mode: 'IN_PERSON' | 'VIRTUAL',
  paymentMode: 'CASH' | 'STRIPE_LINK' | 'INTERAC',
  notes?: string,
  forcerMalgreAgenda?: boolean
}
```

⚠️ **Contrainte imposée par la route** : le courriel est **obligatoire** si `paymentMode`
vaut `STRIPE_LINK` ou `INTERAC`. Il n'est facultatif que pour `CASH`. L'interface doit donc
exiger le courriel dès que la praticienne quitte le paiement comptant, et le dire clairement
plutôt que de laisser la route refuser.

- [ ] **Étape 1 : la coquille de la feuille**

`'use client'`. Une `<div>` en position fixe, ancrée en bas, qui monte : `translate-y-full`
quand fermée, `translate-y-0` quand ouverte, `max-h-[92vh]`, `overflow-y-auto`,
`rounded-t-2xl`, fond blanc. Un voile derrière, fermeture en tapant à côté.

Un état `etape` de 1 à 4 et une barre de progression à quatre points en haut. Un bouton
retour qui décrémente l'étape (et ferme la feuille à l'étape 1).

Styles inline, palette de l'admin (violet `#6B3FA0`, titres `#2D1B4E`, bordures `#E5E7EB`).

- [ ] **Étape 2 : étape 1 — la cliente**

- Un champ de recherche, appel à `/api/admin/clients/search?q=` **débouncé à 300 ms** (le
  motif existe dans `ManualAppointmentButton.tsx:75-92`, s'en inspirer).
- Sous le champ, **les dernières clientes** de la praticienne, en boutons de 44 px minimum.
  Les charger au montage depuis les rendez-vous récents.
- Un bouton « Nouvelle cliente » qui déplie prénom, nom, téléphone, et un courriel marqué
  « optionnel si paiement comptant ».
- Sélectionner une cliente passe directement à l'étape 2.

- [ ] **Étape 3 : étape 2 — le soin**

Les `offerings` reçus en propriété, **triés par fréquence d'usage** (fournie par le parent,
Task 7), en boutons pleine largeur affichant nom, durée et prix. Les cinq premiers visibles,
le reste derrière « Tous les soins ». Sélectionner passe à l'étape 3.

- [ ] **Étape 4 : étape 3 — le moment**

- Une rangée horizontale de 14 jours tapables (jour de la semaine + numéro), défilement
  horizontal, aujourd'hui présélectionné (ou `dateInitiale`).
- Au changement de jour : appel à `/api/admin/agenda/creneaux`.
- Les créneaux en grille de boutons. Un créneau `disponible: false` est grisé et non tapable.
  Un créneau portant `motif: 'AGENDA_PERSONNEL'` reste tapable mais affiche une pastille
  d'avertissement et son `etiquette`.
- Si `agendaGoogleConsulte` est faux, afficher un bandeau :
  *« Impossible de vérifier ton agenda Google en ce moment. »*
- Si aucun créneau : *« Aucune disponibilité ce jour-là. »* plus le lien « autre heure ».
- Un lien discret **« Autre heure »** ouvrant un `datetime-local`, pour les exceptions.

- [ ] **Étape 5 : étape 4 — confirmer**

Récapitulatif (cliente, soin, jour et heure en toutes lettres, durée, prix), puis :
- Mode : deux boutons **Présentiel** / **En ligne** (présentiel par défaut).
- Paiement : trois boutons **Comptant** / **Interac** / **Lien Stripe** (comptant par défaut).
  Choisir Interac ou Stripe sans courriel renseigné affiche : *« Un courriel est nécessaire
  pour ce mode de paiement. »* et ramène à l'étape 1.
- Notes, repliées.
- Un bouton **Créer le rendez-vous**, désactivé pendant l'envoi (pas de double soumission).

Gestion des réponses :

```tsx
const res = await fetch('/api/holistique/appointments/manual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(charge),
});
const data = await res.json();
if (!res.ok) {
  if (res.status === 409 && data.code === 'AGENDA_PERSONNEL') {
    // Avertissement, pas un refus : on propose de forcer.
    setAvertissementAgenda(data.etiquette ?? 'Événement personnel');
    return;
  }
  setErreur(data.error ?? 'Une erreur est survenue.');
  if (res.status === 409) setEtape(3); // créneau pris entre-temps : on garde cliente et soin
  return;
}
onCree();
onFermer();
```

L'avertissement s'affiche en encart avec deux boutons : **Choisir une autre heure** (retour
à l'étape 3) et **Réserver quand même** (renvoi avec `forcerMalgreAgenda: true`).

- [ ] **Étape 6 : vérifier et commiter**

```bash
npx tsc --noEmit
git add src/app/admin/calendrier/FeuilleRendezVous.tsx
git commit -m "Agenda : feuille de creation de rendez-vous en quatre temps"
```

---

### Task 7 : L'agenda mobile

**Fichiers**
- Modifier : `package.json` (dépendance `@fullcalendar/list`)
- Modifier : `src/app/admin/calendrier/CalendrierClient.tsx`
- Modifier : `src/app/admin/calendrier/page.tsx` (fournir les soins triés par fréquence)

**Interfaces**
- Consomme : `FeuilleRendezVous` (Task 6).

- [ ] **Étape 1 : installer le plugin liste**

```bash
npm install @fullcalendar/list@^6.1.20
```

La version doit correspondre aux autres paquets FullCalendar déjà présents (`^6.1.20`).

- [ ] **Étape 2 : détecter le petit écran**

Dans `CalendrierClient.tsx` :

```tsx
const [surTelephone, setSurTelephone] = useState(false);
useEffect(() => {
  const mq = window.matchMedia('(max-width: 1023px)');
  const appliquer = () => setSurTelephone(mq.matches);
  appliquer();
  mq.addEventListener('change', appliquer);
  return () => mq.removeEventListener('change', appliquer);
}, []);
```

- [ ] **Étape 3 : adapter la vue**

```tsx
plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
initialView={surTelephone ? 'listDay' : 'timeGridWeek'}
headerToolbar={
  surTelephone
    ? { left: 'prev,next', center: 'title', right: 'listDay,timeGridWeek,dayGridMonth' }
    : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
}
buttonText={{ today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Jour' }}
```

Importer `listPlugin from '@fullcalendar/list'`. **Ne pas** supprimer les vues existantes :
sur ordinateur, le comportement doit rester identique.

- [ ] **Étape 4 : le bouton flottant**

Visible sous 1024 px uniquement, hors du flux de défilement :

```tsx
<button
  type="button"
  onClick={() => setFeuilleOuverte(true)}
  aria-label="Ajouter un rendez-vous"
  className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-3xl"
  style={{ background: '#6B3FA0' }}
>
  +
</button>
```

Conserver le `ManualAppointmentButton` existant pour l'ordinateur : ne rien retirer.

- [ ] **Étape 5 : brancher la feuille**

Monter `<FeuilleRendezVous …/>` avec `ouverte={feuilleOuverte}`, `onFermer`, et `onCree`
appelant le rafraîchissement déjà en place. Un `dateClick` sur le calendrier ouvre la feuille
avec `dateInitiale` prérempli.

- [ ] **Étape 6 : les soins triés par fréquence**

Dans `src/app/admin/calendrier/page.tsx` (page serveur), charger les soins actifs de la
praticienne et les trier par nombre de rendez-vous passés :

```tsx
const soins = await prisma.offering.findMany({
  where: { practitionerId: noctura.id, isActive: true },
  select: { id: true, name: true, durationMinutes: true, price: true,
            _count: { select: { appointments: true } } },
});
soins.sort((a, b) => b._count.appointments - a._count.appointments);
```

Si la relation ne s'appelle pas `appointments` sur `Offering`, lire le modèle dans
`prisma/schema.prisma` et employer le nom réel. En cas d'absence de relation, trier par
`name` et le signaler dans le rapport.

- [ ] **Étape 7 : vérifier et commiter**

```bash
npx tsc --noEmit
git add package.json package-lock.json src/app/admin/calendrier
git commit -m "Agenda : vue liste et bouton flottant sur telephone"
```

---

### Task 8 : Déploiement et vérification réelle

- [ ] **Étape 1 : vérifier `vercel.json` avant tout**

```bash
cat vercel.json
```

Les cinq planifications doivent être **quotidiennes**. Une fréquence sub-quotidienne fait
échouer l'intégralité du build — c'est ce qui a bloqué ce projet pendant 20 jours.

- [ ] **Étape 2 : déployer**

```bash
git -c credential.helper="" -c credential.helper="!gh auth git-credential" push origin main
vercel --prod --yes
```

- [ ] **Étape 3 : vérifier le manifeste**

```bash
curl -s https://www.runesetmagie.ca/manifest.webmanifest
```

Attendu : le JSON de la Task 2, avec `"display":"standalone"`.

- [ ] **Étape 4 : parcours sur téléphone réel**

À exécuter sur un vrai téléphone, **pas un simulateur**, et à rapporter honnêtement, échecs
compris :

1. `/admin` s'ouvre, le menu est **rétracté**, le contenu occupe toute la largeur
2. Le bouton hamburger ouvre le panneau ; taper à côté le referme
3. Naviguer vers une page ferme le panneau automatiquement
4. `/admin/calendrier` s'ouvre sur la **liste du jour**, lisible
5. Le bouton **+** est atteignable au pouce sans remonter
6. Créer un rendez-vous de test : cliente connue, soin habituel — **compter les taps**
7. Le créneau choisi correspond à l'heure affichée
8. Vérifier le rendez-vous dans le Google Agenda de Noctura
9. Tenter un créneau chevauchant un rendez-vous existant → **doit refuser**
10. *Partager → Sur l'écran d'accueil* : l'icône apparaît, l'application s'ouvre sans barre
    d'adresse
11. **Supprimer le rendez-vous de test**

- [ ] **Étape 5 : validation par Noctura**

Lui faire créer un vrai rendez-vous sur son propre téléphone. Recueillir : le bouton
tombe-t-il sous son pouce, les mots lui parlent-ils, combien de taps. **Son avis prime.**

---

## Ordre d'exécution

Les tâches **1 et 2** sont indépendantes et livrables seules : elles améliorent déjà tout
l'admin. Les tâches **3 à 7** s'enchaînent. La tâche **8** clôt.

Si le temps manque, s'arrêter après la **Task 2** laisse un admin utilisable au téléphone —
ce qui est déjà l'essentiel du problème.

## Auto-revue

**Couverture du devis** — §5 coquille → T1 ; §4bis manifeste → T2 ; §7 créneaux → T3/T4 ;
§8 conflits → T5 (serveur) et T6 étape 5 (interface) ; §6.2 création → T6 ; §6.1 agenda → T7 ;
§10 pannes → T3 (Google injoignable), T6 étape 5 (réseau, créneau pris) ; §11 vérification →
T3 étape 3 et T8. §9 anomalies : hors périmètre par décision, aucune tâche — c'est voulu.

**Cohérence des noms** — `calculerCreneaux`, `Creneau`, `ResultatCreneaux`,
`agendaGoogleConsulte`, `debutIso`, `motif`, `etiquette` (T3) sont employés sous ces noms
exacts en T4, T6 et T7. `forcerMalgreAgenda` (T5) est envoyé sous ce nom en T6. Le code
`AGENDA_PERSONNEL` est produit en T5 et consommé en T6.

**Écart assumé** — cette compétence impose le TDD, mais le projet n'a aucune infrastructure
de tests. Les étapes de test sont remplacées par `npx tsc --noEmit`, le script de concurrence
de la Task 3 sur les vraies données, et le parcours manuel de la Task 8. Compromis délibéré,
déjà retenu pour le module Événements.

**Piège signalé et neutralisé** — le fuseau horaire. `instantEst` (T3) calcule le décalage
de Toronto par convergence via `Intl.DateTimeFormat`, sans jamais coder `-4` ou `-5` en dur,
et sans passer de chaîne sans fuseau à `new Date()`. Le script de la Task 3 vérifie la
correspondance entre l'heure affichée et l'instant enregistré. C'est le défaut qui coûterait
le plus cher : des clientes qui se présentent à la mauvaise heure.
