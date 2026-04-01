import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parsePrice(priceStr: string): number {
  const match = priceStr.match(/\$?([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function findImages(productName: string, productsDir: string): { image: string; images: string[] } {
  const files = fs.readdirSync(productsDir);
  const matching: string[] = [];

  // Chercher les fichiers qui commencent par le nom du produit (ou variante)
  const nameLower = productName.toLowerCase();
  const nameVariants = [
    nameLower,
    nameLower.replace(/['']/g, "'"),
    nameLower.replace(/ /g, '_'),
  ];

  for (const file of files) {
    const fileLower = file.toLowerCase();
    const ext = path.extname(fileLower);
    if (!['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) continue;
    if (fileLower.startsWith('screencapture')) continue;

    for (const variant of nameVariants) {
      // Match exact name or name with number suffix
      const fileBase = fileLower.replace(ext, '');
      if (fileBase === variant ||
          fileBase.startsWith(variant + ' ') ||
          fileBase.startsWith(variant + '_') ||
          fileBase.startsWith(variant.replace(/ /g, '_'))) {
        matching.push(`/images/products/${file}`);
        break;
      }
    }
  }

  if (matching.length === 0) {
    return { image: '/images/products/placeholder-tarot.jpg', images: [] };
  }

  // Trier: image principale d'abord (sans numéro), puis les autres
  matching.sort((a, b) => a.length - b.length);
  return { image: matching[0], images: matching };
}

interface TarotData {
  name: string;
  price: number;
  description: string;
  longDescription: string;
  inStock: boolean;
  tags: string[];
  image: string;
  images: string[];
}

async function main() {
  // Données des 22 tarots du Excel (lues par Python)
  const tarots: TarotData[] = [
    {
      name: "Le Tarot Interdit",
      price: 29.95,
      description: "78 cartes + livret de 344 pages par Nathaniel Dunhaven. Format 4.5\"L x 6\"H.",
      longDescription: "Le Tarot Interdit - Nathaniel Dunhaven\n\n78 cartes + livret de 344 pages\nFormat : 4.5\"L x 6\"H\nParution : Octobre 2024",
      inStock: true,
      tags: ['tarot', 'contes interdits', 'dunhaven', 'divination'],
      ...findImages('Le Tarot Interdit', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot Akashique",
      price: 34.95,
      description: "62 cartes + Guide d'accompagnement par Sharon A Klingler et Sandra Anne Taylor. ISBN 9782898030451.",
      longDescription: "Le Tarot Akashique - Sharon A Klingler / Sandra Anne Taylor\n\n62 cartes + Guide d'accompagnement\nISBN : 9782898030451",
      inStock: true,
      tags: ['tarot', 'akashique', 'klingler', 'taylor', 'divination'],
      ...findImages('Le Tarot akashique', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot des Anges",
      price: 9.95,
      description: "Jeu de tarot bienveillant par Doreen Virtue et Radleigh Valentine. ISBN 9782898088681.",
      longDescription: "Le Tarot des Anges - Doreen Virtue & Radleigh Valentine\n\nISBN : 9782898088681\n\nNote : En rupture de stock.",
      inStock: false,
      tags: ['tarot', 'anges', 'virtue', 'valentine', 'divination'],
      ...findImages('Le tarot des anges', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot de l'Ere du Verseau",
      price: 29.95,
      description: "78 cartes + livret de 344 pages par Luna Ravenheart. Format 4.5\"L x 6\"H. ISBN 9782898171185.",
      longDescription: "Le Tarot de l'Ere du Verseau - Luna Ravenheart\n\n78 cartes + livret de 344 pages\nFormat : 4.5\"L x 6\"H\nParution : Aout 2024\nISBN : 9782898171185",
      inStock: true,
      tags: ['tarot', 'verseau', 'ravenheart', 'divination'],
      ...findImages("Le Tarot de l'Ère du Verseau", path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot La Prophetie des Sorcieres",
      price: 29.95,
      description: "78 cartes + livret par Isabella Moretti. Format 4.5\"L x 6\"H.",
      longDescription: "Tarot - La Prophetie des Sorcieres - Isabella Moretti\n\n78 cartes + livret\nFormat : 4.5\"L x 6\"H",
      inStock: true,
      tags: ['tarot', 'sorcieres', 'prophetie', 'moretti', 'divination'],
      ...findImages('Tarot - La prophétie des sorcières', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot des Chamans de Lumiere",
      price: 29.95,
      description: "78 cartes + livret de 344 pages par Jasper Etherwind. Format 4.5\"L x 6\"H. ISBN 9782898171178.",
      longDescription: "Tarot des Chamans de Lumiere - Jasper Etherwind\n\n78 cartes + livret de 344 pages\nFormat : 4.5\"L x 6\"H\nParution : Juin 2024\nISBN : 9782898171178",
      inStock: true,
      tags: ['tarot', 'chamans', 'lumiere', 'etherwind', 'divination'],
      ...findImages('Tarot des Chamans de Lumière', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot Mysteria",
      price: 9.95,
      description: "78 cartes + livret de 336 pages par Isabella Moretti. Format 4.5\"L x 6\"H. ISBN 9782898171215.",
      longDescription: "Tarot Mysteria - Isabella Moretti\n\n78 cartes + livret de 336 pages\nFormat : 4.5\"L x 6\"H\nParution : Octobre 2024\nISBN : 9782898171215",
      inStock: true,
      tags: ['tarot', 'mysteria', 'moretti', 'divination'],
      ...findImages('Tarot Mysteria', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot 444",
      price: 29.95,
      description: "78 cartes + livret de 192 pages par Isabella Moretti. Format 4.5\"L x 6\"H. ISBN 9782898171260.",
      longDescription: "Le Tarot 444 - Isabella Moretti\n\n78 cartes + Livret de 192 pages\nFormat : 4.5\"L x 6\"H\nParution : Aout 2024\nISBN : 9782898171260",
      inStock: true,
      tags: ['tarot', '444', 'angelique', 'moretti', 'divination'],
      ...findImages('Le Tarot 444', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot de Marseille",
      price: 9.95,
      description: "78 cartes illustrees + livret explicatif complet par Anne-Sophie Casper. ISBN 9782898170461.",
      longDescription: "Tarot de Marseille - Anne-Sophie Casper\n\n78 cartes illustrees (22 arcanes majeurs et 56 arcanes mineurs) + livret explicatif complet\nISBN : 9782898170461",
      inStock: true,
      tags: ['tarot', 'marseille', 'casper', 'classique', 'divination'],
      ...findImages('Tarot de Marseille', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot des Enfants de la Lune",
      price: 29.95,
      description: "78 cartes + livret par Morgane Celeste. Format 4.5\"L x 6\"H. ISBN 9782898171147.",
      longDescription: "Tarot des Enfants de la Lune - Morgane Celeste\n\n78 cartes + livret\nFormat : 4.5\"L x 6\"H\nISBN : 9782898171147",
      inStock: true,
      tags: ['tarot', 'lune', 'celeste', 'divination'],
      ...findImages('Tarot des Enfants de la Lune', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot de la Bienveillance",
      price: 9.95,
      description: "78 cartes par Colette Baron-Reid. ISBN 9782897861384.",
      longDescription: "Le Tarot de la Bienveillance - Colette Baron-Reid\n\n78 cartes\nISBN : 9782897861384",
      inStock: true,
      tags: ['tarot', 'bienveillance', 'baron-reid', 'divination'],
      ...findImages('Le tarot de la Bienveillance', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot du Mirage Eternel",
      price: 9.95,
      description: "78 cartes + livret par Jasper Etherwind. Format 5\"L x 6.75\"H. ISBN 9782898171116.",
      longDescription: "Tarot du Mirage Eternel - Jasper Etherwind\n\n78 cartes + livret\nFormat : 5\"L x 6.75\"H\nISBN : 9782898171116",
      inStock: true,
      tags: ['tarot', 'mirage', 'etherwind', 'divination'],
      ...findImages('Tarot du Mirage Éternel', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot du Sang de l'Ombre",
      price: 9.95,
      description: "78 cartes + livret de 336 pages par Nathaniel Dunhaven. Format 4.5\"L x 6\"H.",
      longDescription: "Tarot du Sang de l'Ombre - Nathaniel Dunhaven\n\n78 cartes + livret de 336 pages\nFormat : 4.5\"L x 6\"H",
      inStock: true,
      tags: ['tarot', 'ombre', 'gothique', 'dunhaven', 'divination'],
      ...findImages("Tarot du Sang de l'Ombre", path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot Dore - Guide Pratique",
      price: 9.95,
      description: "Guide pratique par Barbara Moore et Ciro Marchetti. ISBN 9782898087813.",
      longDescription: "Tarot Dore - Guide Pratique - Barbara Moore / Ciro Marchetti\n\nISBN : 9782898087813",
      inStock: true,
      tags: ['tarot', 'dore', 'guide', 'moore', 'marchetti', 'divination'],
      ...findImages('Tarot doré - Guide pratique', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot Simplifie",
      price: 39.95,
      description: "Coffret complet par Josephine Ellershaw et Ciro Marchetti. ISBN 9782898086830.",
      longDescription: "Le Tarot Simplifie - Josephine Ellershaw / Ciro Marchetti\n\nISBN : 9782898086830",
      inStock: true,
      tags: ['tarot', 'simplifie', 'debutant', 'coffret', 'divination'],
      ...findImages('Le tarot simplifié', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot des Fees",
      price: 39.95,
      description: "78 cartes + guide d'accompagnement par Doreen Virtue et Radleigh Valentine. ISBN 9782897676384.",
      longDescription: "Tarot des Fees - Doreen Virtue & Radleigh Valentine\n\n78 cartes + guide d'accompagnement\nISBN : 9782897676384",
      inStock: true,
      tags: ['tarot', 'fees', 'virtue', 'valentine', 'divination'],
      ...findImages('Tarot des fées', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot des Sorcieres",
      price: 49.95,
      description: "78 cartes + livre 312 pages par Ellen Dugan. Illustrations de Mark Evans. ISBN 9782898087066.",
      longDescription: "Le Tarot des Sorcieres - Ellen Dugan / Illustrations: Mark Evans\n\n78 cartes + livre 312 pages\nISBN : 9782898087066",
      inStock: true,
      tags: ['tarot', 'sorcieres', 'wicca', 'dugan', 'divination'],
      ...findImages('Le Tarot des sorcières', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot du Pouvoir des Archanges",
      price: 39.95,
      description: "78 cartes + livret par Doreen Virtue et Radleigh Valentine. ISBN 9782897339104.",
      longDescription: "Le Tarot du Pouvoir des Archanges - Doreen Virtue & Radleigh Valentine\n\n78 cartes + livret d'accompagnement\nISBN : 9782897339104",
      inStock: true,
      tags: ['tarot', 'archanges', 'virtue', 'valentine', 'divination'],
      ...findImages('Le Tarot du pouvoir des archanges', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot Psychique - Cartes Oracles",
      price: 34.95,
      description: "65 cartes + Guide d'accompagnement par John Holland. ISBN 9782896670925.",
      longDescription: "Le Tarot Psychique - Cartes Oracles - John Holland\n\n65 cartes + Guide d'accompagnement\nISBN : 9782896670925",
      inStock: true,
      tags: ['tarot', 'oracle', 'psychique', 'holland', 'divination'],
      ...findImages('Le tarot psychique - Cartes Oracles', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Tarot Classique",
      price: 39.95,
      description: "78 cartes + livre par Barbara Moore. ISBN 9782897527945.",
      longDescription: "Tarot Classique - Barbara Moore\n\nISBN : 9782897527945",
      inStock: true,
      tags: ['tarot', 'classique', 'rider-waite', 'moore', 'divination'],
      ...findImages('Tarot classique', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot des Anges Gardiens",
      price: 39.95,
      description: "78 cartes + guide d'accompagnement par Doreen Virtue et Radleigh Valentine. ISBN 9782897528812.",
      longDescription: "Le Tarot des Anges Gardiens - Doreen Virtue & Radleigh Valentine\n\n78 cartes + guide d'accompagnement\nISBN : 9782897528812",
      inStock: true,
      tags: ['tarot', 'anges gardiens', 'virtue', 'valentine', 'divination'],
      ...findImages('Le tarot des anges gardiens', path.join(__dirname, '../public/images/products')),
    },
    {
      name: "Le Tarot du Funambule",
      price: 39.95,
      description: "Jeu de tarot par Siolo Thompson. ISBN 9782897863401.",
      longDescription: "Le Tarot du Funambule - Siolo Thompson\n\nISBN : 9782897863401",
      inStock: true,
      tags: ['tarot', 'funambule', 'thompson', 'divination'],
      ...findImages('Le Tarot du funambule', path.join(__dirname, '../public/images/products')),
    },
  ];

  // Supprimer tous les anciens tarots
  console.log('Suppression des anciens tarots...');
  const deleted = await prisma.product.deleteMany({ where: { category: 'tarot' } });
  console.log(`  ${deleted.count} anciens tarots supprimes.`);

  console.log('\nInsertion de 22 tarots depuis le Excel...');
  for (const tarot of tarots) {
    const slug = slugify(tarot.name);
    await prisma.product.create({
      data: {
        slug,
        name: tarot.name,
        price: tarot.price,
        description: tarot.description,
        longDescription: tarot.longDescription,
        category: 'tarot',
        image: tarot.image,
        images: tarot.images,
        inStock: tarot.inStock,
        featured: false,
        tags: tarot.tags,
      },
    });
    console.log(`  + ${tarot.name} (${tarot.images.length} photos: ${tarot.image})`);
  }

  const count = await prisma.product.count({ where: { category: 'tarot' } });
  console.log(`\nTermine ! ${count} tarots dans la base.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
