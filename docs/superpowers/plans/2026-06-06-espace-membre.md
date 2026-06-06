# Espace Membre — Plan d'implémentation

> Plan de fonctionnalité. Étape de planification : les sections « Tâches » utilisent des cases à cocher (`- [ ]`) pour le suivi. Rien n'est codé tant que ce plan n'est pas validé.

**Date :** 2026-06-06
**Branche :** `claude/button-navigation-seances-EzhLE`
**Statut :** 🟡 Plan en attente de validation

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

## 🧭 Décisions d'architecture (validées)

### 1. Compte unifié
Un **seul compte** pour boutique + formations + soins. On **réutilise le modèle `User`** (le modèle unifié déjà présent dans `prisma/schema.prisma`, l.434) plutôt que de créer une nouvelle table.

⚠️ **Point de vigilance — dette technique existante :** il y a aujourd'hui **deux tables parallèles**, `HolisticUser` (utilisée en pratique par l'auth, `src/lib/auth.ts` + `src/lib/holistic-auth.ts`) et `User` (modèle « v2 » qui semble destiné à les unifier mais n'est pas branché à l'auth). **Avant de coder, il faut trancher laquelle devient la table de référence.** Voir « Questions ouvertes » §A. Le reste du plan suppose qu'on s'appuie sur la table réellement câblée à l'auth (`HolisticUser` aujourd'hui), quitte à la renommer/migrer ensuite.

### 2. Lien commandes ↔ compte
Aujourd'hui `Order` (l.213) ne stocke que `customerEmail`/`customerName` en texte — **aucune FK vers un utilisateur**. Deux options pour rattacher l'historique d'achat :
- **(Recommandé)** Ajouter `Order.userId String?` (FK nullable vers l'utilisateur) renseigné au checkout quand le client est connecté **+** fallback par `customerEmail` pour les commandes passées en invité. Permet de réconcilier les anciennes commandes le jour où l'invité crée un compte avec le même email.
- Lien par email seul (aucune migration de schéma, mais fragile si le client change d'email).

### 3. Octroi d'accès aux formations (« entitlements »)
Les produits supportent déjà `productType = COURSE | EBOOK`, avec `Product.courseAccessSlug` et `Product.downloadUrl` (schema l.151-155). Mais **rien ne relie un user à un cours acheté**. On introduit une table d'**accès** (`MemberEntitlement` ou `CourseEnrollment`) créée au moment du paiement confirmé (webhook Stripe / Clover) :
- 1 ligne = « cet utilisateur a accès à ce produit/cours », avec date d'octroi et source (commande).
- C'est la **clé de voûte** : la page « Mes formations » lit cette table, pas l'historique de commandes brut.

---

## 🗂️ Modèle de données (Prisma — à ajouter / modifier)

> Tous les nouveaux modules sont **additifs** et **nullable-safe** pour ne pas casser l'existant. Migration via `prisma migrate` sur Supabase (DIRECT_URL).

### Modifs
- `Order` → ajouter `userId String?` + relation + `@@index([userId])`. Optionnel : `invoiceNumber`, `invoiceUrl`.
- `User` (ou `HolisticUser` selon §A) → ajouter les relations inverses (`orders`, `entitlements`, `courseProgress`, `veilleeViews`).

### Nouveaux modèles (esquisse, à affiner en implémentation)

```prisma
// Accès accordé à un membre (formation, ebook, contenu premium)
model MemberEntitlement {
  id          String   @id @default(cuid())
  userId      String
  productId   String?  // FK logique vers Product (cours/ebook acheté)
  kind        String   // COURSE | EBOOK | MERESTEGERE | VEILLEES | LIBRARY
  source      String   @default("PURCHASE") // PURCHASE | MANUAL | GIFT | SUBSCRIPTION
  orderId     String?  // commande à l'origine de l'accès
  grantedAt   DateTime @default(now())
  expiresAt   DateTime? // null = à vie
  @@unique([userId, productId])
  @@index([userId, kind])
}

// Progression d'un membre dans un cours
model CourseProgress {
  id           String   @id @default(cuid())
  userId       String
  productId    String   // le cours
  lessonId     String   // chapitre/leçon (slug ou id du contenu)
  status       String   @default("IN_PROGRESS") // IN_PROGRESS | COMPLETED
  lastViewedAt DateTime @default(now())
  @@unique([userId, productId, lessonId])
  @@index([userId, productId])
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

> **Décision à prendre en impl :** un seul abonnement « membre » donne-t-il accès à Merestegere/Veillées/Bibliothèque, ou faut-il les acheter séparément ? (voir Questions ouvertes §B). Le champ `accessLevel` + `MemberEntitlement.kind` permettent les deux.

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
- `prisma/schema.prisma` — nouveaux modèles + `Order.userId`.
- `src/lib/auth.ts` — exposer `firstName`/profil dans la session si besoin.
- Webhooks paiement (`src/app/api/holistique/checkout/route.ts` et webhook Stripe boutique) — **octroyer l'accès** (`MemberEntitlement`) au paiement confirmé.
- Navbar du site — lien « Mon compte » / « Se connecter ».
- Génération de facture PDF (nouveau ou existant à vérifier).

---

## ✅ Tâches (par phases)

### Phase 0 — Fondations
- [ ] Trancher la table user de référence (§A) et la stratégie de migration.
- [ ] Schéma Prisma : `Order.userId`, `MemberEntitlement`, `CourseProgress`, + migration.
- [ ] Helpers `src/lib/entitlements.ts` (octroi + vérification d'accès).
- [ ] Brancher l'octroi d'accès dans les webhooks de paiement (Stripe boutique + Clover si applicable).
- [ ] Route group `(membre)` + auth guard + layout sidebar/drawer (coquille vide).

### Phase 1 — Achats & factures (valeur immédiate, peu de contenu à produire)
- [ ] Page « Achats & factures » : historique via `Order.userId` + fallback email.
- [ ] Génération/affichage des factures PDF.

### Phase 2 — Mes formations
- [ ] Page liste des cours du membre (depuis `MemberEntitlement` kind=COURSE).
- [ ] Lecteur de cours + chapitres + barre de progression (`CourseProgress`).
- [ ] Définir où vit le contenu d'un cours (chapitres/vidéos) — voir §C.

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

## ❓ Questions ouvertes (à clarifier avant/pendant l'impl)

**§A — Table user.** On garde `HolisticUser` comme table de référence (déjà câblée à l'auth) et on abandonne/migre `User`, ou l'inverse ? Impact sur toutes les FK ci-dessus. *(Décision technique — je peux trancher et documenter si tu préfères.)*

**§B — Accès aux contenus premium.** Merestegere / Veillées / Bibliothèque sont-ils :
- inclus pour **tout membre** (= dès qu'on a un compte) ?
- réservés aux clients ayant **acheté au moins une formation** ?
- vendus via un **abonnement** dédié (mensuel) ?

**§C — Contenu des cours.** Les vidéos/chapitres d'une formation sont stockés où aujourd'hui ? (rien trouvé en DB hormis `Product.courseAccessSlug`). Faut-il un modèle `Course`/`Lesson`, ou les cours sont-ils hébergés ailleurs (ex : plateforme vidéo externe) et on ne gère que l'accès ?

**§D — Factures.** Existe-t-il déjà une génération de facture PDF, ou faut-il la créer (lib PDF + stockage) ?

**§E — Veillées : technique vidéo.** Live via Daily.co (déjà dans la stack) ou simples vidéos hébergées/embed (YouTube non répertorié, Vimeo, Supabase) ? Les membres regardent-ils en direct ou seulement en replay ?

---

## 🔎 État des lieux du code (référence)

- **Auth :** `src/lib/auth.ts` (NextAuth, gère `AdminUser` + `HolisticUser`), `src/lib/holistic-auth.ts`. Session JWT.
- **Dashboard existant (modèle de style) :** `src/app/(holistique)/soins/dashboard/client/page.tsx`.
- **Produits cours/ebooks :** `Product.productType`, `courseAccessSlug`, `downloadUrl` (`prisma/schema.prisma` l.124-160).
- **Commandes :** `Order` / `OrderItem` (l.213-245) — pas de FK user.
- **Checkout soins :** `src/app/api/holistique/checkout/route.ts` (point d'ancrage pour l'octroi d'accès).
- **Stockage fichiers :** Supabase Storage (`src/lib/supabase.ts`).
