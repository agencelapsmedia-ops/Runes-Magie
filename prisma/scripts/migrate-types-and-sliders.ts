/**
 * Migration : « types » de services → catégories (hiérarchie 2 niveaux) + sliders.
 *
 *  Séances Rituels                 École de Sorcellerie
 *    ├─ Soin (SOIN)                  ├─ Cours (COURS)
 *    └─ Consultation (CONSULTATION)  └─ Atelier (ATELIER)
 *  Guidance & Tirages (GUIDANCE) · Cérémonies (CEREMONIE) · Services extérieurs (SERVICE_EXTERIEUR)
 *
 * - Pose `typeCode` sur les catégories « type » (pont vers Offering.type).
 * - Réassigne chaque Offering.categoryId selon son `type` actuel.
 * - Laisse `type` inchangé → /seances et /ecole continuent.
 * - Crée 2 HomeSliders (Séances Rituels, École) pour garder l'accueil identique.
 *
 * Idempotent (catégories trouvées par slug ; sliders créés seulement si aucun).
 * Lancer :  npx tsx prisma/scripts/migrate-types-and-sliders.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CatData = {
  name: string;
  emoji?: string;
  sortOrder: number;
  parentId: string | null;
  typeCode?: string | null;
  showOnHome?: boolean;
};

async function upsertCat(slug: string, data: CatData) {
  const existing = await prisma.serviceCategory.findUnique({ where: { slug } });
  if (existing) {
    return prisma.serviceCategory.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        emoji: data.emoji ?? existing.emoji,
        sortOrder: data.sortOrder,
        parentId: data.parentId,
        typeCode: data.typeCode ?? null,
        showOnHome: data.showOnHome ?? existing.showOnHome,
        isActive: true,
      },
    });
  }
  return prisma.serviceCategory.create({
    data: {
      slug,
      name: data.name,
      emoji: data.emoji ?? '',
      sortOrder: data.sortOrder,
      parentId: data.parentId,
      typeCode: data.typeCode ?? null,
      showOnHome: data.showOnHome ?? false,
      isActive: true,
    },
  });
}

async function main() {
  // ── Grandes catégories (1er niveau) ──
  const seances = await upsertCat('seances-rituels', { name: 'Séances Rituels', emoji: 'ᛊ', sortOrder: 10, parentId: null, showOnHome: true });
  const ecole = await upsertCat('ecole-de-sorcellerie', { name: 'École de Sorcellerie', emoji: 'ᚱ', sortOrder: 20, parentId: null, showOnHome: true });
  const guidance = await upsertCat('guidance-tirages', { name: 'Guidance & Tirages', emoji: 'ᚲ', sortOrder: 30, parentId: null, typeCode: 'GUIDANCE' });
  const ceremonies = await upsertCat('ceremonies', { name: 'Cérémonies', emoji: 'ᚷ', sortOrder: 40, parentId: null, typeCode: 'CEREMONIE' });
  const servicesExt = await upsertCat('services-exterieurs', { name: 'Services extérieurs', emoji: 'ᛏ', sortOrder: 50, parentId: null, typeCode: 'SERVICE_EXTERIEUR' });

  // ── Sous-catégories (2e niveau) ──
  const soin = await upsertCat('soin', { name: 'Soin', sortOrder: 10, parentId: seances.id, typeCode: 'SOIN' });
  const consultation = await upsertCat('consultation', { name: 'Consultation', sortOrder: 20, parentId: seances.id, typeCode: 'CONSULTATION' });
  const cours = await upsertCat('cours', { name: 'Cours', sortOrder: 10, parentId: ecole.id, typeCode: 'COURS' });
  const atelier = await upsertCat('atelier', { name: 'Atelier', sortOrder: 20, parentId: ecole.id, typeCode: 'ATELIER' });

  // ── Réassignation des services par type ──
  const mapping: Record<string, string> = {
    SOIN: soin.id,
    CONSULTATION: consultation.id,
    COURS: cours.id,
    ATELIER: atelier.id,
    GUIDANCE: guidance.id,
    CEREMONIE: ceremonies.id,
    SERVICE_EXTERIEUR: servicesExt.id,
  };
  for (const [type, categoryId] of Object.entries(mapping)) {
    const res = await prisma.offering.updateMany({ where: { type }, data: { categoryId } });
    console.log(`  ${type} → ${res.count} service(s) assigné(s)`);
  }
  const orphans = await prisma.offering.count({ where: { categoryId: null } });
  if (orphans > 0) console.log(`  ⚠ ${orphans} service(s) sans catégorie (type non mappé).`);

  // ── Sliders de l'accueil (seulement si aucun) ──
  const sliderCount = await prisma.homeSlider.count();
  if (sliderCount === 0) {
    await prisma.homeSlider.create({ data: { title: 'Séances Rituels', categoryIds: [seances.id], sortOrder: 10, isVisible: true } });
    await prisma.homeSlider.create({ data: { title: 'École de Sorcellerie', categoryIds: [ecole.id], sortOrder: 20, isVisible: true } });
    console.log('  2 sliders d\'accueil créés (Séances Rituels, École de Sorcellerie).');
  } else {
    console.log(`  ${sliderCount} slider(s) déjà présents — non recréés.`);
  }

  console.log('Migration terminée.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
