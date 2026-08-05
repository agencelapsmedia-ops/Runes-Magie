// Renomme les entrees de menu « Ecole de Sorcellerie » en « Ecole de Magie ».
// Le libelle du menu vient de la base (modele MenuItem), pas du code.
// Usage : npx tsx scripts/renommer-menu-ecole.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ANCIEN = "École de Sorcellerie";
const NOUVEAU = "École de Magie";

async function main() {
  const cibles = await prisma.menuItem.findMany({
    where: { label: ANCIEN },
    select: { id: true, label: true, location: true },
  });

  if (cibles.length === 0) {
    console.log(`Aucune entree « ${ANCIEN} » a renommer.`);
    return;
  }

  for (const item of cibles) {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: { label: NOUVEAU },
    });
    console.log(`[${item.location}] « ${item.label} » -> « ${NOUVEAU} »`);
  }

  console.log(`\n${cibles.length} entree(s) renommee(s).`);
}

main()
  .catch((e) => {
    console.error("ERREUR:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
