# Spec — Kit To-do Kanban portable

**Date** : 2026-07-11
**But** : extraire le module To-do (kanban) de Runes & Magie en un « kit » autonome, sauvegardé dans le dépôt (`packages/todo-kanban/`) + livré en ZIP, réutilisable sur un futur site **Next.js** (App Router + Prisma/Postgres) par simple copie et branchement de 3 dépendances.

## Contexte

Le module To-do vit actuellement dans le projet R&M : page `src/app/admin/todo/page.tsx`, routes `src/app/api/admin/todos/**`, modèles Prisma `TodoTask`/`TodoNote`/`TodoAttachment`. La cliente veut pouvoir le réutiliser sur d'autres sites (même techno Next.js). Le kit doit être le module **seul** — sans le hub CRM ni le menu, spécifiques à R&M.

## Périmètre

- **Inclus** : tableau kanban 4 colonnes (glisser-déposer), priorités (4 niveaux), étiquettes + filtres, assignation, dates début/échéance + badge retard, notes, fichiers joints, archivage/suppression ; routes API CRUD ; modèles Prisma + migration SQL ; README d'installation.
- **Exclu** : hub CRM (`/admin/crm`), intégration menu, thème visuel R&M (le kit utilise des styles intégrés neutres, aucune dépendance CSS).

## Architecture — « les 3 prises »

Le module dépend de 3 choses fournies par le site hôte, isolées dans **un seul fichier** `src/lib/todo-adapters.ts` :

| Prise | Contrat attendu | R&M |
|---|---|---|
| `prisma` | client Prisma exposant les modèles Todo* | `@/lib/db` |
| `requireAdmin()` | `() => Promise<Response \| null>` — Response si NON autorisé, `null` sinon | `@/lib/admin-guard` |
| `uploadFile(file, folder?)` | `(File, string?) => Promise<string>` (URL publique) | `@/lib/supabase` |

Tout le reste (board, routes, modèles) importe uniquement depuis `todo-adapters`. **C'est le seul fichier à éditer** lors d'une réinstallation.

## Structure du kit

```
packages/todo-kanban/
  README.md                                  ← mode d'emploi (5 étapes)
  prisma/schema-todo.prisma                  ← 3 modèles à coller
  prisma/migration.sql                       ← SQL Postgres (fallback)
  src/lib/todo-adapters.ts                   ← les 3 prises (SEUL fichier à adapter)
  src/components/TodoBoard.tsx               ← le tableau kanban ('use client')
  src/app/api/admin/todos/route.ts           ← liste + création
  src/app/api/admin/todos/[id]/route.ts      ← détail + modif + suppression
  src/app/api/admin/todos/[id]/notes/route.ts
  src/app/api/admin/todos/[id]/attachments/route.ts
```

Portabilité du board : constante `API = '/api/admin/todos'` en tête (un seul point à changer si le site hôte veut un autre chemin) ; styles 100 % intégrés (inline) ; police via `var(--font-cinzel, serif)` avec repli `serif` automatique.

## Installation (résumé README)

1. Copier `src/**` du kit dans le `src/` du site hôte.
2. Coller les 3 modèles de `schema-todo.prisma` dans `prisma/schema.prisma`.
3. `npx prisma migrate dev --name add_todo_kanban` (ou exécuter `migration.sql`).
4. Éditer `src/lib/todo-adapters.ts` → brancher les 3 prises du site hôte.
5. Monter `<TodoBoard />` sur une page admin (ex. `src/app/admin/todo/page.tsx`).

## Livrable

- Dossier `packages/todo-kanban/` commité (versionné + dans Dropbox).
- ZIP `packages/todo-kanban.zip` que la cliente garde sur son ordinateur.

## Vérification

`tsc --noEmit` du projet reste propre (le kit vit hors de `src/`, n'affecte pas le build). Le contenu du kit est une copie fidèle des fichiers en production (déjà éprouvés), seul l'`import` des 3 prises change (vers `todo-adapters`).
