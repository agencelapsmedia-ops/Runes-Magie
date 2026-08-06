/**
 * Pousse vers Clover les pierres importées le 4 août 2026.
 *
 * Contexte : le script d'import (`scripts/import-pierres-kheops.ts`, ligne 126)
 * a volontairement mis `syncToClover: false` — la poussée devait se faire dans
 * un second temps, après relecture. Ce second temps, c'est ici.
 *
 * Étapes :
 *   --essai            n'affiche que ce qui serait créé, n'écrit rien
 *   --marquer          passe syncToClover à true (sans pousser)
 *   --pousser [--max N] crée réellement les articles dans Clover
 *
 * Le bug « alternateName > 127 caractères » qui avait bloqué un envoi le 18 mai
 * est corrigé : `truncateForClover` (src/lib/clover.ts:332) tronque désormais.
 */
import { readFileSync, existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { tryCreateInClover, isCloverConfigured } from '../src/lib/clover-queue';

/**
 * Charge `.env.local` : contrairement à Next.js, un script `tsx` ne le lit pas
 * tout seul, et c'est là que vivent les identifiants Clover.
 * (Prisma lit `.env`, ce qui explique que la base fonctionne malgré tout.)
 */
function chargerEnvLocal() {
  const chemin = '.env.local';
  if (!existsSync(chemin)) return;
  for (const ligne of readFileSync(chemin, 'utf8').split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, cle] = m;
    let valeur = m[2].trim().replace(/^["']|["']$/g, '');
    valeur = valeur.replace(/\\n$/, ''); // certaines valeurs traînent un \n littéral
    if (!process.env[cle]) process.env[cle] = valeur;
  }
}
chargerEnvLocal();

const prisma = new PrismaClient();

/** Les produits importés le 4 août, identifiés par leur date de création. */
const CIBLE = { createdAt: { gte: new Date('2026-08-04T00:00:00Z') } };

async function main() {
  const args = process.argv.slice(2);
  const essai = args.includes('--essai');
  const marquer = args.includes('--marquer');
  const pousser = args.includes('--pousser');
  const iMax = args.indexOf('--max');
  const max = iMax >= 0 ? parseInt(args[iMax + 1], 10) : undefined;

  if (!essai && !marquer && !pousser) {
    console.log('Precisez --essai, --marquer ou --pousser [--max N]');
    return;
  }

  if (essai) {
    const l = await prisma.product.findMany({
      where: CIBLE,
      select: { name: true, price: true, sku: true, category: true, description: true, cloverId: true, syncToClover: true },
      orderBy: { name: 'asc' },
    });
    console.log(`ESSAI A BLANC — ${l.length} produits seraient envoyes a Clover.\n`);
    const parCat: Record<string, number> = {};
    let descLongues = 0;
    let sansSku = 0;
    for (const o of l) {
      parCat[o.category] = (parCat[o.category] ?? 0) + 1;
      if ((o.description ?? '').length > 127) descLongues++;
      if (!o.sku) sansSku++;
    }
    console.log('Par categorie :', JSON.stringify(parCat));
    console.log(`Descriptions de plus de 127 caracteres (seront tronquees) : ${descLongues}`);
    console.log(`Sans SKU : ${sansSku}`);
    console.log(`Deja dans Clover : ${l.filter((o) => o.cloverId).length}`);
    console.log('\n10 premiers :');
    l.slice(0, 10).forEach((o, i) =>
      console.log(`  ${String(i + 1).padStart(2)}. ${o.name.slice(0, 40).padEnd(42)} ${String(o.price).padStart(8)}$  sku:${o.sku ?? '-'}`),
    );
    return;
  }

  if (marquer) {
    const r = await prisma.product.updateMany({ where: CIBLE, data: { syncToClover: true } });
    console.log(`${r.count} produits marques « a synchroniser ».`);
    return;
  }

  if (pousser) {
    if (!isCloverConfigured()) {
      console.error('Clover non configure : CLOVER_MERCHANT_ID ou CLOVER_API_TOKEN manquant.');
      process.exitCode = 1;
      return;
    }
    const orphelins = await prisma.product.findMany({
      where: { ...CIBLE, syncToClover: true, cloverId: null },
      select: { id: true, name: true, price: true, sku: true, category: true, description: true },
      orderBy: { createdAt: 'asc' },
      ...(max ? { take: max } : {}),
    });
    console.log(`Envoi de ${orphelins.length} produits vers Clover...\n`);

    let crees = 0;
    const enFile: string[] = [];
    for (const p of orphelins) {
      const cloverId = await tryCreateInClover({
        productId: p.id,
        name: p.name,
        priceCents: Math.round(p.price * 100),
        sku: p.sku,
        category: p.category,
        description: p.description,
      });
      if (cloverId) {
        crees++;
        console.log(`  OK   ${p.name.slice(0, 44).padEnd(46)} -> ${cloverId}`);
      } else {
        enFile.push(p.name);
        console.log(`  FILE ${p.name.slice(0, 44).padEnd(46)} (mis en file d'attente)`);
      }
    }
    console.log(`\nCrees dans Clover : ${crees} | mis en file : ${enFile.length}`);
    const restants = await prisma.product.count({ where: { ...CIBLE, syncToClover: true, cloverId: null } });
    console.log(`Restant a envoyer : ${restants}`);
  }
}

main()
  .catch((e) => {
    console.error('ERREUR :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
