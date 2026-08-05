/**
 * Import de l'inventaire Kheops (facture 107728, 2026-08-03) dans la boutique.
 *
 * Source : scripts/_import-pierres.json — généré depuis l'inventaire du vault
 * Obsidian (10-ENTREPRISES/Runes-et-Magie/Produits/), quantités et prix relevés
 * à la main par Jonathan après déballage.
 *
 *   npx tsx scripts/import-pierres-kheops.ts            → SIMULATION (aucune écriture)
 *   npx tsx scripts/import-pierres-kheops.ts --apply    → écrit en base
 *
 * ⚠️ La base pointée par .env est la PRODUCTION Supabase, et une création
 * pousse le produit vers Clover. Toujours passer par la simulation d'abord.
 *
 * Convention SKU : le site attribue un séquentiel 4 chiffres (voir lib/clover-sku).
 * Le code Kheops est conservé dans les tags sous la forme `kheops-52068` pour
 * pouvoir réapprovisionner.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

type Ligne = {
  nom: string; mineral: string; forme: string; slug: string;
  skuKheops: string; qte: number; cout: number | null;
  prix: number | null; accessoire: boolean;
};

const lignes: Ligne[] = JSON.parse(
  readFileSync(join(__dirname, '_import-pierres.json'), 'utf-8'),
);

function slugStone(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/w\//g, ' ').replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

(async () => {
  console.log(APPLY ? '\n>>> MODE APPLY — écriture en base <<<\n' : '\n>>> SIMULATION — aucune écriture <<<\n');

  const existants = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, price: true, category: true, sku: true, stockQuantity: true },
  });
  const parSlug = new Map(existants.map((p) => [p.slug, p]));
  const parNomNorm = new Map(existants.map((p) => [slugStone(p.name), p]));

  const aCreer: Ligne[] = [];
  const doublons: Array<{ l: Ligne; p: (typeof existants)[0] }> = [];   // même slug = vrai doublon, on bloque
  const homonymes: Array<{ l: Ligne; p: (typeof existants)[0] }> = [];  // même minéral, autre pièce : on crée mais on signale

  for (const l of lignes) {
    const parS = parSlug.get(l.slug);
    if (parS) { doublons.push({ l, p: parS }); continue; }
    const parN = parNomNorm.get(slugStone(l.mineral));
    if (parN) homonymes.push({ l, p: parN });
    aCreer.push(l);
  }

  console.log(`Lignes en entrée : ${lignes.length}`);
  console.log(`À créer          : ${aCreer.length}`);
  console.log(`Doublons bloqués : ${doublons.length}`);
  console.log(`Homonymes signalés : ${homonymes.length}\n`);

  if (doublons.length) {
    console.log('--- DOUBLONS (même slug) : NON créés, rien n\'est modifié ---');
    for (const { l, p } of doublons) {
      console.log(
        `  "${l.nom}"  ${l.qte} pcs @ ${l.prix} $\n` +
        `        existant : "${p.name}" (${p.slug}) sku ${p.sku} — prix ${p.price} $ — stock ${p.stockQuantity ?? 'non suivi'}`,
      );
    }
    console.log('  → À fusionner à la main : reprendre prix et stock sur le produit existant.\n');
  }

  if (homonymes.length) {
    console.log('--- HOMONYMES : même minéral déjà en boutique, mais autre pièce. Créés quand même ---');
    for (const { l, p } of homonymes) {
      console.log(`  "${l.nom}" ${l.prix} $   ≠ existant "${p.name}" ${p.price} $ (${p.slug})`);
    }
    console.log('  → Vérifier qu\'il s\'agit bien de pièces différentes.\n');
  }

  const valeur = aCreer.reduce((s, l) => s + (l.prix ?? 0) * l.qte, 0);
  console.log('--- À CRÉER ---');
  for (const l of aCreer) {
    console.log(
      `  ${l.slug.padEnd(40)} ${String(l.qte).padStart(3)} pcs  ${String(l.prix).padStart(7)} $  ` +
      `cat:${l.accessoire ? 'boutique' : 'cristaux'}  kheops-${l.skuKheops}`,
    );
  }
  console.log(`\n  ${aCreer.length} produits · ${aCreer.reduce((s, l) => s + l.qte, 0)} pièces · ${valeur.toFixed(2)} $ au détail`);

  const sansPrix = aCreer.filter((l) => !l.prix);
  if (sansPrix.length) console.log(`\n⚠️ ${sansPrix.length} sans prix — exclus de l'écriture.`);

  if (!APPLY) {
    console.log('\nSimulation terminée. Relancer avec --apply pour écrire.\n');
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  for (const l of aCreer) {
    if (!l.prix) continue;
    await prisma.product.create({
      data: {
        slug: l.slug,
        name: l.nom,
        price: l.prix,
        description: '',
        longDescription: '',
        category: l.accessoire ? 'boutique' : 'cristaux',
        subcategory: l.forme || null,
        stone: l.accessoire ? null : slugStone(l.mineral),
        format: l.forme || null,
        image: '',
        images: [],
        inStock: l.qte > 0,
        featured: false,
        tags: [`kheops-${l.skuKheops}`, 'lot-2026-08'],
        stockQuantity: l.qte,
        productType: 'PHYSICAL',
        syncToClover: false, // ⚠️ poussée Clover faite dans un second temps, après relecture
        checkoutType: 'stripe',
      },
    });
    ok++;
  }
  console.log(`\n${ok} produits créés. SKU et poussée Clover : étape suivante.\n`);
  await prisma.$disconnect();
})().catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });
