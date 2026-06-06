@AGENTS.md

## 🗺️ Carte du projet (lire en premier)

**Runes & Magie** — site e-commerce + plateforme de soins holistiques, déployé sur Vercel (`runesetmagie.ca`).

### Stack
- **Next.js 16.2.1** (App Router, React 19) — ⚠️ voir AGENTS.md : APIs différentes des versions connues, lire `node_modules/next/dist/docs/` avant de coder.
- **TypeScript** + **Tailwind CSS v4** (config `tailwind.config.ts`, thème : or-ancien, turquoise-cristal, parchemin…).
- **Prisma 6** + **Supabase Postgres** (`DATABASE_URL` / `DIRECT_URL`). `dev.db` = SQLite local de dev uniquement.
- **NextAuth v5 (beta)** — deux systèmes d'auth séparés : `src/lib/auth.ts` (site/admin) et `src/lib/holistic-auth.ts` (module soins, rôles CLIENT/PRACTITIONER/ADMIN).
- **Paiements** : Stripe (web) + **Clover** (POS, sync produits/inventaire via crons). **Email** : Resend. **Vidéo** : Daily.co. **Stockage images** : Supabase Storage.

### Deux applications dans un seul Next.js
1. **Site principal** (boutique-école) : `/`, `/boutique`, `/ecole`, `/a-propos`, `/contact`, `/panier`, `/admin`…
2. **Plateforme holistique** : route group `src/app/(holistique)/` → URLs `/soins/*`. Layout, auth et modèles Prisma (`Holistic*`) isolés. Suivi détaillé dans `SUIVI_HOLISTIQUE.md`.

### Arborescence
- `src/app/` — routes (App Router) + `api/` (route handlers) + `admin/` (back-office).
- `src/components/` — UI réutilisable (`hero/`, `layout/`, `boutique/`, `holistique/`, `ui/`).
- `src/lib/` — logique métier : `db.ts` (Prisma client), `clover*.ts`, `supabase.ts`, `*-email.ts`, `menu.ts`, `offerings.ts`…
- `src/data/products.ts` — **types** + données statiques (catégories, pierres). ⚠️ Les images produits réelles viennent de la **DB** (`Product.image`), pas de ce fichier.
- `prisma/schema.prisma` — 32 modèles. `prisma/scripts/` — backfill/migrations data.
- `scripts/` — scripts ponctuels (seed, fix, sync Clover/oracles/tarots).
- `public/images/` — assets statiques (hero, logos, about, services, produits…).

### Base de données (Prisma — 32 modèles)
- **Boutique** : `Product`, `Category`, `Order`, `OrderItem`, `Clover*`.
- **Soins (legacy/v1)** : `Offering`, `Booking`, `Availability`, `Payment`, `Review`, `Practitioner`…
- **Soins (holistique v2)** : `Holistic*`, `Practitioner`, `PendingPractitionerChange`.
- **Site/contenu** : `MenuItem`, `HomeSlider`, `NewsletterSubscriber`, `AdminUser`/`User`.

### Lancer / build / déployer
- `npm run dev` — dev local. `npm run build` = `prisma generate && next build`.
- **Déploiement : push sur `main` → déploiement auto Vercel.** Crons Vercel dans `vercel.json` (sync Clover quotidienne).
- Scripts data : `npm run db:seed:categories`, `db:backfill`, etc. (via `tsx`).

### Conventions
- Tout en **français** (UI, commits, commentaires).
- Variables d'env clés : `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_*`, `STRIPE_*`, `CLOVER_*`, `RESEND_API_KEY`, `DAILY_API_KEY`, `CRON_SECRET`.

### Où regarder selon le besoin
- État/roadmap module soins → `SUIVI_HOLISTIQUE.md`
- Backlog d'idées → `CHOSES_A_FAIRE.md`
- Plans & specs de features → `docs/superpowers/`

## Règles de projet

### Commit et déploiement automatique
- **TOUJOURS** faire un `git add`, `git commit` et `git push` après chaque modification ou changement majeur complété.
- Ne jamais laisser des changements non commités en local.
- Utiliser des messages de commit clairs en français décrivant les changements effectués.
- Le push sur `main` déclenche automatiquement le déploiement sur Vercel.
