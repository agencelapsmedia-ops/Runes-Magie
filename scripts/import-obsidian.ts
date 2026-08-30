/**
 * Import de la matière première éditoriale depuis le vault Obsidian vers la
 * table ContentSource (Supabase). Idempotent : une note n'est réécrite que si
 * son contenu a changé (checksum sha256).
 *
 * Sans argument, importe le corpus Runes & Magie :
 *   - RUNES FUTHARK/LES 24 RUNES  → kind RUNE
 *   - MYTHOLOGIE NORDIQUE (récursif) → kind MYTHOLOGIE
 *
 * Générique pour d'autres marques :
 *   npm run db:import:corpus -- --org ma-marque --dir "C:\chemin\notes" --kind LIBRE
 *
 * Options : --vault "C:\...\WYRD AI" (racine du vault, défaut machine de Jonathan)
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KINDS = ['RUNE', 'MYTHOLOGIE', 'PRODUIT', 'LIBRE'];
const VAULT_DEFAUT = 'C:\\Users\\Admin\\Obsidian\\WYRD AI';
const RM = '10-ENTREPRISES\\Runes-et-Magie';

/** Fichiers ignorés : notes d'index (nom = nom du dossier parent) et annexes. */
const EXCLUS = new Set(['sources et bibliographie']);

interface Arguments {
  org: string | null;
  dir: string | null;
  kind: string;
  vault: string;
}

function lireArgs(): Arguments {
  const a = process.argv.slice(2);
  const val = (nom: string): string | null => {
    const i = a.indexOf(`--${nom}`);
    return i >= 0 && a[i + 1] ? a[i + 1] : null;
  };
  return {
    org: val('org'),
    dir: val('dir'),
    kind: (val('kind') ?? 'LIBRE').toUpperCase(),
    vault: val('vault') ?? VAULT_DEFAUT,
  };
}

/** Parse le frontmatter YAML simple d'Obsidian (clé: valeur, listes [a, b]). */
function parserFrontmatter(brut: string): { frontmatter: Record<string, unknown>; corps: string } {
  const m = brut.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { frontmatter: {}, corps: brut };
  const frontmatter: Record<string, unknown> = {};
  for (const ligne of m[1].split(/\r?\n/)) {
    const kv = ligne.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const cle = kv[1];
    let valeur: unknown = kv[2].trim();
    if (typeof valeur === 'string') {
      if (/^\[.*\]$/.test(valeur)) {
        valeur = valeur
          .slice(1, -1)
          .split(',')
          .map((x) => x.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        valeur = valeur.replace(/^["']|["']$/g, '');
      }
    }
    if (valeur !== '') frontmatter[cle] = valeur;
  }
  return { frontmatter, corps: brut.slice(m[0].length) };
}

/** Aplati les wikilinks Obsidian : [[Cible|Alias]] → Alias, [[Cible]] → Cible. */
function aplatirWikilinks(texte: string): string {
  return texte.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
}

function slugifier(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function listerNotes(dossier: string): string[] {
  const resultats: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      resultats.push(...listerNotes(chemin));
    } else if (entree.toLowerCase().endsWith('.md')) {
      const nom = basename(entree, '.md');
      const parent = basename(dirname(chemin));
      if (nom.toLowerCase() === parent.toLowerCase()) continue; // note d'index du dossier
      if (EXCLUS.has(nom.toLowerCase())) continue;
      resultats.push(chemin);
    }
  }
  return resultats;
}

async function importerDossier(org: string, kind: string, dossier: string) {
  const fichiers = listerNotes(dossier);
  let crees = 0;
  let maj = 0;
  let inchanges = 0;

  for (const fichier of fichiers) {
    const brut = readFileSync(fichier, 'utf8');
    const { frontmatter, corps } = parserFrontmatter(brut);
    const title = basename(fichier, '.md');
    const slug = slugifier(title);
    const body = aplatirWikilinks(corps).trim();
    const checksum = createHash('sha256')
      .update(JSON.stringify({ title, frontmatter, body }))
      .digest('hex');

    const existante = await prisma.contentSource.findUnique({
      where: { organizationId_kind_slug: { organizationId: org, kind, slug } },
    });

    if (!existante) {
      await prisma.contentSource.create({
        data: {
          organizationId: org,
          kind,
          slug,
          title,
          frontmatter: JSON.parse(JSON.stringify(frontmatter)),
          body,
          checksum,
        },
      });
      crees++;
    } else if (existante.checksum !== checksum) {
      await prisma.contentSource.update({
        where: { id: existante.id },
        data: { title, frontmatter: JSON.parse(JSON.stringify(frontmatter)), body, checksum },
      });
      maj++;
    } else {
      inchanges++;
    }
  }

  console.log(
    `  ${kind.padEnd(11)} ${dossier}\n    → ${crees} créée(s), ${maj} mise(s) à jour, ${inchanges} inchangée(s)`,
  );
}

async function main() {
  const args = lireArgs();

  if (!KINDS.includes(args.kind)) {
    throw new Error(`--kind invalide (${args.kind}) — valeurs : ${KINDS.join(', ')}`);
  }

  if (args.org && args.dir) {
    console.log(`Import ${args.org} :`);
    await importerDossier(args.org, args.kind, args.dir);
  } else {
    console.log('Import du corpus Runes & Magie :');
    await importerDossier('runes-et-magie', 'RUNE', join(args.vault, RM, 'RUNES FUTHARK', 'LES 24 RUNES'));
    await importerDossier('runes-et-magie', 'MYTHOLOGIE', join(args.vault, RM, 'MYTHOLOGIE NORDIQUE'));
  }

  const total = await prisma.contentSource.count();
  console.log(`Total en base : ${total} notes de matière première.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
