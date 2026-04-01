import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const tarots = [
  {
    name: 'Tarot Funambule S.T.',
    price: 39.95,
    description: "Jeu de tarot ou la fantaisie coloree rencontre la sagesse profonde. Marchez sur le fil de la magie et de la logique.",
    longDescription: "Marchez sur le fil de la magie et de la logique ou la fantaisie coloree rencontre la sagesse profonde. Apprenez a emprunter le chemin du marcheur funambule, ou de vives couleurs surgissent de la page blanche, ou l'esprit conscient et l'esprit inconscient parlent la meme langue et ou les humains et les animaux vivent en harmonie. Sur la route, vous decouvrirez des reponses aux plus grands mysteres de la vie au sujet de votre passe, de votre present et de votre avenir.",
  },
  {
    name: 'Tarot Classique B.M.',
    price: 39.95,
    description: "Jeu de tarot classique pour comprendre les interpretations traditionnelles et modernes du Tarot.",
    longDescription: "",
  },
  {
    name: 'Tarot Psychique (Oracle) J.H.',
    price: 34.95,
    description: "Oracle psychique pour developper vos dons de clairvoyance et d'intuition divinatoire.",
    longDescription: "",
  },
  {
    name: 'Tarot des Fees D.V.',
    price: 39.95,
    description: "Tarot enchante inspire du monde feerique pour des lectures empreintes de magie et de douceur.",
    longDescription: "",
  },
  {
    name: 'Tarot Simplifie J.E',
    price: 39.95,
    description: "Tarot accessible et simplifie, ideal pour les debutants souhaitant s'initier a la divination.",
    longDescription: "",
  },
  {
    name: 'Tarot du Mirage Eternel J.Etherwind.',
    price: 39.95,
    description: "Explorez les illusions et les verites cachees avec ce tarot mystique aux visuels envoutants.",
    longDescription: "",
  },
  {
    name: 'Tarot Dore B.Moore.',
    price: 39.95,
    description: "Tarot aux finitions dorees, alliant elegance visuelle et profondeur symbolique.",
    longDescription: "",
  },
  {
    name: 'Tarot 444 I. Moretti.',
    price: 39.95,
    description: "Tarot numerologique inspire du nombre angelique 444, symbole de protection et de guidance.",
    longDescription: "",
  },
  {
    name: 'Tarot Chamans Lumiere J. Etherwind.',
    price: 39.95,
    description: "Tarot chamanique connectant aux esprits de la nature et aux guides de lumiere ancestraux.",
    longDescription: "",
  },
  {
    name: 'Tarot Ere du Verseau L.Ravenheart',
    price: 39.95,
    description: "Tarot moderne celebrant l'ere du Verseau, la conscience collective et l'eveil spirituel.",
    longDescription: "",
  },
  {
    name: 'Tarot Mysteria I. Moretti',
    price: 39.95,
    description: "Plongez dans les mysteres de l'invisible avec ce tarot aux illustrations captivantes.",
    longDescription: "",
  },
  {
    name: 'Tarot Akashique S. Klinger',
    price: 39.95,
    description: "Tarot connecte aux annales akashiques pour acceder aux memoires de l'ame et du cosmos.",
    longDescription: "",
  },
  {
    name: 'Tarot Interdit N. Dunhaven',
    price: 39.95,
    description: "Tarot sombre et fascinant inspire des contes interdits et des recits obscurs de l'esoterisme.",
    longDescription: "",
  },
  {
    name: 'Tarot Marseille A.-S.Casper',
    price: 39.95,
    description: "Le classique Tarot de Marseille revisite avec une touche artistique contemporaine.",
    longDescription: "",
  },
  {
    name: 'Tarot de Sorcieres H. Dugan',
    price: 39.95,
    description: "Tarot dedie aux sorcieres modernes, ancre dans les traditions de la magie et de la Wicca.",
    longDescription: "",
  },
  {
    name: "Tarot sang de l'Ombre N.Duhaven",
    price: 39.95,
    description: "Tarot sombre et puissant explorant les mysteres de l'ombre et les forces cachees de l'ame.",
    longDescription: "",
  },
  {
    name: 'Tarot enfant de la Lune M. Celeste',
    price: 39.95,
    description: "Tarot lunaire et poetique, guide par la lumiere de la lune et l'intuition feminine sacree.",
    longDescription: "",
  },
  {
    name: 'Tarot Prophetie des Sorcieres I.Moretti',
    price: 39.95,
    description: "Tarot prophetique revelant les visions et predictions des sorcieres a travers les ages.",
    longDescription: "",
  },
];

async function main() {
  console.log('Insertion de 18 tarots dans la base de donnees...');

  for (const tarot of tarots) {
    const slug = slugify(tarot.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  - ${tarot.name} existe deja, ignore.`);
      continue;
    }
    await prisma.product.create({
      data: {
        slug,
        name: tarot.name,
        price: tarot.price,
        description: tarot.description,
        longDescription: tarot.longDescription,
        category: 'tarot',
        image: '/images/products/placeholder-tarot.jpg',
        images: [],
        inStock: true,
        featured: false,
        tags: ['tarot', 'cartes divinatoires', 'divination'],
      },
    });
    console.log(`  + ${tarot.name} ajoute !`);
  }

  console.log('Termine !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
