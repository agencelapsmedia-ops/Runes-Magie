/**
 * Recherche des photos de minéraux SOUS LICENCE LIBRE sur Wikimedia Commons.
 *
 *   node scripts/photos-commons.mjs            → recherche + rapport, rien de téléchargé
 *   node scripts/photos-commons.mjs --download  → télécharge et convertit en WebP
 *
 * Ne retient QUE les licences réutilisables commercialement (domaine public,
 * CC0, CC-BY, CC-BY-SA). Toute image sans licence claire est écartée.
 * L'auteur et la licence sont conservés pour l'attribution.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import sharp from 'sharp';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'RunesEtMagie-Boutique/1.0 (https://www.runesetmagie.ca; info@runesetmagie.com)';
const DL = process.argv.includes('--download');
const OUT = 'scripts/_photos';

// slug produit -> terme de recherche anglais (Commons est majoritairement anglophone)
const TERMES = {
  'agate': 'agate slice polished',
  'agate-druse': 'agate geode druzy',
  'agate-naturelle-druse': 'agate geode crystal',
  'ammonite-fossile': 'ammonite fossil polished',
  'apatite-bleue': 'blue apatite crystal',
  'aragonite-bleue': 'aragonite mineral',
  'aura-quartz': 'aura quartz titanium',
  'aventurine': 'aventurine mineral green',
  'aventurine-quartz': 'aventurine quartz',
  'chalcopyrite-de-paon': 'chalcopyrite peacock ore',
  'chrysocolle-malachite': 'chrysocolla malachite',
  'cornaline': 'carnelian mineral',
  'jais': 'jet lignite gemstone',
  'jaspe-bourdon': 'bumblebee jasper',
  'jaspe-mosaique': 'brecciated jasper',
  'malachite': 'malachite mineral polished',
  'merlinite': 'dendritic agate merlinite',
  'nakauriite-glacierite': 'nakauriite mineral',
  'onyx-noir-et-rouge': 'onyx banded mineral',
  'or-du-guerisseur': 'pyrite magnetite healers gold',
  'pierre-de-lune-arc-en-ciel': 'rainbow moonstone',
  'pierre-de-prophetie-egyptienne': 'prophecy stone hematite',
  'pierre-de-sang': 'bloodstone heliotrope mineral',
  'pyrite': 'pyrite crystal mineral',
  'quartz-clair': 'rock crystal quartz clear',
  'quartz-fume': 'smoky quartz crystal',
  'quartz-lemurien': 'lemurian quartz crystal',
  'quartz-lithium': 'lithium quartz crystal',
  'quartz-rose': 'rose quartz mineral',
  'quartz-rose-aura': 'rose aura quartz',
  'quartz-rose-lavande': 'lavender rose quartz',
  'quartz-tourmaline': 'tourmalinated quartz',
  'rhodonite': 'rhodonite mineral polished',
  'rubis-fuschite': 'ruby fuchsite',
  'septaria': 'septarian nodule concretion',
  'shungite': 'shungite mineral',
  'sodalite': 'sodalite mineral blue',
};

const LIBRE = /^(cc0|cc[- ]by([- ]sa)?([- ][\d.]+)?|public domain|pd(-|$)|no restrictions)/i;

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params })}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} sur ${params.gsrsearch ?? params.titles}`);
  return r.json();
}

async function chercher(terme) {
  const j = await api({
    action: 'query', generator: 'search', gsrsearch: `${terme} filetype:bitmap`,
    gsrnamespace: '6', gsrlimit: '12',
    prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: '1600',
  });
  const pages = Object.values(j.query?.pages ?? {});
  const ok = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const md = ii.extmetadata ?? {};
    const lic = (md.LicenseShortName?.value ?? '').replace(/<[^>]+>/g, '').trim();
    const auteur = (md.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim().slice(0, 80);
    if (!LIBRE.test(lic)) continue;
    if ((ii.width ?? 0) < 700) continue;
    ok.push({
      titre: p.title, url: ii.thumburl ?? ii.url, page: ii.descriptionurl,
      licence: lic, auteur: auteur || 'inconnu', w: ii.width, h: ii.height,
    });
  }
  // privilégie les images proches du carré et bien définies
  ok.sort((a, b) => Math.abs(a.w / a.h - 1) - Math.abs(b.w / b.h - 1));
  return ok;
}

const res = {};
const echecs = [];
for (const [slug, terme] of Object.entries(TERMES)) {
  try {
    const c = await chercher(terme);
    if (!c.length) { echecs.push(slug); console.log(`  ✗ ${slug.padEnd(32)} aucune image libre`); continue; }
    res[slug] = c[0];
    console.log(`  ✓ ${slug.padEnd(32)} ${c[0].licence.padEnd(14)} ${c[0].w}x${c[0].h}  ${c[0].auteur.slice(0, 30)}`);
  } catch (e) {
    echecs.push(slug); console.log(`  ! ${slug.padEnd(32)} ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 350)); // courtoisie envers l'API
}

console.log(`\n${Object.keys(res).length} trouvées · ${echecs.length} sans résultat libre`);
if (echecs.length) console.log('sans image :', echecs.join(', '));
writeFileSync('scripts/_photos-trouvees.json', JSON.stringify(res, null, 1), 'utf-8');

if (!DL) { console.log('\nRecherche seule. Relancer avec --download pour télécharger.'); process.exit(0); }

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
let n = 0;
const rates = [];
for (const [slug, p] of Object.entries(res)) {
  if (existsSync(`${OUT}/${slug}.webp`)) { n++; continue; }   // déjà fait
  try {
    await new Promise((r) => setTimeout(r, 600));   // évite le bridage de Wikimedia
    const r = await fetch(p.url, { headers: { 'User-Agent': UA, Accept: 'image/*' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.startsWith('image/')) throw new Error(`réponse non-image (${ct})`);
    const buf = Buffer.from(await r.arrayBuffer());
    await sharp(buf)
      .resize(1200, 1200, { fit: 'cover', position: 'attention' })
      .webp({ quality: 82 })
      .toFile(`${OUT}/${slug}.webp`);
    n++;
    console.log(`  ${slug}.webp`);
  } catch (e) {
    rates.push(slug);
    console.log(`  ! ${slug} — ${e.message.slice(0, 60)}`);
  }
}
if (rates.length) console.log('\néchecs de conversion :', rates.join(', '));
console.log(`\n${n} images converties en WebP 1200x1200 dans ${OUT}/`);
