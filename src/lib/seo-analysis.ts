/**
 * Moteur d'analyse SEO « façon Rank Math », 100 % côté client (aucune API externe).
 * Produit un score 0–100 et une check-list colorée à partir du contenu d'une page.
 * Fonctions pures → testables dans `seo-analysis.test.ts`.
 */

export type SeoCheckStatus = 'good' | 'warn' | 'bad';

export interface SeoCheck {
  id: string;
  label: string;
  status: SeoCheckStatus;
  hint: string;
  /** Poids dans le score global. */
  weight: number;
}

export interface SeoAnalysisInput {
  /** Mot-clé cible. */
  focusKeyword: string;
  /** Meta-titre effectif (personnalisé ou auto). */
  metaTitle: string;
  /** Meta-description effective (personnalisée ou auto). */
  metaDescription: string;
  /** Slug de l'URL (ex. « soin-rituel »). */
  slug: string;
  /** Titre H1 de la page (nom du service). */
  h1: string;
  /** Texte d'introduction (premier paragraphe). */
  intro: string;
  /** Tout le texte visible concaténé (pour densité + nombre de mots). */
  bodyText: string;
  /** Textes alternatifs des images principales (pour vérifier les `alt`). */
  imageAlts: string[];
  /** Nombre de questions FAQ. */
  faqCount: number;
}

export interface SeoAnalysisResult {
  score: number;
  checks: SeoCheck[];
}

/** Minuscule + sans accents, pour des comparaisons robustes en français. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function contains(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return normalize(haystack).includes(normalize(needle));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Densité du mot-clé en % (occurrences du mot-clé / nombre de mots). */
export function keywordDensity(bodyText: string, keyword: string): number {
  const words = countWords(bodyText);
  if (!words || !keyword.trim()) return 0;
  const nk = normalize(keyword);
  const nb = normalize(bodyText);
  // Compte les occurrences non chevauchantes.
  let count = 0;
  let from = 0;
  for (;;) {
    const idx = nb.indexOf(nk, from);
    if (idx === -1) break;
    count += 1;
    from = idx + nk.length;
  }
  return (count / words) * 100;
}

const STATUS_FACTOR: Record<SeoCheckStatus, number> = { good: 1, warn: 0.5, bad: 0 };

/** Analyse le contenu et renvoie un score 0–100 + la liste des vérifications. */
export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysisResult {
  const kw = input.focusKeyword.trim();
  const checks: SeoCheck[] = [];

  const push = (id: string, label: string, status: SeoCheckStatus, hint: string, weight = 1) =>
    checks.push({ id, label, status, hint, weight });

  // 0. Mot-clé défini
  push(
    'keyword-set',
    'Mot-clé cible défini',
    kw ? 'good' : 'bad',
    kw ? `Mot-clé : « ${kw} ».` : 'Renseigne un mot-clé cible pour analyser la page.',
    2,
  );

  // 1. Mot-clé dans le meta-titre
  push(
    'keyword-in-title',
    'Mot-clé dans le titre SEO',
    contains(input.metaTitle, kw) ? 'good' : 'bad',
    'Place le mot-clé cible dans le meta-titre, idéalement au début.',
    2,
  );

  // 2. Mot-clé dans la meta-description
  push(
    'keyword-in-description',
    'Mot-clé dans la méta-description',
    contains(input.metaDescription, kw) ? 'good' : 'bad',
    'Inclus le mot-clé cible dans la méta-description.',
    1.5,
  );

  // 3. Mot-clé dans le titre H1
  push(
    'keyword-in-h1',
    'Mot-clé dans le titre principal (H1)',
    contains(input.h1, kw) ? 'good' : 'warn',
    'Le mot-clé devrait apparaître dans le titre H1 de la page.',
    1.5,
  );

  // 4. Mot-clé dans l'introduction
  push(
    'keyword-in-intro',
    "Mot-clé dans l'introduction",
    contains(input.intro, kw) ? 'good' : 'warn',
    'Mentionne le mot-clé dès le premier paragraphe.',
    1,
  );

  // 5. Mot-clé dans le slug (URL)
  push(
    'keyword-in-slug',
    "Mot-clé dans l'URL (slug)",
    contains(input.slug.replace(/-/g, ' '), kw) ? 'good' : 'warn',
    "Le slug de l'URL gagne à contenir le mot-clé.",
    1,
  );

  // 6. Longueur du meta-titre (idéal 50–60)
  const titleLen = input.metaTitle.trim().length;
  push(
    'title-length',
    'Longueur du titre SEO',
    titleLen >= 50 && titleLen <= 60 ? 'good' : titleLen >= 30 && titleLen <= 70 ? 'warn' : 'bad',
    `Titre : ${titleLen} caractères (idéal 50–60).`,
    1.5,
  );

  // 7. Longueur de la méta-description (idéal 120–160)
  const descLen = input.metaDescription.trim().length;
  push(
    'description-length',
    'Longueur de la méta-description',
    descLen >= 120 && descLen <= 160 ? 'good' : descLen >= 80 && descLen <= 180 ? 'warn' : 'bad',
    `Description : ${descLen} caractères (idéal 120–160).`,
    1.5,
  );

  // 8. Nombre de mots du contenu
  const words = countWords(input.bodyText);
  push(
    'content-length',
    'Longueur du contenu',
    words >= 300 ? 'good' : words >= 150 ? 'warn' : 'bad',
    `${words} mots (vise au moins 300 mots).`,
    1.5,
  );

  // 9. Images avec texte alternatif
  const alts = input.imageAlts;
  const allHaveAlt = alts.length > 0 && alts.every((a) => a.trim().length > 0);
  push(
    'image-alt',
    'Images avec texte alternatif',
    allHaveAlt ? 'good' : alts.length ? 'warn' : 'bad',
    'Chaque image importante doit avoir un texte alternatif descriptif.',
    1,
  );

  // 10. FAQ présente (rich snippets)
  push(
    'faq-present',
    'Section FAQ présente',
    input.faqCount > 0 ? 'good' : 'warn',
    'Une FAQ structurée améliore les résultats enrichis Google.',
    0.5,
  );

  // 11. Densité du mot-clé (idéal 0,5–2,5 %)
  const density = keywordDensity(input.bodyText, kw);
  push(
    'keyword-density',
    'Densité du mot-clé',
    !kw ? 'bad' : density >= 0.5 && density <= 2.5 ? 'good' : density > 0 ? 'warn' : 'bad',
    `Densité : ${density.toFixed(1)} % (idéal 0,5–2,5 %).`,
    1,
  );

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + c.weight * STATUS_FACTOR[c.status], 0);
  const score = totalWeight ? Math.round((earned / totalWeight) * 100) : 0;

  return { score, checks };
}

/** Libellé qualitatif du score, pour l'UI. */
export function scoreLabel(score: number): { label: string; tone: SeoCheckStatus } {
  if (score >= 80) return { label: 'Excellent', tone: 'good' };
  if (score >= 50) return { label: 'À améliorer', tone: 'warn' };
  return { label: 'Faible', tone: 'bad' };
}
