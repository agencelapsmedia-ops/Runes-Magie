import { PrismaClient } from '@prisma/client';

/**
 * Crée les lignes SitePage des pages éditoriales du site.
 *
 * Idempotent et non destructif : une page déjà présente n'est jamais réécrite.
 * Le contenu personnalisé par la cliente depuis le pupitre est donc à l'abri,
 * même si le script est relancé par mégarde.
 *
 *   npm run db:seed:pages
 */
const prisma = new PrismaClient();

const PAGES = [
  {
    slug: 'ceremonies',
    title: 'Cérémonies & Animations privées',
    template: 'ceremonies',
    metaDescription:
      'Mariages, baptêmes, célébrations privées et animations de groupe : des cérémonies symboliques créées sur mesure par Runes & Magie, à Saint-Eustache.',
    sortOrder: 10,
    // Page structurelle : liée depuis l'accueil, ne doit pas disparaître par accident.
    isSystem: true,
  },
  {
    slug: 'herboristerie',
    title: 'Herboristerie',
    template: 'herboristerie',
    metaDescription:
      'L’herboristerie chez Runes & Magie : l’approche, les plantes alliées, la consultation, les formations et les herbes et encens de la boutique.',
    sortOrder: 20,
    isSystem: true,
  },
];

async function main() {
  for (const page of PAGES) {
    const existante = await prisma.sitePage.findUnique({
      where: { slug: page.slug },
      select: { id: true },
    });

    if (existante) {
      console.log(`=  ${page.slug} — déjà présente, contenu conservé`);
      continue;
    }

    await prisma.sitePage.create({ data: { ...page, content: {} } });
    console.log(`+  ${page.slug} — créée`);
  }
}

main()
  .catch((err) => {
    console.error('Échec du seed des pages :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
