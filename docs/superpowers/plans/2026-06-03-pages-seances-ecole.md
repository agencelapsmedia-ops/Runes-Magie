# Pages Séances & École — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réorganiser les offres de Noctura en catégories et ajouter deux pages au menu — Séances (soins + tirages) et École (cours uniques + formations, une formation menant à la liste de ses cours).

**Architecture:** On étend la donnée statique `src/data/services.ts` avec un champ `category` (+ `type`/`includedCourses` pour l'École) et des helpers. On crée des pages App Router `/seances` et `/ecole` (liste + `[slug]` détail) qui réutilisent deux composants partagés (`ServiceCard`, `ServiceDetailView`) plus une vue `FormationDetailView`. On met à jour les menus Navbar et Footer.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, TypeScript, Tailwind v4. Données statiques (pas de base). Aucun framework de test dans le projet.

**Vérification (pas de TDD unitaire — aucun runner de test installé) :**
- **Garde de types (principale) :** `npx tsc --noEmit` — rapide, sans env ni DB, type-check tout le projet.
- **Garde fonctionnelle :** vérification visuelle sur le serveur dev (port 3000 déjà actif, HMR).
- **Optionnel :** `npm run build` (= `prisma generate && next build`) génère en plus statiquement `/seances`, `/ecole` et leurs `[slug]` via `generateStaticParams` — à lancer **si l'environnement local le permet** (d'autres pages du site interrogent la DB au build et pourraient bloquer).
- **Style :** `npm run lint`.

**⚠️ Next.js modifié (voir `AGENTS.md`) :** ne pas se fier à la mémoire. **Calquer exactement** les conventions déjà utilisées dans `src/app/services/[slug]/page.tsx` (signature `params: Promise<{ slug: string }>`, `generateStaticParams`, `generateMetadata`). En cas de doute sur une API, consulter `node_modules/next/dist/docs/`.

---

## Structure des fichiers

**Modifiés :**
- `src/data/services.ts` — interface étendue, catégories sur les 6 services, contenu École scaffold, helpers.
- `src/components/layout/Navbar.tsx` — `NAV_LINKS`.
- `src/components/layout/Footer.tsx` — `NAV_LINKS`.

**Créés :**
- `src/components/services/ServiceCard.tsx` — carte réutilisable (badge « Formation · N cours »).
- `src/components/services/ServiceDetailView.tsx` — vue détail partagée (séance ou cours unique).
- `src/components/services/FormationDetailView.tsx` — vue programme (formation + ses cours).
- `src/app/seances/page.tsx` — liste des séances.
- `src/app/seances/[slug]/page.tsx` — détail d'une séance.
- `src/app/ecole/page.tsx` — liste cours + formations.
- `src/app/ecole/[slug]/page.tsx` — détail cours **ou** formation.

**Laissés intacts :** `src/app/services/**` (orphelin, accessible par URL directe), toute la sous-app `src/app/(holistique)/soins/**`.

---

## Task 1 : Modèle de données + helpers (`services.ts`)

**Files:**
- Modify: `src/data/services.ts` (interface en haut + fin de fichier)

- [ ] **Step 1 : Étendre l'interface `Service` et ajouter les types de catégorie**

Remplacer le bloc `export interface Service { ... }` (lignes 1-12) par :

```ts
export type ServiceCategory = 'seances' | 'ecole' | 'animations' | 'ceremonies';
export type EcoleType = 'cours' | 'formation';

export interface Service {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  duration: string;
  description: string;
  longDescription: string;
  image: string;
  icon: string;
  features: string[];
  category: ServiceCategory;
  type?: EcoleType; // École uniquement
  includedCourses?: string[]; // Formation uniquement : slugs des cours regroupés
}
```

- [ ] **Step 2 : Catégoriser les services conservés**

Ajouter le champ `category` à la fin de chaque objet conservé (juste après la propriété `features: [...]`) :
- `service-001` (Le Soin Rituel) → `category: 'seances',`
- `service-002` (Tirage … Combinés) → `category: 'seances',`
- `service-003` (Tirage Simple) → `category: 'seances',`
- `service-005` (Soirée d'Animation) → `category: 'animations',`
- `service-006` (Cérémonies de Noctura) → `category: 'ceremonies',`

- [ ] **Step 3 : Ajouter les helpers en fin de fichier**

Après la fermeture du tableau `services` (`];`), ajouter :

```ts
export function getServicesByCategory(category: ServiceCategory): Service[] {
  return services.filter((s) => s.category === category);
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getCoursesForFormation(formation: Service): Service[] {
  if (!formation.includedCourses) return [];
  return formation.includedCourses
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is Service => Boolean(s));
}
```

- [ ] **Step 4 : Vérifier la compilation des types**

Run: `npm run lint`
Expected: aucune erreur TypeScript sur `services.ts` (le service-004 sera remplacé à la Task 2 ; si `npm run build` est lancé entre les deux, il signalera que `category` manque sur #4 — c'est attendu, corrigé Task 2).

- [ ] **Step 5 : Commit**

```bash
git add src/data/services.ts
git commit -m "Ajoute le champ catégorie et les helpers aux services"
```

---

## Task 2 : Contenu École de démarrage (remplace le service #4)

**Files:**
- Modify: `src/data/services.ts` (l'objet `service-004`)

- [ ] **Step 1 : Remplacer l'objet `service-004` par les fiches École scaffold**

Supprimer l'objet `service-004` (« Formations & Cours Privés », ~lignes 79-101) et insérer à sa place les 5 objets suivants (4 cours + 1 formation). Contenu de départ, **à ajuster par la cliente** :

```ts
  // ─── ÉCOLE : COURS UNIQUES ───
  {
    id: 'service-004',
    slug: 'cours-prive',
    name: 'Cours Privé',
    price: 89.99,
    duration: '60 minutes',
    description:
      "Session individuelle de formation, sur place ou en virtuel, adaptée à vos besoins et à votre rythme.",
    longDescription:
      "Le Cours Privé est une session individuelle entièrement personnalisée. Sur place ou en virtuel, Noctura adapte le contenu à vos besoins et à votre rythme. Idéal pour approfondir un sujet précis de l'univers énergétique et spirituel, à votre convenance.",
    image: '/images/services/cours-formations.svg',
    icon: 'ᚱ',
    features: [
      'Session individuelle personnalisée',
      'Sur place ou en virtuel',
      'Contenu adapté à vos besoins',
      'Théorie et pratique',
    ],
    category: 'ecole',
    type: 'cours',
  },
  {
    id: 'service-007',
    slug: 'cours-initiation-runes',
    name: 'Initiation aux Runes & Futhark',
    price: 89.99,
    duration: '60 minutes',
    description:
      "Découverte des Runes Futhark, l'alphabet sacré nordique vieux de plus de 3 millénaires.",
    longDescription:
      "Ce cours d'initiation vous fait découvrir les 25 Runes du Futhark ancien, leur histoire viking et leur usage divinatoire. Vous apprendrez à reconnaître chaque symbole, sa signification, et les bases du tirage de runes.",
    image: '/images/services/cours-formations.svg',
    icon: 'ᚠ',
    features: [
      'Histoire et origine des Runes Futhark',
      'Signification des 25 symboles',
      'Bases du tirage de runes',
      'Théorie et pratique',
    ],
    category: 'ecole',
    type: 'cours',
  },
  {
    id: 'service-008',
    slug: 'cours-lecture-tarot',
    name: 'Lecture du Tarot',
    price: 89.99,
    duration: '60 minutes',
    description:
      "Apprenez les fondements de la lecture du Tarot et la signification des arcanes.",
    longDescription:
      "Ce cours vous enseigne les fondements de la lecture du Tarot : la structure du jeu, la signification des arcanes majeurs et mineurs, et les méthodes de tirage. Une porte d'entrée concrète vers la pratique divinatoire.",
    image: '/images/services/cours-formations.svg',
    icon: 'ᛈ',
    features: [
      'Structure du jeu de Tarot',
      'Arcanes majeurs et mineurs',
      'Méthodes de tirage',
      'Théorie et pratique',
    ],
    category: 'ecole',
    type: 'cours',
  },
  {
    id: 'service-009',
    slug: 'cours-magie-cristaux',
    name: 'Magie des Cristaux & Lithothérapie',
    price: 89.99,
    duration: '60 minutes',
    description:
      "Découvrez les propriétés énergétiques des pierres et cristaux et leur usage en soin.",
    longDescription:
      "Ce cours explore la magie des cristaux et la lithothérapie : reconnaître les pierres, comprendre leurs propriétés énergétiques, les purifier, les recharger et les utiliser dans vos rituels et vos soins.",
    image: '/images/services/cours-formations.svg',
    icon: 'ᛊ',
    features: [
      'Reconnaître les pierres et cristaux',
      'Propriétés énergétiques',
      'Purification et recharge',
      'Usage en rituel et en soin',
    ],
    category: 'ecole',
    type: 'cours',
  },
  // ─── ÉCOLE : FORMATION (programme de plusieurs cours) ───
  {
    id: 'service-010',
    slug: 'formation-de-base',
    name: 'Formation de Base',
    price: 'À partir de 269.99$',
    duration: 'Plusieurs séances',
    description:
      "Programme complet regroupant plusieurs cours pour bâtir des fondations solides dans l'univers énergétique et spirituel.",
    longDescription:
      "La Formation de Base est un programme structuré qui regroupe plusieurs cours en continu. Elle vous accompagne pas à pas pour bâtir des fondations solides : initiation aux runes, lecture du Tarot et magie des cristaux. Un parcours progressif alliant théorie et pratique.",
    image: '/images/services/cours-formations.svg',
    icon: 'ᛟ',
    features: [
      'Programme structuré de plusieurs cours',
      'Parcours progressif théorie + pratique',
      'Initiation aux Runes & Futhark',
      'Lecture du Tarot',
      'Magie des Cristaux & Lithothérapie',
    ],
    category: 'ecole',
    type: 'formation',
    includedCourses: [
      'cours-initiation-runes',
      'cours-lecture-tarot',
      'cours-magie-cristaux',
    ],
  },
```

- [ ] **Step 2 : Vérifier les types**

Run: `npx tsc --noEmit`
Expected: PASS. Tous les services ont `category` ; aucun type manquant. *(Optionnel si l'env local le permet : `npm run build`.)*

- [ ] **Step 3 : Commit**

```bash
git add src/data/services.ts
git commit -m "Remplace la fiche #4 par le contenu École de démarrage (cours + formation)"
```

---

## Task 3 : Composant `ServiceCard`

**Files:**
- Create: `src/components/services/ServiceCard.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import type { Service } from '@/data/services';

interface ServiceCardProps {
  service: Service;
  hrefBase: string; // ex. '/seances' ou '/ecole'
  courseCount?: number; // pour les formations
}

export default function ServiceCard({ service, hrefBase, courseCount }: ServiceCardProps) {
  const isFormation = service.type === 'formation';

  return (
    <article className="group bg-charbon-mystere border border-violet-royal/40 rounded-lg p-8 transition-all duration-500 hover:border-violet-mystique/70 hover:shadow-[0_0_30px_rgba(107,63,160,0.15)]">
      <div className="flex items-start justify-between mb-6">
        <div className="text-5xl text-or-ancien opacity-80 group-hover:opacity-100 transition-opacity duration-300 select-none">
          {service.icon}
        </div>
        {isFormation && (
          <span className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 text-turquoise-cristal whitespace-nowrap">
            Formation{typeof courseCount === 'number' ? ` · ${courseCount} cours` : ''}
          </span>
        )}
      </div>

      <h2 className="font-cinzel text-2xl text-parchemin mb-3 group-hover:text-or-ancien transition-colors duration-300">
        {service.name}
      </h2>

      <p className="text-parchemin-vieilli/80 leading-relaxed mb-6 font-cormorant text-lg">
        {service.description}
      </p>

      <div className="flex items-center gap-4 mb-6">
        <span className="font-cinzel text-xl text-or-ancien font-semibold">
          {typeof service.price === 'number' ? formatPrice(service.price) : service.price}
        </span>
        <span className="text-parchemin-vieilli/50">|</span>
        <span className="text-parchemin-vieilli/70 text-sm">{service.duration}</span>
      </div>

      <Button href={`${hrefBase}/${service.slug}`} variant="primary" size="md">
        Découvrir
      </Button>
    </article>
  );
}
```

- [ ] **Step 2 : Vérifier le lint**

Run: `npm run lint`
Expected: aucune erreur (le composant est encore inutilisé — normal).

- [ ] **Step 3 : Commit**

```bash
git add src/components/services/ServiceCard.tsx
git commit -m "Ajoute le composant ServiceCard réutilisable"
```

---

## Task 4 : Composant `ServiceDetailView`

**Files:**
- Create: `src/components/services/ServiceDetailView.tsx`

Vue détail partagée par les séances et les cours uniques. Calquée sur `src/app/services/[slug]/page.tsx` (hero + description longue + features + CTA), sans la section « services reliés ».

- [ ] **Step 1 : Créer le composant**

```tsx
import { formatPrice } from '@/lib/utils';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import type { Service } from '@/data/services';

export default function ServiceDetailView({ service }: { service: Service }) {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative py-20 md:py-32 px-4"
        style={{
          background:
            'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 50%, var(--teal-profond) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-noir-nuit/40" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="text-7xl md:text-8xl text-or-ancien mb-8 animate-glow-pulse select-none">
            {service.icon}
          </div>
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold text-gradient-gold mb-6">
            {service.name}
          </h1>
          <div className="flex items-center justify-center gap-6 text-lg">
            <span className="font-cinzel text-2xl text-or-ancien font-semibold">
              {typeof service.price === 'number' ? formatPrice(service.price) : service.price}
            </span>
            <span className="text-parchemin-vieilli/40">&#9670;</span>
            <span className="text-parchemin-vieilli/80 font-philosopher">{service.duration}</span>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-parchemin-vieilli/90 text-lg md:text-xl leading-relaxed font-cormorant">
              {service.longDescription}
            </p>
          </div>

          <RuneDivider />

          <div className="my-16">
            <h2 className="font-cinzel text-2xl text-or-ancien mb-8 text-center">
              Ce que comprend ce service
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 bg-charbon-mystere/50 border border-violet-royal/20 rounded-lg p-4"
                >
                  <span className="text-or-ancien text-lg mt-0.5 shrink-0 select-none">&#5765;</span>
                  <span className="text-parchemin-vieilli/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <RuneDivider symbols="&#10022; &#10022; &#10022;" />

          <div className="my-16 text-center">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">
              Prêt à commencer votre voyage&nbsp;?
            </h2>
            <p className="text-parchemin-vieilli/70 mb-8 font-philosopher text-lg">
              Réservez votre séance et laissez la magie opérer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button href="/reserver" variant="cta" size="lg">
                Réserver
              </Button>
              <a
                href="tel:+15143487705"
                className="inline-flex items-center gap-3 text-or-ancien hover:text-or-clair transition-colors font-cinzel text-sm tracking-wider"
              >
                <span className="text-lg">&#9742;</span>
                (514) 348-7705
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2 : Lint + commit**

```bash
npm run lint
git add src/components/services/ServiceDetailView.tsx
git commit -m "Ajoute la vue détail partagée ServiceDetailView"
```

---

## Task 5 : Pages Séances (`/seances` + `/seances/[slug]`)

**Files:**
- Create: `src/app/seances/page.tsx`
- Create: `src/app/seances/[slug]/page.tsx`

- [ ] **Step 1 : Créer la page liste `/seances`**

```tsx
import type { Metadata } from 'next';
import { getServicesByCategory } from '@/data/services';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ServiceCard from '@/components/services/ServiceCard';

export const metadata: Metadata = {
  title: 'Séances | Runes & Magie',
  description:
    'Soins énergétiques et tirages divinatoires avec Noctura : Soin Rituel, tirages de Runes Futhark et de cartes.',
};

export default function SeancesPage() {
  const seances = getServicesByCategory('seances');

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="Séances" subtitle="Soins énergétiques & tirages" as="h1" />
        <RuneDivider className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {seances.map((service) => (
            <ServiceCard key={service.id} service={service} hrefBase="/seances" />
          ))}
        </div>
        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Créer la page détail `/seances/[slug]`**

Mêmes conventions exactes que `src/app/services/[slug]/page.tsx` (params async, generateStaticParams, generateMetadata).

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServicesByCategory, getServiceBySlug } from '@/data/services';
import ServiceDetailView from '@/components/services/ServiceDetailView';

export function generateStaticParams() {
  return getServicesByCategory('seances').map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: 'Séance introuvable | Runes & Magie' };
  return { title: `${service.name} | Runes & Magie`, description: service.description };
}

export default async function SeanceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service || service.category !== 'seances') notFound();
  return <ServiceDetailView service={service} />;
}
```

- [ ] **Step 3 : Vérifier les types (+ build si possible)**

Run: `npx tsc --noEmit`
Expected: PASS. Si l'env local permet le build : `npm run build` doit générer `/seances` et `/seances/[slug]` (3 séances). Sinon, vérifier les 3 routes sur le serveur dev.

- [ ] **Step 4 : Commit**

```bash
git add src/app/seances
git commit -m "Ajoute la page Séances (liste + détail)"
```

---

## Task 6 : Composant `FormationDetailView`

**Files:**
- Create: `src/components/services/FormationDetailView.tsx`

Vue programme : en-tête formation + description longue + grille des cours inclus (chaque cours pointe vers `/ecole/[courseSlug]`) + CTA.

- [ ] **Step 1 : Créer le composant**

```tsx
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import type { Service } from '@/data/services';

interface FormationDetailViewProps {
  formation: Service;
  courses: Service[];
}

export default function FormationDetailView({ formation, courses }: FormationDetailViewProps) {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative py-20 md:py-32 px-4"
        style={{
          background:
            'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 50%, var(--teal-profond) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-noir-nuit/40" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 text-turquoise-cristal">
            Formation · {courses.length} cours
          </span>
          <div className="text-7xl md:text-8xl text-or-ancien mt-8 mb-6 animate-glow-pulse select-none">
            {formation.icon}
          </div>
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold text-gradient-gold mb-6">
            {formation.name}
          </h1>
          <div className="flex items-center justify-center gap-6 text-lg">
            <span className="font-cinzel text-2xl text-or-ancien font-semibold">
              {typeof formation.price === 'number' ? formatPrice(formation.price) : formation.price}
            </span>
            <span className="text-parchemin-vieilli/40">&#9670;</span>
            <span className="text-parchemin-vieilli/80 font-philosopher">{formation.duration}</span>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-parchemin-vieilli/90 text-lg md:text-xl leading-relaxed font-cormorant">
              {formation.longDescription}
            </p>
          </div>

          <RuneDivider />

          {/* Les cours de la formation */}
          <div className="my-16">
            <h2 className="font-cinzel text-2xl text-or-ancien mb-8 text-center">
              Les cours de cette formation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/ecole/${course.slug}`}
                  className="group bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6 transition-all duration-300 hover:border-violet-mystique/60 hover:shadow-[0_0_20px_rgba(107,63,160,0.12)]"
                >
                  <div className="text-3xl text-or-ancien/70 mb-4 group-hover:text-or-ancien transition-colors select-none">
                    {course.icon}
                  </div>
                  <h3 className="font-cinzel text-lg text-parchemin mb-2 group-hover:text-or-ancien transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-parchemin-vieilli/60 text-sm line-clamp-2">
                    {course.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <RuneDivider symbols="&#10022; &#10022; &#10022;" />

          <div className="my-16 text-center">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">Prête à apprendre&nbsp;?</h2>
            <p className="text-parchemin-vieilli/70 mb-8 font-philosopher text-lg">
              Inscrivez-vous à la formation et commencez votre apprentissage.
            </p>
            <Button href="/reserver" variant="cta" size="lg">
              Réserver cette formation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2 : Lint + commit**

```bash
npm run lint
git add src/components/services/FormationDetailView.tsx
git commit -m "Ajoute la vue programme FormationDetailView"
```

---

## Task 7 : Pages École (`/ecole` + `/ecole/[slug]`)

**Files:**
- Create: `src/app/ecole/page.tsx`
- Create: `src/app/ecole/[slug]/page.tsx`

- [ ] **Step 1 : Créer la page liste `/ecole`** (cours uniques + formations ensemble)

```tsx
import type { Metadata } from 'next';
import { getServicesByCategory, getCoursesForFormation } from '@/data/services';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ServiceCard from '@/components/services/ServiceCard';

export const metadata: Metadata = {
  title: 'École | Runes & Magie',
  description:
    'Cours uniques et formations de Runes & Magie : initiation aux runes, lecture du Tarot, magie des cristaux et programmes complets.',
};

export default function EcolePage() {
  const items = getServicesByCategory('ecole');

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="École" subtitle="Cours uniques & formations" as="h1" />
        <RuneDivider className="my-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              hrefBase="/ecole"
              courseCount={
                service.type === 'formation' ? getCoursesForFormation(service).length : undefined
              }
            />
          ))}
        </div>
        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Créer la page détail `/ecole/[slug]`** (cours **ou** formation)

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getServicesByCategory,
  getServiceBySlug,
  getCoursesForFormation,
} from '@/data/services';
import ServiceDetailView from '@/components/services/ServiceDetailView';
import FormationDetailView from '@/components/services/FormationDetailView';

export function generateStaticParams() {
  return getServicesByCategory('ecole').map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: 'Page introuvable | Runes & Magie' };
  return { title: `${service.name} | Runes & Magie`, description: service.description };
}

export default async function EcoleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service || service.category !== 'ecole') notFound();

  if (service.type === 'formation') {
    return <FormationDetailView formation={service} courses={getCoursesForFormation(service)} />;
  }
  return <ServiceDetailView service={service} />;
}
```

- [ ] **Step 3 : Vérifier les types (+ build si possible)**

Run: `npx tsc --noEmit`
Expected: PASS. Si possible : `npm run build` génère `/ecole` et `/ecole/[slug]` (4 cours + 1 formation = 5 slugs). Sinon, vérifier sur le serveur dev.

- [ ] **Step 4 : Commit**

```bash
git add src/app/ecole
git commit -m "Ajoute la page École (cours + formations, détail formation avec ses cours)"
```

---

## Task 8 : Menu principal (Navbar)

**Files:**
- Modify: `src/components/layout/Navbar.tsx` (`NAV_LINKS`, ~lignes 22-29)

- [ ] **Step 1 : Remplacer `NAV_LINKS`**

```tsx
const NAV_LINKS: NavLink[] = [
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "Met à jour le menu principal : Séances, École en tête, retire Runes Vikings"
```

---

## Task 9 : Pied de page (Footer)

**Files:**
- Modify: `src/components/layout/Footer.tsx` (`NAV_LINKS`, lignes 4-11)

- [ ] **Step 1 : Remplacer `NAV_LINKS`** (ajoute Séances/École, retire Runes Vikings, garde Accueil)

```tsx
const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Séances', href: '/seances' },
  { label: 'École', href: '/ecole' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Infolettre', href: '/infolettre' },
  { label: 'Contact', href: '/contact' },
];
```

> Note : `SERVICE_LINKS` (colonne « Services » du footer, pointant vers `/soins`) est laissé **inchangé** dans ce lot (hors scope — non discuté).

- [ ] **Step 2 : Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "Aligne le pied de page : ajoute Séances et École, retire Runes Vikings"
```

---

## Task 10 : Vérification finale & revue visuelle

**Files:** aucun (validation)

- [ ] **Step 1 : Type-check complet**

Run: `npx tsc --noEmit`
Expected: PASS, sans erreur de type. Puis, **si l'env local le permet**, `npm run build` (routes générées : `/seances` + `/seances/[slug]` ×3, `/ecole` + `/ecole/[slug]` ×5).

- [ ] **Step 2 : Lint**

Run: `npm run lint`
Expected: aucune erreur.

- [ ] **Step 3 : Revue visuelle sur le serveur dev (port 3000 déjà actif, HMR)**

Vérifier :
- Menu du haut : `Séances · École · Boutique · À Propos · Contact` (plus de Accueil, Services & Soins, Runes Vikings).
- `/seances` : 3 cartes (Soin Rituel, 2 tirages) ; une carte → `/seances/[slug]` affiche le détail.
- `/ecole` : 4 cours + la « Formation de Base » (badge « Formation · 3 cours »).
- Clic « Formation de Base » → `/ecole/formation-de-base` liste ses 3 cours ; clic sur un cours → `/ecole/[slug]` détail.
- Pied de page : `Accueil · Séances · École · Boutique · À Propos · Infolettre · Contact`.

- [ ] **Step 4 : Commit éventuel des derniers ajustements** (s'il y en a)

```bash
git add -A
git commit -m "Ajustements finaux pages Séances & École"
```

- [ ] **Step 5 : Push** (selon la règle projet — déclenche le déploiement Vercel)

> ⚠️ Le push sur `main` a été bloqué automatiquement lors d'un changement précédent (déploiement production). **Demander l'autorisation explicite de la cliente** avant `git push origin main`, ou la laisser pousser elle-même.

```bash
git push origin main
```

---

## Auto-revue (couverture du spec)

- ✅ Champ catégorie + type + includedCourses → Task 1.
- ✅ Classement des 6 services + scaffold École → Tasks 1-2.
- ✅ Page Séances (soins + tirages) → Task 5.
- ✅ Page École (cours + formations ensemble) → Task 7 (liste).
- ✅ Formation cliquable → page avec ses cours → Tasks 6-7.
- ✅ Menu du haut (Séances, École ; retrait Runes Vikings/Services&Soins) → Task 8.
- ✅ Pied de page aligné (garde Accueil) → Task 9.
- ✅ Animations/Cérémonies catégorisées, pages plus tard → Task 1 (données), pas de page (hors scope).
- ✅ `/services` et `/soins` intacts → aucun task ne les modifie.
- ✅ Vérification build/lint/visuel → Task 10.
