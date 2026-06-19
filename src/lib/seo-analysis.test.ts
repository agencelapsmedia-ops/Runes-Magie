import assert from 'node:assert/strict';
import { analyzeSeo, normalize, keywordDensity, scoreLabel } from './seo-analysis';

// --- normalize : minuscule + sans accents ---
assert.equal(normalize('Soin Énergétique'), 'soin energetique');
assert.equal(normalize('  RUNES  '), 'runes');

// --- keywordDensity : occurrences / nombre de mots ---
// « rune » apparaît 2 fois sur 4 mots → 50 %.
assert.equal(keywordDensity('rune magie rune viking', 'rune'), 50);
assert.equal(keywordDensity('', 'rune'), 0);
assert.equal(keywordDensity('texte sans mot cle', ''), 0);
// insensible aux accents : « énergie » trouvé via « energie ».
assert.ok(keywordDensity('soin energie pure', 'énergie') > 0);

// --- Page bien optimisée → score élevé ---
// ~200 mots avec « soin rituel » 3 fois → densité ~1,5 % (plage idéale).
const bodyText = Array.from({ length: 200 }, (_, i) =>
  i % 70 === 0 ? 'soin rituel' : 'mot',
).join(' ');
const good = analyzeSeo({
  focusKeyword: 'soin rituel',
  // 55 caractères (idéal 50–60).
  metaTitle: 'Soin Rituel à Saint-Eustache | Libération et apaisement',
  // ~136 caractères (idéal 120–160).
  metaDescription:
    'Le soin rituel est une libération intérieure guidée par Noctura : déparasitage, apaisement et transformation durable dans un espace sacré.',
  slug: 'soin-rituel',
  h1: 'Soin Rituel',
  intro: 'Le soin rituel t’accueille pour déposer ce qui pèse.',
  bodyText,
  imageAlts: ['Noctura guidant le soin rituel', 'Questions fréquentes'],
  faqCount: 3,
});
assert.ok(good.score >= 90, `score attendu >= 90, obtenu ${good.score}`);
assert.equal(scoreLabel(good.score).tone, 'good');
// Le check du mot-clé dans le titre doit être au vert.
assert.equal(good.checks.find((c) => c.id === 'keyword-in-title')?.status, 'good');

// --- Sans mot-clé → score faible + check « mot-clé défini » au rouge ---
const bad = analyzeSeo({
  focusKeyword: '',
  metaTitle: 'Page',
  metaDescription: 'Courte.',
  slug: 'page',
  h1: 'Page',
  intro: 'Texte.',
  bodyText: 'Texte court.',
  imageAlts: [],
  faqCount: 0,
});
assert.ok(bad.score < 50, `score attendu < 50, obtenu ${bad.score}`);
assert.equal(bad.checks.find((c) => c.id === 'keyword-set')?.status, 'bad');
assert.equal(scoreLabel(bad.score).tone, 'bad');

// Le score est borné 0–100.
assert.ok(good.score <= 100 && bad.score >= 0);

console.log('seo-analysis tests passed');
