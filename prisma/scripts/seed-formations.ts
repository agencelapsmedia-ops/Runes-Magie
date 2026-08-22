/**
 * Seed des programmes de formation (module Formations avec Noctura).
 * Source de vérité : Vault Obsidian « Runes et Magie » —
 *   « Formation Complète Runes Futhark.md » (Document No.RF0)
 *   « Formation Complète Tarot Pratique.md » (Code TP00)
 * Idempotent : upsert par (formation, code). Relançable sans doublon.
 *   npx tsx prisma/scripts/seed-formations.ts
 */
import { prisma } from '../../src/lib/db';

type CourseSeed = {
  code: string;
  title: string;
  summary?: string;
  session: number;
  isExam?: boolean;
  countsAsCredit?: boolean;
  isSpecializationSlot?: boolean;
  isOptional?: boolean;
};

const RUNES: CourseSeed[] = [
  { code: 'RF01', title: 'Introduction à la formation sur les Runes Futhark & l’Art divinatoire', session: 1 },
  { code: 'RF02', title: 'Histoire & Origines des Runes Futhark', session: 1 },
  { code: 'RF03', title: 'TCA — Tronc commun Alchimie Spirituelle (4 Éléments)', session: 1 },
  { code: 'RF04', title: 'Mythologie & Invocation/Canalisation', session: 1 },
  { code: 'RF05', title: 'Temple de l’Eau / Laguz', session: 1 },
  { code: 'RF06', title: 'Temple de l’Eau / Berkana / Gebo', session: 1 },
  { code: 'RF07', title: 'Temple de l’Eau / Manaz / Isa', session: 1 },
  { code: 'RF08', title: 'Temple du Feu / Kenaz', session: 1 },
  { code: 'RF09', title: 'Temple du Feu / Thurisaz / Sowilo', session: 1 },
  { code: 'RF10', title: 'Temple du Feu / Tiwaz / Inguz', session: 1 },
  {
    code: 'RF11', title: 'Examen Théorique & Pratique — Première session', session: 1,
    summary: 'Temple de l’Eau & Temple de Terre, Alchimie spirituelle, Tirage. Inclus dans la banque de 10 cours.',
    isExam: true, countsAsCredit: false,
  },
  { code: 'RF12', title: 'Temple de l’Air / Ansuz', session: 2 },
  { code: 'RF13', title: 'Temple de l’Air / Ehwaz / Raido', session: 2 },
  { code: 'RF14', title: 'Temple de l’Air / Hagalaz / Wunjo', session: 2 },
  { code: 'RF15', title: 'Temple de Terre / Uruz', session: 2 },
  { code: 'RF16', title: 'Temple de Terre / Fehu / Othila', session: 2 },
  { code: 'RF17', title: 'Temple de Terre / Jera / Nauthiz', session: 2 },
  { code: 'RF18', title: 'Temple de l’Éther / Algiz', session: 2 },
  { code: 'RF19', title: 'Temple de l’Éther / Eihwaz / Perthro', session: 2 },
  { code: 'RF20', title: 'Temple de l’Éther / Dagaz / Wyrd', session: 2 },
  { code: 'RF21', title: 'Fabrication des 5 Runes guides', session: 2 },
  {
    code: 'RF22', title: 'Examen Théorique & Pratique — Deuxième session', session: 2,
    summary: 'Temple de l’Air & Temple de Terre, Tirage. Inclus dans la banque de 10 cours.',
    isExam: true, countsAsCredit: false,
  },
  { code: 'RF23', title: 'Yoga runique (Yoga débutant, détente & Canalisation)', session: 3 },
  { code: 'RF24', title: 'Organisation des 5 Temples, Vision personnelle finale', session: 3 },
  {
    code: 'RF25', title: 'Examen Final & Entier sur la matière complète', session: 3,
    summary: 'Inclus dans la banque de 10 cours.', isExam: true, countsAsCredit: false,
  },
  { code: 'RF26', title: 'Cours de spécialisation au choix (1/5)', session: 3, isSpecializationSlot: true },
  { code: 'RF27', title: 'Cours de spécialisation au choix (2/5)', session: 3, isSpecializationSlot: true },
  { code: 'RF28', title: 'Cours de spécialisation au choix (3/5)', session: 3, isSpecializationSlot: true },
  { code: 'RF29', title: 'Cours de spécialisation au choix (4/5)', session: 3, isSpecializationSlot: true },
  { code: 'RF30', title: 'Cours de spécialisation au choix (5/5)', session: 3, isSpecializationSlot: true },
  // Options de spécialisation (données, pas de hardcode UI) :
  { code: 'RF-OPT-TAROT', title: 'Tarot Pratique & Runes Futhark (Associations)', session: 3, isOptional: true },
  { code: 'RF-OPT-KABBALE', title: 'Voie de la Kabbale', session: 3, isOptional: true },
  { code: 'RF-OPT-RITUEL', title: 'Bases d’un Rituel (Magie Naturelle, 4 piliers élémentaux)', session: 3, isOptional: true },
  { code: 'RF-OPT-DONS', title: 'Dons psychiques (5 cours pratiques)', session: 3, isOptional: true },
  { code: 'RF-OPT-EGYPTE', title: 'Divinités Égyptiennes & Invocation', session: 3, isOptional: true },
];

const TAROT: CourseSeed[] = [
  { code: 'TP00', title: 'Introduction au Tarot', summary: 'Introduction à la formation et résumé des lames majeures.', session: 1 },
  { code: 'TP01', title: 'Histoire du Tarot', session: 1 },
  { code: 'TP02', title: 'Principes du Tarologue', session: 1 },
  { code: 'TP03', title: 'Le Fou -0- & le Magicien -1-', session: 1 },
  { code: 'TP04', title: 'La Grande Prêtresse -2- & l’Impératrice -3-', session: 1 },
  { code: 'TP05', title: 'L’Empereur -4- & le Hiérophante/Pape -5-', session: 1 },
  { code: 'TP06', title: 'Les Amoureux -6- & le Chariot -7-', session: 1 },
  { code: 'TP07', title: 'La Force -8- & l’Ermite -9-', session: 1 },
  { code: 'TP08', title: 'La Roue de Fortune -10- & la Justice -11-', session: 1 },
  { code: 'TP09', title: 'Le Pendu -12- & la Mort -13-', session: 1 },
  {
    code: 'TP-E1', title: 'Examen Théorique & Pratique — Fin de la 1re session', session: 1,
    summary: 'Lames 0 à 13, tirage avec significateur (Carte Focus) & 3 lames. Inclus dans la banque de 10 cours.',
    isExam: true, countsAsCredit: false,
  },
  { code: 'TP10', title: 'La Tempérance -14- & le Diable -15-', session: 2 },
  { code: 'TP11', title: 'La Tour -16- & l’Étoile -17-', session: 2 },
  { code: 'TP12', title: 'La Lune -18- & le Soleil -19-', session: 2 },
  { code: 'TP13', title: 'Le Jugement -20- & le Monde -21-', session: 2 },
  {
    code: 'TP-E2', title: 'Examen complet sur les Lames Majeures', session: 2,
    summary: 'Remise de diplôme du volet Lames Majeures s’il y a réussite.', isExam: true, countsAsCredit: false,
  },
  { code: 'TP15', title: 'Introduction aux lames mineures / TCA — Tronc commun Alchimie spirituelle (4 éléments)', session: 2 },
  { code: 'TP16', title: 'Lames mineures en Coupe (Première partie)', summary: 'Élément Eau, As des Coupes.', session: 2 },
  { code: 'TP17', title: 'Lames mineures en Coupe (Deuxième partie)', summary: 'Lames 2 à 10, tirage émotif et féminin.', session: 2 },
  { code: 'TP18', title: 'Lames mineures en Coupe (Troisième partie)', summary: 'Valet, Cavalier, Reine, Roi.', session: 2 },
  { code: 'TP19', title: 'Lames mineures en Denier (Première partie)', summary: 'Élément Terre, As des Deniers.', session: 2 },
  { code: 'TP20', title: 'Lames mineures en Denier (Deuxième partie)', summary: 'Lames 2 à 10, tirage matériel.', session: 2 },
  {
    code: 'TP-E3', title: 'Examen Théorique & Pratique — Fin de la 2e session', session: 2,
    summary: 'Les 10 derniers cours, tirage des 4 Éléments avec Carte Focus. Inclus dans la banque de 10 cours.',
    isExam: true, countsAsCredit: false,
  },
  { code: 'TP21', title: 'Lames mineures en Denier (Troisième partie)', summary: 'Valet, Cavalier, Reine, Roi — structure, force, enracinement.', session: 3 },
  { code: 'TP22', title: 'Lames mineures en Épée (Première partie)', summary: 'Élément Air, As des Épées, athamé.', session: 3 },
  { code: 'TP23', title: 'Lames mineures en Épée (Deuxième partie)', summary: 'Lames 2 à 10, tirage mental.', session: 3 },
  { code: 'TP24', title: 'Lames mineures en Épée (Troisième partie)', summary: 'Valet, Cavalier, Reine, Roi — logique, communication.', session: 3 },
  { code: 'TP25', title: 'Lames mineures en Bâton (Première partie)', summary: 'Élément Feu, As des Bâtons, bougeoir/porte-lampion.', session: 3 },
  { code: 'TP26', title: 'Lames mineures en Bâton (Deuxième partie)', summary: 'Lames 2 à 10, tirage créatif et solaire.', session: 3 },
  { code: 'TP27', title: 'Lames mineures en Bâton (Troisième partie)', summary: 'Valet, Cavalier, Reine, Roi — courage, création, masculin sacré.', session: 3 },
  {
    code: 'TP28', title: 'Examen théorique final & Pratique', session: 3,
    summary: 'Note sur 5 points : technique personnalisée, connaissance des arcanes majeurs, interprétation divinatoire, type de tirage personnalisé, état d’esprit du tarologue.',
    isExam: true,
  },
  { code: 'TP29', title: 'Cours bonus au choix (1/2)', session: 3, isSpecializationSlot: true },
  { code: 'TP30', title: 'Cours bonus au choix (2/2)', session: 3, isSpecializationSlot: true },
  { code: 'TP-OPT-DONS', title: 'Dons psychiques', session: 3, isOptional: true },
  { code: 'TP-OPT-RUNES', title: 'Runes Futhark & Tarot', session: 3, isOptional: true },
  { code: 'TP-OPT-EGYPTE', title: 'Divinités égyptiennes & Invocation/Canalisation', session: 3, isOptional: true },
];

async function seedFormation(
  code: string,
  title: string,
  subtitle: string,
  courses: CourseSeed[],
) {
  const formation = await prisma.formation.upsert({
    where: { code },
    create: { code, title, subtitle },
    update: { title, subtitle },
  });
  let sortOrder = 0;
  for (const c of courses) {
    sortOrder += 10;
    await prisma.formationCourse.upsert({
      where: { formationId_code: { formationId: formation.id, code: c.code } },
      create: {
        formationId: formation.id,
        code: c.code,
        title: c.title,
        summary: c.summary ?? '',
        sessionNumber: c.session,
        sortOrder: c.isOptional ? 9000 + sortOrder : sortOrder,
        isExam: c.isExam ?? false,
        countsAsCredit: c.countsAsCredit ?? true,
        isSpecializationSlot: c.isSpecializationSlot ?? false,
        isOptional: c.isOptional ?? false,
        // Jalons hors décompte : examens Tarot non numérotés (TP-E1/E2/E3).
        countsInProgress: !c.code.startsWith('TP-E'),
      },
      update: {
        title: c.title,
        summary: c.summary ?? '',
        sessionNumber: c.session,
        isExam: c.isExam ?? false,
        countsAsCredit: c.countsAsCredit ?? true,
        isSpecializationSlot: c.isSpecializationSlot ?? false,
        isOptional: c.isOptional ?? false,
      },
    });
  }
  console.log(`${code} — ${title} : ${courses.length} cours en base.`);
}

async function main() {
  await seedFormation('RF', 'Les Runes de l’Ancien Futhark', 'Formation complète avec Noctura', RUNES);
  await seedFormation('TP', 'Le Tarot Pratique', 'Formation complète avec Noctura', TAROT);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
