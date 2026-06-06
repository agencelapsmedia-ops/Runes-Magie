/**
 * Conversion WebP haute qualité (visuellement identique à l'original).
 *
 * Périmètre volontairement ciblé : on ne convertit que les images « décor »
 * qui apportent un vrai gain :
 *   - hero-8 : fond CSS photographique → NON optimisé par next/image (donc à
 *     convertir nous-mêmes), encodage lossy q80 (aucune perte visible).
 *   - logos PNG : gros fichiers à transparence/contours nets → WebP nearLossless.
 *
 * On NE convertit PAS les JPEG photo de /about : ils sont déjà bien compressés
 * et servis via next/image, qui les délivre automatiquement en AVIF/WebP.
 * On NE touche PAS aux images produits (chemins stockés en base de données).
 *
 * Usage : node scripts/convert-to-webp.mjs
 */
import sharp from 'sharp';
import { stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// type 'photo'  → WebP lossy haute qualité (q80, visuellement identique)
// type 'graphic'→ WebP nearLossless (logos, transparence, contours nets)
const FILES = [
  { rel: 'public/images/hero/hero-8.png', type: 'photo' },
  { rel: 'public/images/logo/logo-3d-gold.png', type: 'graphic' },
  { rel: 'public/images/logo/logo-cat-gold.png', type: 'graphic' },
];

const kb = (n) => `${(n / 1024).toFixed(0)} Ko`;

let beforeTotal = 0;
let afterTotal = 0;

for (const { rel, type } of FILES) {
  const src = path.join(ROOT, rel);
  const out = src.replace(/\.(png|jpe?g)$/i, '.webp');
  try {
    const { size: before } = await stat(src);
    const opts =
      type === 'graphic'
        ? { nearLossless: true, quality: 90, effort: 6 }
        : { quality: 80, effort: 6, smartSubsample: true };
    await sharp(src).webp(opts).toFile(out);
    const { size: after } = await stat(out);
    beforeTotal += before;
    afterTotal += after;
    await unlink(src); // refs mises à jour dans le code → original inutile
    const pct = (100 * (1 - after / before)).toFixed(0);
    console.log(`✓ ${rel}  ${kb(before)} → ${kb(after)}  (-${pct}%)`);
  } catch (e) {
    console.error(`✗ ${rel} : ${e.message}`);
    process.exitCode = 1;
  }
}

console.log(
  `\nTotal : ${kb(beforeTotal)} → ${kb(afterTotal)}  ` +
    `(-${(100 * (1 - afterTotal / beforeTotal)).toFixed(0)}%, ` +
    `${kb(beforeTotal - afterTotal)} économisés)`,
);
