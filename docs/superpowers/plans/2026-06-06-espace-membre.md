# Espace Membre — Plan d'implémentation

> Plan de fonctionnalité. Étape de planification : les sections « Tâches » utilisent des cases à cocher (`- [ ]`) pour le suivi. Rien n'est codé tant que ce plan n'est pas validé.

**Date :** 2026-06-06
**Branche :** `claude/button-navigation-seances-EzhLE`
**Statut :** 🟢 Décisions verrouillées — prêt à implémenter (Phase 0)

---

## 🎯 Objectif

Créer un **espace membre** (compte client) qui devient une **valeur ajoutée** de la boutique et des services. Quand un client achète une formation en ligne, elle se « loge » automatiquement dans son compte. Le membre y retrouve :

1. **Mes formations** — les cours achetés, avec suivi de progression (cours suivis / terminés) + accès au lecteur vidéo.
2. **Le Merestegere** — notre « bible » / grimoire des membres, en **lecture en ligne par chapitres + téléchargement PDF**.
3. **Les Veillées de Noctura** — la « vidéo de la semaine » animée par Noctura (diffusion hebdomadaire + replays).
4. **Achats & factures** — historique de commandes + téléchargement des factures PDF.
5. **Bibliothèque** — ressources des membres (ebooks, fiches, audios, méditations…).

> **Nommage validé avec le client :**
> - Vidéo de la semaine → **« Les Veillées de Noctura »**
> - Bible/grimoire → **« Le Merestegere »**

---

## 🧭 Décisions d'architecture (toutes validées ✅)

### 1. Compte unifié → on bâtit sur `HolisticUser`
Un **seul compte** pour boutique + formations + soins.

**Décision (validée) :** on construit l'espace membre sur **`HolisticUser`** — la table **déjà branchée à la connexion** (`src/lib/auth.ts`), qui gère déjà les rôles `CLIENT | PRACTITIONER | ADMIN`. C'est donc déjà le compte unifié qui fonctionne.

> **Pourquoi pas `User` ?** Il existe une 2ᵉ table `User` (« v2 ») créée pour unifier, alimentée par `prisma/scripts/backfill-unified.ts`, **mais jamais branchée à l'auth** (coquille inutilisée). Basculer la connexion dessus risquerait de **casser les logins existants** pour un bénéfice nul à court terme. La consolidation/retrait de `User` est un **ménage séparé**, hors périmètre de cette feature.

### 2. Lien commandes ↔ compte (validé)
Aujourd'hui `Order` (l.213) ne stocke que `customerEmail`/`customerName` en texte — **aucune FK vers un utilisateur**. On ajoute **`Order.userId String?`** (FK nullable vers `HolisticUser`), renseigné au checkout quand le client est connecté, **+ fallback par `customerEmail`** pour réconcilier les commandes passées en invité le jour où l'email correspond à un compte.

### 3. Octroi d'accès aux formations (« entitlements »)
Les produits supportent déjà `productType = COURSE | EBOOK`, avec `Product.courseAccessSlug` et `Product.downloadUrl` (schema l.151-155). Mais **rien ne relie un user à un cours acheté**. On introduit une table d'**accès** (`MemberEntitlement`) créée au moment du paiement confirmé (webhook Stripe) :
- 1 ligne = « cet utilisateur a accès à ce produit/cours », avec date d'octroi et source (commande).
- C'est la **clé de voûte des achats** : « Mes formations » lit cette table, pas l'historique de commandes brut.

> ⚠️ **Distinction importante (suite à la décision §B ci-dessous) :** `MemberEntitlement` ne sert qu'aux contenus **achetés** (cours, ebooks). Le **Merestegere, les Veillées et la Bibliothèque sont GRATUITS pour tout membre connecté** → leur accès est conditionné uniquement à « être connecté », pas à un entitlement.

### 4. Qui voit quoi — niveaux d'accès (validé : gratuit pour tout membre)
| Contenu | Condition d'accès |
|---|---|
| Mes formations / cours / ebooks | Avoir **acheté** (`MemberEntitlement`) |
| Achats & factures | Ses propres commandes (`Order.userId` / email) |
| **Le Merestegere** | **Tout membre connecté** (gratuit) |
| **Les Veillées de Noctura** | **Tout membre connecté** (gratuit) |
| **Bibliothèque** | **Tout membre connecté** (gratuit) |

→ On garde quand même un champ `accessLevel` (`FREE | MEMBER | PREMIUM`) sur les contenus pour pouvoir, **plus tard**, verrouiller certaines ressources sans refonte. Par défaut tout est `MEMBER`.

### 5. Contenu des cours en base de données (validé)
Les chapitres/vidéos d'une formation vivent **en DB** (modèles `Course` + `Lesson`), gérés depuis l'admin. La progression du membre (`CourseProgress`) pointe sur `Lesson.id`.

### 6. Factures via Stripe (validé)
Le checkout (`src/app/api/checkout/route.ts`) utilise Stripe Checkout `mode: "payment"` → **pas de facture PDF aujourd'hui** (reçu email seulement). On active **`invoice_creation: { enabled: true }`** dans la session : Stripe génère une **facture PDF hébergée** dont on stocke l'URL (`Order.invoiceUrl`) via le webhook → affichée dans « Achats & factures ». Pas de génération PDF maison.

### 7. Veillées en live (validé)
Diffusion **en direct via Daily.co** (déjà dans la stack) + **replays** enregistrés/embarqués pour ceux qui ratent le direct.

---

## 🗂️ Modèle de données (Prisma — à ajouter / modifier)

> Tous les nouveaux modules sont **additifs** et **nullable-safe** pour ne pas casser l'existant. Migration via `prisma migrate` sur Supabase (DIRECT_URL).

### Modifs
- `Order` → ajouter `userId String?` (FK vers `HolisticUser`) + relation + `@@index([userId])`, **+ `invoiceUrl String?`** (URL facture PDF Stripe) + optionnel `invoiceNumber`.
- `HolisticUser` → ajouter les relations inverses (`orders`, `entitlements`, `courseProgress`).
- `Product` (cours) → relation optionnelle vers `Course` (1 produit COURSE ↔ 1 `Course`).

### Nouveaux modèles (esquisse, à affiner en implémentation)

```prisma
// Accès accordé à un membre — UNIQUEMENT pour contenus ACHETÉS (cours, ebooks).
// (Merestegere / Veillées / Bibliothèque = gratuits, pas d'entitlement requis.)
model MemberEntitlement {
  id          String   @id @default(cuid())
  userId      String
  productId   String?  // FK logique vers Product (cours/ebook acheté)
  kind        String   // COURSE | EBOOK
  source      String   @default("PURCHASE") // PURCHASE | MANUAL | GIFT
  orderId     String?  // commande à l'origine de l'accès
  grantedAt   DateTime @default(now())
  expiresAt   DateTime? // null = à vie
  @@unique([userId, productId])
  @@index([userId, kind])
}

// Cours (contenu en DB) — lié à un Product de type COURSE
model Course {
  id          String   @id @default(cuid())
  productId   String   @unique // le produit vendu correspondant
  slug        String   @unique
  title       String
  description String   @default("")
  coverUrl    String?
  isPublished Boolean  @default(false)
  lessons     Lesson[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Leçon / chapitre d'un cours
model Lesson {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  slug        String
  title       String
  videoUrl    String?  // vidéo (embed/hébergée Supabase)
  content     String   @default("") // texte/markdown du chapitre
  durationMin Int?
  sortOrder   Int      @default(0)
  isPreview   Boolean  @default(false) // visible sans achat (extrait gratuit)
  @@unique([courseId, slug])
  @@index([courseId, sortOrder])
}

// Progression d'un membre dans un cours
model CourseProgress {
  id           String   @id @default(cuid())
  userId       String
  courseId     String
  lessonId     String   // -> Lesson.id
  status       String   @default("IN_PROGRESS") // IN_PROGRESS | COMPLETED
  lastViewedAt DateTime @default(now())
  @@unique([userId, lessonId])
  @@index([userId, courseId])
}

// Le Merestegere — chapitres lisibles en ligne (CMS léger, géré en /admin)
model MerestegereChapter {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  content     String   // markdown/HTML
  pdfUrl      String?  // version téléchargeable (Supabase Storage)
  coverUrl    String?
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Les Veillées de Noctura — diffusion hebdo + replays
model Veillee {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String   @default("")
  videoUrl    String   // lien (Daily.co live, ou vidéo hébergée/embed)
  thumbnailUrl String?
  publishedAt DateTime // date de la semaine
  isLive      Boolean  @default(false)
  isPublished Boolean  @default(false)
  @@index([publishedAt])
}

// Bibliothèque — ressources membres (ebooks, fiches, audios)
model LibraryResource {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String   @default("")
  type        String   // EBOOK | PDF | AUDIO | VIDEO | LINK
  fileUrl     String   // Supabase Storage (URL signée à la demande)
  coverUrl    String?
  category    String?
  accessLevel String   @default("MEMBER") // FREE | MEMBER | PREMIUM
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(false)
}
```

> **Décision validée :** Merestegere / Veillées / Bibliothèque sont **gratuits pour tout membre connecté**. Le champ `accessLevel` reste à `MEMBER` par défaut (permet de verrouiller certains contenus plus tard sans refonte).

---

## 🎨 Interface & menu

### Layout
- **Desktop :** menu latéral **fixe à gauche** (sidebar), zone de contenu à droite. Largeur sidebar ~260px.
- **Mobile :** sidebar masquée → **barre de navigation moderne** :
  - soit un **tiroir (drawer) qui glisse** depuis la gauche (bouton hamburger en haut),
  - soit une **bottom-tab bar** type app native (icônes en bas).
  - 👉 Recommandation : **drawer** sur les pages de contenu (Merestegere, lecteur de cours) pour libérer la hauteur, **header sticky** avec avatar + titre de section.

### Charte graphique (réutiliser l'existant)
Calquer le style du dashboard soins (`src/app/(holistique)/soins/dashboard/client/page.tsx`) :
- Variables CSS : `--noir-nuit`, `--violet-profond`, `--charbon-mystere`, `--or-ancien`, `--or-clair`, `--turquoise-cristal`, `--parchemin`.
- Polices : `--font-cinzel` / `--font-cinzel-decorative` (titres) + `--font-cormorant` (texte). Symboles runiques en séparateurs (`RuneDivider`).
- Cartes sombres, bordures or translucides, badges de statut arrondis.

### Items du menu de gauche (validés)
1. 🏠 **Tableau de bord** (accueil membre : raccourcis + dernière Veillée + reprise de cours)
2. 🎓 **Mes formations**
3. 📖 **Le Merestegere**
4. 🌙 **Les Veillées de Noctura**
5. 🛒 **Achats & factures**
6. 📚 **Bibliothèque**
7. ⚙️ **Mon profil** (infos, mot de passe, déconnexion)

---

## 📁 Structure des fichiers (prévision)

> ⚠️ **Next.js modifié (voir `AGENTS.md`)** : lire `node_modules/next/dist/docs/` et **calquer les conventions existantes** (route groups, `params: Promise<…>`, server components) avant de coder. Ne pas se fier à la mémoire.

**Route group dédié :** `src/app/(membre)/compte/...` (layout + auth isolés, comme `(holistique)`).

**Créés :**
- `src/app/(membre)/layout.tsx` — providers/session.
- `src/app/(membre)/compte/layout.tsx` — **sidebar gauche + drawer mobile**.
- `src/app/(membre)/compte/page.tsx` — tableau de bord.
- `src/app/(membre)/compte/formations/page.tsx` — liste des cours du membre.
- `src/app/(membre)/compte/formations/[slug]/page.tsx` — lecteur de cours + progression.
- `src/app/(membre)/compte/merestegere/page.tsx` — sommaire des chapitres.
- `src/app/(membre)/compte/merestegere/[slug]/page.tsx` — lecture chapitre + bouton PDF.
- `src/app/(membre)/compte/veillees/page.tsx` — Veillée de la semaine + replays.
- `src/app/(membre)/compte/achats/page.tsx` — historique + liens factures.
- `src/app/(membre)/compte/bibliotheque/page.tsx` — ressources.
- `src/app/(membre)/compte/profil/page.tsx` — profil.
- `src/components/membre/Sidebar.tsx`, `MobileDrawer.tsx`, `CourseProgressBar.tsx`, `MerestegereReader.tsx`…
- `src/lib/entitlements.ts` — helpers d'accès (a-t-il droit à ce cours ?), octroi au paiement.
- `src/app/api/membre/...` — route handlers (progression, URL signées de téléchargement).
- **Admin :** `src/app/admin/merestegere/`, `src/app/admin/veillees/`, `src/app/admin/bibliotheque/` — CRUD du contenu.

**Modifiés :**
- `prisma/schema.prisma` — nouveaux modèles + `Order.userId` + `Order.invoiceUrl`.
- `src/app/api/checkout/route.ts` — activer `invoice_creation: { enabled: true }` + passer `userId` (si connecté) en metadata.
- `src/app/api/webhooks/stripe/route.ts` — au paiement confirmé : **octroyer l'accès** (`MemberEntitlement` pour les cours/ebooks) + récupérer/stocker `invoiceUrl`.
- `src/lib/auth.ts` — exposer `firstName`/profil dans la session si besoin.
- Navbar du site — lien « Mon compte » / « Se connecter ».

---

## ✅ Tâches (par phases)

### Phase 0 — Fondations ✅ (faite — commit sur `claude/button-navigation-seances-EzhLE`)
- [x] Schéma Prisma : `Order.userId` + `Order.invoiceUrl`/`invoiceNumber`, `MemberEntitlement`, `Course`, `Lesson`, `CourseProgress` + migration SQL versionnée (`20260606120000_add_member_space`).
- [x] Helpers `src/lib/entitlements.ts` (octroi idempotent + vérification d'accès aux cours/ebooks).
- [x] Octroi d'accès branché au webhook Stripe boutique (`grantEntitlementsForOrder` au paiement confirmé) + récupération de la facture PDF.
- [x] Checkout : `invoice_creation` activé + rattachement `Order.userId` (validé contre `HolisticUser`).
- [x] Route group `(membre)/compte` + garde d'auth serveur (sur `HolisticUser`) + shell sidebar desktop / drawer mobile + tableau de bord + 6 pages de sections (placeholders).

> ⚠️ **À appliquer en prod (Supabase) :** la migration n'est **pas** lancée ici (pas de `DATABASE_URL` dans l'environnement). Avant/au déploiement : `prisma migrate deploy` sur la base Supabase.
> **Note UI :** comme `/admin`, l'espace membre vit sous le layout racine (Navbar/Footer publics encore rendus). Masquer ces éléments sur `/compte` est un polish rapide à valider (Phase 6).

### Phase 1 — Achats & factures (valeur immédiate, peu de contenu à produire)
- [ ] Activer `invoice_creation` dans `src/app/api/checkout/route.ts` + passer `userId` en metadata.
- [ ] Webhook Stripe : stocker `Order.invoiceUrl`.
- [ ] Page « Achats & factures » : historique via `Order.userId` + fallback email + lien facture PDF.

### Phase 2 — Mes formations
- [ ] Admin : CRUD `Course`/`Lesson` (rattacher un cours à un produit COURSE).
- [ ] Page liste des cours du membre (depuis `MemberEntitlement` kind=COURSE).
- [ ] Lecteur de cours + chapitres + barre de progression (`CourseProgress`).

### Phase 3 — Le Merestegere
- [ ] Modèle + admin CRUD chapitres + upload PDF (Supabase Storage).
- [ ] Sommaire + lecture en ligne + bouton téléchargement.

### Phase 4 — Les Veillées de Noctura
- [ ] Modèle + admin CRUD.
- [ ] Page Veillée de la semaine (live/embed) + grille des replays.

### Phase 5 — Bibliothèque
- [ ] Modèle + admin CRUD + URL de téléchargement signées.
- [ ] Page bibliothèque (filtres par type/catégorie).

### Phase 6 — Polish
- [ ] Tableau de bord (raccourcis, reprise de cours, dernière Veillée).
- [ ] Page profil (édition infos, mot de passe).
- [ ] Responsive mobile final + accessibilité.

---

## ✔️ Décisions verrouillées (récap)

| # | Question | Décision |
|---|---|---|
| §A | Table compte | **`HolisticUser`** (déjà câblée à l'auth). `User` = ménage séparé, hors périmètre. |
| §B | Accès Merestegere/Veillées/Bibliothèque | **Gratuit pour tout membre connecté.** |
| §C | Contenu des cours | **En DB** (`Course` + `Lesson`), géré en admin. |
| §D | Factures | **Stripe `invoice_creation`** (facture PDF hébergée, URL stockée). |
| §E | Veillées | **Live Daily.co + replays.** |

### Points mineurs à confirmer en cours d'implémentation
- Numérotation/format légal des factures Stripe (TPS/TVQ) — à vérifier dans la config Stripe du compte.
- Hébergement des **vidéos de cours** et **replays de Veillées** : Supabase Storage vs embed externe (Vimeo). Impacte le poids/coût — décision au moment de la Phase 2/4.

---

## 🔎 État des lieux du code (référence)

- **Auth :** `src/lib/auth.ts` (NextAuth, gère `AdminUser` + `HolisticUser`), `src/lib/holistic-auth.ts`. Session JWT.
- **Dashboard existant (modèle de style) :** `src/app/(holistique)/soins/dashboard/client/page.tsx`.
- **Produits cours/ebooks :** `Product.productType`, `courseAccessSlug`, `downloadUrl` (`prisma/schema.prisma` l.124-160).
- **Commandes :** `Order` / `OrderItem` (l.213-245) — pas de FK user.
- **Checkout soins :** `src/app/api/holistique/checkout/route.ts` (point d'ancrage pour l'octroi d'accès).
- **Stockage fichiers :** Supabase Storage (`src/lib/supabase.ts`).
