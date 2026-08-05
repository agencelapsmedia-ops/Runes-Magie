/**
 * Téléverse les photos libres de droits sur Supabase et les assigne aux produits,
 * avec descriptions et méta-descriptions.
 *
 *   node scripts/photos-appliquer.mjs           → simulation
 *   node scripts/photos-appliquer.mjs --apply   → écrit
 *
 * L'attribution (auteur + licence) est stockée dans le champ `content` du produit :
 * les licences CC-BY et CC-BY-SA l'exigent.
 */
import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
// Ne lit QUE les deux clés Supabase. Prisma charge .env de son côté : y toucher
// corrompt DATABASE_URL (mots de passe à caractères spéciaux).
const BESOIN = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
// ⚠️ .env.local contient une clé anon INVALIDE (HTTP 400 sur l'API storage).
// On lit .env en dernier pour qu'il gagne. À corriger dans .env.local.
for (const f of ['.env.local', '.env']) {
  if (!existsSync(f)) continue;
  for (const l of readFileSync(f, 'utf-8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && BESOIN.includes(m[1])) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const photos = JSON.parse(readFileSync('scripts/_photos-trouvees.json', 'utf-8'));

// Descriptions : factuelles et évocatrices. Aucune promesse de guérison,
// aucune allégation thérapeutique — conformément à la ligne de la maison.
const D = {
  'agate': ["Tranche d'agate polie", "Agate naturelle tranchée et polie, révélant ses bandes concentriques uniques. Chaque pièce est différente."],
  'agate-druse': ["Agate à druse, double pointe", "Agate creusée d'une druse de micro-cristaux scintillants, taillée en double pointe. Pièce unique."],
  'agate-naturelle-druse': ["Agate naturelle à druse", "Géode d'agate ouverte sur son cœur cristallin. Une pièce de caractère, façonnée par le temps."],
  'ammonite-fossile': ["Ammonite fossile polie", "Fossile d'ammonite poli, spirale figée depuis des millions d'années. Un objet d'histoire naturelle autant que de collection."],
  'apatite-bleue': ["Apatite bleue, pointe", "Pointe d'apatite d'un bleu franc et lumineux. Minéral phosphaté aux teintes marines."],
  'aragonite-bleue': ["Aragonite bleue brute", "Aragonite brute aux nuances bleutées, laissée dans son état naturel."],
  'aventurine': ["Aventurine, pierre roulée", "Aventurine verte polie, parcourue de paillettes micacées qui accrochent la lumière."],
  'aventurine-quartz': ["Aventurine sur quartz, bâton sceptre", "Bâton sceptre d'aventurine et quartz monté sur support métal. Pièce de présentation."],
  'chalcopyrite-de-paon': ["Chalcopyrite de paon brute", "Chalcopyrite aux irisations bleues, violettes et dorées — le minerai dit « de paon »."],
  'chrysocolle-malachite': ["Chrysocolle et malachite, forme libre", "Association naturelle de chrysocolle et de malachite, taillée en forme libre. Turquoise et vert profond."],
  'cornaline': ["Cornaline, pierre roulée", "Cornaline polie, calcédoine orangée aux tons chauds et translucides."],
  'jais': ["Jais, pierre roulée", "Jais poli, d'un noir profond et mat. Matière organique fossilisée, légère au toucher."],
  'jaspe-bourdon': ["Jaspe bourdon, pointe", "Jaspe bourdon aux bandes jaunes et noires caractéristiques. Taillé en pointe."],
  'jaspe-mosaique': ["Jaspe mosaïque, pointe", "Jaspe bréchique aux fragments assemblés naturellement, comme une mosaïque de pierre."],
  'malachite': ["Malachite", "Malachite aux bandes vertes concentriques, polie pour révéler son dessin."],
  'nakauriite-glacierite': ["Nakauriite (glacierite)", "Nakauriite, dite glacierite, aux teintes bleu glacier. Minéral rare et peu commun en boutique."],
  'onyx-noir-et-rouge': ["Onyx noir et rouge, cœur à druse", "Onyx noir et rouge taillé en cœur, ouvert sur une druse cristalline."],
  'pierre-de-lune-arc-en-ciel': ["Pierre de lune arc-en-ciel, pointe", "Pierre de lune aux reflets adulescents bleutés qui se déplacent avec la lumière."],
  'pierre-de-sang': ["Pierre de sang, pointe", "Héliotrope vert sombre moucheté de rouge. Une des calcédoines les plus reconnaissables."],
  'pyrite': ["Pyrite brute", "Pyrite brute aux cubes métalliques dorés — « l'or des fous ». Éclat franc et arêtes nettes."],
  'quartz-clair': ["Quartz clair, pointe brute", "Pointe de quartz clair non traitée, à la transparence naturelle."],
  'quartz-fume': ["Quartz fumé", "Quartz fumé aux teintes brunes translucides, du miel clair au brun profond."],
  'quartz-lithium': ["Quartz lithium, pointe brute", "Quartz aux inclusions lilas de lithium, en pointe brute non retouchée."],
  'quartz-rose': ["Quartz rose", "Quartz rose au rose laiteux et doux, poli pour révéler sa translucidité."],
  'quartz-rose-lavande': ["Quartz rose lavande, pointe moyenne", "Quartz rose aux nuances lavande, plus rare que le rose franc. Pointe moyenne."],
  'quartz-tourmaline': ["Quartz tourmaline", "Quartz traversé d'aiguilles noires de tourmaline. Le contraste est saisissant."],
  'rhodonite': ["Rhodonite", "Rhodonite rose veinée de noir manganèse, polie."],
  'rubis-fuschite': ["Rubis sur fuchsite, pierre de paume", "Cristaux de rubis rouge enchâssés dans une fuchsite vert vif. Pierre de paume."],
  'septaria': ["Septaria, pierre de paume", "Nodule de septaria aux veines de calcite dorée dessinant un réseau. Pierre de paume."],
  'shungite': ["Shungite, pierre roulée", "Shungite polie, carbone noir mat de Carélie. Légère et profondément sombre."],
  'sodalite': ["Sodalite, forme libre", "Sodalite bleu nuit veinée de blanc, taillée en forme libre."],
};

const majs = [];
const produits = await prisma.product.findMany({
  where: { tags: { has: 'lot-2026-08' }, image: '' },
  select: { id: true, slug: true, name: true, stone: true, format: true, tags: true },
});

const cache = new Map();
for (const p of produits) {
  const cle = p.stone ?? p.slug;
  const f = `scripts/_photos/${cle}.webp`;
  if (!existsSync(f) || !photos[cle]) continue;
  majs.push({ p, cle, f });
}

console.log(APPLY ? '>>> APPLY <<<\n' : '>>> SIMULATION <<<\n');
console.log(`${produits.length} produits sans image · ${majs.length} peuvent en recevoir une\n`);

let n = 0;
for (const { p, cle, f } of majs) {
  const src = photos[cle];
  const [titre, desc] = D[cle] ?? [p.name, ''];
  if (!APPLY) { console.log(`  ${p.name.padEnd(38)} <- ${cle}.webp  (${src.licence})`); continue; }

  let url = cache.get(cle);
  if (!url) {
    const buf = readFileSync(f);
    const nom = `cristaux/${cle}-${Date.now()}.webp`;
    const { error } = await sb.storage.from('products').upload(nom, buf, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (error) { console.log(`  ! ${cle} — ${error.message}`); continue; }
    url = sb.storage.from('products').getPublicUrl(nom).data.publicUrl;
    cache.set(cle, url);
  }

  const attribution = `Photo : ${src.auteur} — ${src.licence} — via Wikimedia Commons (${src.page})`;
  await prisma.product.update({
    where: { id: p.id },
    data: {
      image: url, images: [url],
      description: `${titre}${p.format ? ` — ${p.format.toLowerCase()}` : ''}. ${desc}`.slice(0, 300),
      longDescription: desc,
      content: attribution,
      tags: [...new Set([...p.tags, 'photo-libre-de-droits'])],
    },
  });
  console.log(`  ${p.name.padEnd(38)} OK`);
  n++;
}

if (APPLY) {
  const reste = await prisma.product.count({ where: { tags: { has: 'lot-2026-08' }, image: '' } });
  console.log(`\n${n} produits mis à jour · ${cache.size} images téléversées`);
  console.log(`${reste} produits toujours sans image`);
}
await prisma.$disconnect();
