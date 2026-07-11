# Soin Rituel Meta-Safer Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger uniquement les formulations à risque de la page Soin Rituel tout en conservant son identité, sa structure et ses informations commerciales.

**Architecture:** Les valeurs par défaut sont produites par `buildServiceLandingContent()` dans `src/lib/service-landing.ts`, puis surchargées par `Offering.landingContent`. Les valeurs par défaut seront sécurisées et un script Prisma idempotent permettra d'appliquer les mêmes corrections ciblées à l'offre active sans modifier ses autres champs.

**Tech Stack:** Next.js, TypeScript, Prisma/PostgreSQL, tests Node `tsx`.

## Global Constraints

- Modifier seulement les formulations présentant un risque publicitaire.
- Conserver le design, les images, le prix, la durée, les boutons et le ton mystique.
- Ne pas présenter l'expérience comme un traitement médical ou psychologique.
- Ne promettre aucun résultat précis, durable ou garanti.

---

### Task 1: Sécuriser les valeurs par défaut et leurs tests

**Files:**
- Modify: `src/lib/service-landing.ts`
- Modify: `src/lib/service-landing.test.ts`

**Interfaces:**
- Consumes: `buildServiceLandingContent(offering: OfferingView): ServiceLandingContent`
- Produces: contenu par défaut prudent pour `offering.slug === 'soin-rituel'`

- [ ] **Step 1: Ajouter des assertions contre les formulations à risque**

Ajouter des vérifications confirmant l'absence de promesses certaines, de diagnostic médical et d'affirmations directes sur l'état du visiteur, ainsi que la présence d'un avis non médical.

- [ ] **Step 2: Exécuter le test et confirmer l'échec**

Run: `npm run test:service-landing`

Expected: FAIL sur au moins une assertion de conformité nouvellement ajoutée.

- [ ] **Step 3: Modifier uniquement les textes à risque**

Remplacer les formulations directes et garanties des champs `subtitle`, `intro`, `sanctuaryText`, `recognitionTitle`, `recognitionIntro`, `recognitionItems`, `recognitionFinalText`, `recognitionPortalText`, `pillarsTitle`, `finalTitle`, `finalText` et des réponses FAQ par des formulations possibles, subjectives et non diagnostiques. Ajouter une FAQ indiquant clairement que le Soin Rituel est une expérience spirituelle et non un traitement médical ou psychologique.

- [ ] **Step 4: Exécuter le test et confirmer la réussite**

Run: `npm run test:service-landing`

Expected: PASS.

### Task 2: Mettre à jour les personnalisations persistées de manière ciblée

**Files:**
- Create: `prisma/scripts/update-soin-rituel-meta-copy.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `Offering` dont `slug` vaut `soin-rituel`
- Produces: fusion idempotente des seuls champs rédactionnels ciblés dans `landingContent`

- [ ] **Step 1: Créer un script Prisma idempotent**

Le script charge l'offre, conserve les clés visuelles et commerciales existantes, remplace seulement les champs textuels à risque et affiche l'identifiant de l'offre mise à jour. Il échoue clairement si l'offre est absente.

- [ ] **Step 2: Ajouter la commande de package**

Ajouter `content:update-soin-rituel-meta` qui exécute le script avec `tsx`.

- [ ] **Step 3: Vérifier le typage sans modifier la base distante**

Run: `npx tsc --noEmit`

Expected: PASS.

### Task 3: Vérification finale

**Files:**
- Verify: `src/lib/service-landing.ts`
- Verify: `src/lib/service-landing.test.ts`
- Verify: `prisma/scripts/update-soin-rituel-meta-copy.ts`

**Interfaces:**
- Consumes: fichiers modifiés dans les Tasks 1 et 2
- Produces: preuve de tests et liste explicite des étapes de déploiement

- [ ] **Step 1: Rechercher les formulations interdites restantes**

Run: `rg -n "malade sans aucune raison|médecin|spécialistes|une seule séance suffise|2 à 3 semaines|blessures purgées|purge le corps" src/lib/service-landing.ts prisma/scripts/update-soin-rituel-meta-copy.ts`

Expected: aucun résultat.

- [ ] **Step 2: Relancer les tests ciblés**

Run: `npm run test:service-landing`

Expected: PASS.

- [ ] **Step 3: Examiner le diff final**

Run: `git diff -- src/lib/service-landing.ts src/lib/service-landing.test.ts prisma/scripts/update-soin-rituel-meta-copy.ts package.json`

Expected: uniquement les adaptations rédactionnelles ciblées, le test associé et le script de synchronisation.
