import { PrismaClient } from '@prisma/client';

/**
 * Crée les tuiles de la grille de l'accueil.
 *
 * Idempotent et non destructif : une tuile déjà présente n'est jamais réécrite.
 * Les images téléversées et les textes modifiés par Annabelle survivent donc à
 * une relance du script.
 *
 *   npm run db:seed:tuiles
 */
const prisma = new PrismaClient();

const TUILES = [
  { slug: 'soins-rituels', title: 'Soins & Rituels', iconKey: 'lotus', href: '/seances', sortOrder: 10 },
  { slug: 'seances-tirage', title: 'Séances de Tirage', iconKey: 'cartes', href: '/seances', sortOrder: 20 },
  { slug: 'cours-formations', title: 'Cours & Formations', iconKey: 'livre', href: '/ecole', sortOrder: 30 },
  { slug: 'herboristerie', title: 'Herboristerie', iconKey: 'feuille', href: '/herboristerie', sortOrder: 40 },
  { slug: 'evenements', title: 'Événements', iconKey: 'calendrier', href: '/evenements', sortOrder: 50 },
  { slug: 'purification', title: 'Purification', iconKey: 'flamme', href: '/seances/purification-espace', sortOrder: 60 },
  { slug: 'ceremonies-privees', title: 'Cérémonies privées', iconKey: 'groupe', href: '/ceremonies', sortOrder: 70 },
  {
    slug: 'temple',
    title: 'Le Temple',
    subtitle: 'de la voie des arcanes',
    iconKey: 'temple',
    href: '/temple',
    sortOrder: 80,
  },
  {
    slug: 'boutique',
    title: 'Boutique',
    iconKey: 'sac',
    href: '/boutique',
    sortOrder: 90,
    variant: 'BANDE',
    // Repères visuels : ils mènent tous à la boutique, qui n'a pas de filtre
    // par URL. Le jour où elle en aura un, il suffira de remplir les `href`.
    chips: [
      { label: 'Pierres & cristaux', href: '/boutique', iconKey: 'cristal' },
      { label: 'Tarot & oracle', href: '/boutique', iconKey: 'tarot' },
      { label: 'Capteurs de rêves', href: '/boutique', iconKey: 'capteur-reves' },
      { label: 'Encens', href: '/boutique', iconKey: 'encens' },
      { label: 'Sauge', href: '/boutique', iconKey: 'sauge' },
      { label: 'Statuettes', href: '/boutique', iconKey: 'statuette' },
      { label: '& plus', href: '/boutique', iconKey: 'plus' },
    ],
  },
];

async function main() {
  for (const tuile of TUILES) {
    const existante = await prisma.homeTile.findUnique({
      where: { slug: tuile.slug },
      select: { id: true },
    });

    if (existante) {
      console.log(`=  ${tuile.slug} — déjà présente, contenu conservé`);
      continue;
    }

    await prisma.homeTile.create({ data: tuile });
    console.log(`+  ${tuile.slug} — créée`);
  }

  console.log(
    '\nLes images restent à téléverser depuis /admin/site/tuiles.\n' +
      'Les fichiers sont dans 02-PHOTOS/services/services 1080x1080/.',
  );
}

main()
  .catch((err) => {
    console.error('Échec du seed des tuiles :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
