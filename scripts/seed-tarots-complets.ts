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
    name: "Le Tarot Interdit",
    price: 29.95,
    description: "78 cartes impregees de l'esprit envoutant des recits obscurs des Contes Interdits par Nathaniel Dunhaven.",
    longDescription: "Le Tarot Interdit - Nathaniel Dunhaven\n\nPlongez dans les profondeurs des contes interdits. Chaque carte est impregnee de l'esprit envoutant des recits obscurs et des personnages emblematiques qui les habitent. Laissez-vous guider par les symboles esoteriques et les images evocatrices pour explorer les mysteres de votre destinee.\n\nAvec 78 cartes richement illustrees, incluant 22 arcanes majeurs et 56 arcanes mineurs. 38 personnages magnifiquement illustres tires des Contes Interdits.\n\nFormat : 4.5\" x 6\"",
    tags: ['tarot', 'contes interdits', 'divination', 'arcanes', 'dunhaven'],
    inStock: true,
  },
  {
    name: "Le Tarot Akashique",
    price: 34.95,
    description: "62 cartes connectees aux annales akashiques par Sharon A. Klingler et Sandra Anne Taylor.",
    longDescription: "Le Tarot Akashique - Sharon A. Klingler & Sandra Anne Taylor\n\nTransporte dans la grande Salle des Annales pour trouver reponses, reveler talents, victoires inattendues, allies et prosperite sans precedent.\n\nContenu : 62 cartes\nISBN : 9782898030451",
    tags: ['tarot', 'akashique', 'annales', 'divination', 'oracle'],
    inStock: true,
  },
  {
    name: "Le Tarot des Anges",
    price: 9.95,
    description: "78 cartes bienveillantes avec guide par Doreen Virtue et Radleigh Valentine. Illustrations de Steve A. Roberts.",
    longDescription: "Le Tarot des Anges - Doreen Virtue & Radleigh Valentine\n\nJeu bienveillant et sans danger, mots positifs, illustrations de Steve A. Roberts. Guide detaillant la marche a suivre a toutes les etapes.\n\nContenu : 78 cartes + guide\nISBN : 9782898088681",
    tags: ['tarot', 'anges', 'bienveillance', 'divination'],
    inStock: false,
  },
  {
    name: "Le Tarot de l'Ere du Verseau",
    price: 29.95,
    description: "78 cartes celebrant l'esprit inventif de l'ere du Verseau par Luna Ravenheart.",
    longDescription: "Le Tarot de l'Ere du Verseau - Luna Ravenheart\n\nCelebration de l'esprit inventif de l'ere du Verseau. Chaque carte mele elements traditionnels et avant-gardistes pour eveiller l'intuition et stimuler l'inspiration.\n\nContenu : 78 cartes\nFormat : 4.5\" x 6\"\nISBN : 9782898171185",
    tags: ['tarot', 'verseau', 'intuition', 'divination', 'moderne'],
    inStock: true,
  },
  {
    name: "Tarot La Prophetie des Sorcieres",
    price: 29.95,
    description: "78 cartes + livret fusionnant sagesse des sorcieres et mysticisme moderne par Isabella Moretti.",
    longDescription: "Tarot La Prophetie des Sorcieres - Isabella Moretti\n\nReveillez la sorciere qui sommeille en vous. Fusionne sagesse des sorcieres et mysticisme moderne. Outil pour manifester desirs, comprendre defis et embrasser sa destinee.\n\nContenu : 78 cartes + livret\nFormat : 4.5\" x 6\"\nISBN : 9782898171246",
    tags: ['tarot', 'sorcieres', 'prophetie', 'divination', 'moretti'],
    inStock: true,
  },
  {
    name: "Tarot des Chamans de Lumiere",
    price: 29.95,
    description: "78 cartes + livret 344 pages. Voyage spirituel guide par la sagesse ancestrale par Jasper Etherwind.",
    longDescription: "Tarot des Chamans de Lumiere - Jasper Etherwind\n\nVoyage spirituel unique guide par sagesse ancestrale. Cle pour deverrouiller les mysteres de l'ame et du cosmos. Ideal debutants et tarologues experimentes.\n\nContenu : 78 cartes + livret 344 pages\nFormat : 4.5\" x 6\"\nISBN : 9782898171178",
    tags: ['tarot', 'chamans', 'lumiere', 'spirituel', 'etherwind'],
    inStock: true,
  },
  {
    name: "Tarot Mysteria",
    price: 9.95,
    description: "78 cartes + livret 336 pages. Chaque tirage est un rituel sacre par Isabella Moretti.",
    longDescription: "Tarot Mysteria - Isabella Moretti\n\nVoyage qui eclaire passe, present et avenir. Chaque tirage est un rituel sacre revelant verites profondes sur votre essence la plus pure.\n\nContenu : 78 cartes + livret 336 pages\nFormat : 4.5\" x 6\"\nISBN : 9782898171215",
    tags: ['tarot', 'mysteria', 'rituel', 'divination', 'moretti'],
    inStock: true,
  },
  {
    name: "Le Tarot 444",
    price: 29.95,
    description: "78 cartes + livret 192 pages guide par le nombre angelique 444 par Isabella Moretti.",
    longDescription: "Le Tarot 444 - Isabella Moretti\n\nGuide par le nombre angelique 444, symbole de stabilite et d'encouragement divin. Chaque carte est une porte sur l'introspection et l'eveil spirituel.\n\nContenu : 78 cartes + livret 192 pages\nFormat : 4.5\" x 6\"\nISBN : 9782898171260",
    tags: ['tarot', '444', 'angelique', 'divination', 'moretti'],
    inStock: true,
  },
  {
    name: "Tarot de Marseille A.-S. Casper",
    price: 9.95,
    description: "78 cartes + livret explorant symbolique, astrologie, chakras et lithotherapie par Anne-Sophie Casper.",
    longDescription: "Tarot de Marseille - Anne-Sophie Casper\n\nExplorez symbolique, forces, couleurs, saisons, signes astrologiques, huiles essentielles, chakras et pierres de lithotherapie. Reveillez votre pouvoir de divination.\n\nContenu : 78 cartes + livret\nISBN : 9782898170461",
    tags: ['tarot', 'marseille', 'astrologie', 'chakras', 'lithotherapie'],
    inStock: true,
  },
  {
    name: "Tarot des Enfants de la Lune",
    price: 29.95,
    description: "78 cartes + livret. Voyage mystique ou sagesse antique rencontre enchantement celeste par Morgane Celeste.",
    longDescription: "Tarot des Enfants de la Lune - Morgane Celeste\n\nVoyage mystique ou sagesse antique rencontre enchantement celeste. Arcanes majeurs pour grandes epopees, arcanes mineurs pour le quotidien. Mysteres lunaires.\n\nContenu : 78 cartes + livret\nFormat : 4.5\" x 6\"\nISBN : 9782898171147",
    tags: ['tarot', 'lune', 'mystique', 'celeste', 'divination'],
    inStock: true,
  },
  {
    name: "Le Tarot de la Bienveillance",
    price: 9.95,
    description: "78 cartes de tarot classique teinte de psychologie positive par Colette Baron-Reid.",
    longDescription: "Le Tarot de la Bienveillance - Colette Baron-Reid\n\nTarot classique teinte de psychologie positive. Messages sous forme d'affirmations positives dans le present. 4 elements : Air, Eau, Terre, Feu.\n\nContenu : 78 cartes\nISBN : 9782897861384",
    tags: ['tarot', 'bienveillance', 'psychologie positive', 'affirmations'],
    inStock: false,
  },
  {
    name: "Tarot du Mirage Eternel",
    price: 9.95,
    description: "78 cartes + livret. Voyage a travers les dunes dorees de la conscience par Jasper Etherwind.",
    longDescription: "Tarot du Mirage Eternel - Jasper Etherwind\n\nVoyage a travers les dunes dorees de la conscience. Outil divinatoire unique melant tradition et innovation, revelant illusions et verites de notre existence.\n\nContenu : 78 cartes + livret\nFormat : 5\" x 6.75\"\nISBN : 9782898171116",
    tags: ['tarot', 'mirage', 'conscience', 'divination', 'etherwind'],
    inStock: true,
  },
  {
    name: "Tarot du Sang de l'Ombre",
    price: 9.95,
    description: "78 cartes + livret 336 pages. Esthetique gothique captivante par Nathaniel Dunhaven.",
    longDescription: "Tarot du Sang de l'Ombre - Nathaniel Dunhaven\n\nMonde ou lumiere rencontre tenebres. Esthetique gothique captivante, symboles mystiques. Livret avec explications detaillees et exemples de tirages.\n\nContenu : 78 cartes + livret 336 pages\nFormat : 4.5\" x 6\"\nISBN : 9782898171208",
    tags: ['tarot', 'gothique', 'ombre', 'mystique', 'dunhaven'],
    inStock: true,
  },
  {
    name: "Tarot Dore - Guide Pratique",
    price: 9.95,
    description: "Guide pratique du Tarot Dore par Barbara Moore et Ciro Marchetti.",
    longDescription: "Tarot Dore - Guide Pratique - Barbara Moore & Ciro Marchetti\n\nCode d'acces aux images enchanteresses du Tarot Dore. Ciro Marchetti partage ses reflexions sur son processus createur. Enseignement intuitif des illustrations.\n\nContenu : Guide pratique\nISBN : 9782898087813",
    tags: ['tarot', 'dore', 'guide', 'marchetti', 'moore'],
    inStock: true,
  },
  {
    name: "Le Tarot Simplifie",
    price: 39.95,
    description: "Coffret complet pour debutants : livre, Tarot Dore et grille de tirage par Josephine Ellershaw.",
    longDescription: "Le Tarot Simplifie - Josephine Ellershaw & Ciro Marchetti\n\nCoffret debutants : livre convivial, Tarot Dore, grille de tirage, conseils, raccourcis et exemples. Tout pour lire les cartes pour soi et pour les autres.\n\nContenu : Livre + Tarot Dore + grille\nISBN : 9782898086830",
    tags: ['tarot', 'debutant', 'coffret', 'simplifie', 'apprentissage'],
    inStock: true,
  },
  {
    name: "Tarot des Fees",
    price: 39.95,
    description: "78 cartes + guide. Fees comme anges de la nature par Doreen Virtue et Radleigh Valentine.",
    longDescription: "Tarot des Fees - Doreen Virtue & Radleigh Valentine\n\nFees comme anges de la nature aidant a porter sa couronne invisible. Jeu de l'estime de soi. Illustrations de Howard David Johnson. Cadre de Glastonbury, Angleterre.\n\nContenu : 78 cartes + guide\nISBN : 9782897676384",
    tags: ['tarot', 'fees', 'nature', 'estime de soi', 'virtue'],
    inStock: true,
  },
  {
    name: "Le Tarot des Sorcieres",
    price: 49.95,
    description: "78 cartes + livre 312 pages. Sorcellerie au devant de la scene par Ellen Dugan.",
    longDescription: "Le Tarot des Sorcieres - Ellen Dugan\n\nBase sur Rider-Waite-Smith, sorcellerie au devant de la scene. Illustrations de Mark Evans. Tirages pour ameliorer les sortileges : Triple Deesse, quatre elements, Roue de l'annee.\n\nContenu : 78 cartes + livre 312 pages\nISBN : 9782898087066",
    tags: ['tarot', 'sorcieres', 'wicca', 'magie', 'dugan'],
    inStock: true,
  },
  {
    name: "Le Tarot du Pouvoir des Archanges",
    price: 39.95,
    description: "78 cartes + livret. Messages precis et bienveillants des archanges par Doreen Virtue.",
    longDescription: "Le Tarot du Pouvoir des Archanges - Doreen Virtue & Radleigh Valentine\n\nMessages precis et bienveillants des archanges. Concu pour gens de grande sensibilite ayant besoin d'encouragement pour passer a l'action.\n\nContenu : 78 cartes + livret\nISBN : 9782897339104",
    tags: ['tarot', 'archanges', 'angelique', 'bienveillance', 'virtue'],
    inStock: true,
  },
  {
    name: "Le Tarot Psychique - Cartes Oracles",
    price: 34.95,
    description: "65 cartes oracles + guide. Pont entre facultes psychiques et tarot par John Holland.",
    longDescription: "Le Tarot Psychique - Cartes Oracles - John Holland\n\nPont entre facultes psychiques et tarot. Developpement de l'intuition. John Holland partage techniques : couleurs, symbolique, formes, numerologie, chakras.\n\nContenu : 65 cartes + guide\nISBN : 9782896670925",
    tags: ['tarot', 'oracle', 'psychique', 'intuition', 'holland'],
    inStock: true,
  },
  {
    name: "Tarot Classique",
    price: 39.95,
    description: "78 cartes + livre. Interpretation fidele du systeme Rider-Waite-Smith par Barbara Moore.",
    longDescription: "Tarot Classique - Barbara Moore & Eugene Smith\n\nInterpretation fidele du systeme Rider-Waite-Smith. Analyse detaillee de chaque carte, symbolisme decode, mots cles, associations astrologiques et elementales.\n\nContenu : 78 cartes + livre\nISBN : 9782897527945",
    tags: ['tarot', 'classique', 'rider-waite', 'traditionnel', 'moore'],
    inStock: true,
  },
];

async function main() {
  // Supprimer les anciens tarots incomplets
  console.log('Suppression des anciens tarots...');
  const deleted = await prisma.product.deleteMany({
    where: { category: 'tarot', price: { in: [39.95, 34.95, 0] } },
  });
  console.log(`  ${deleted.count} anciens tarots supprimes.`);

  console.log('\nInsertion de 20 tarots complets...');
  for (const tarot of tarots) {
    const slug = slugify(tarot.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  ~ ${tarot.name} existe deja, mise a jour...`);
      await prisma.product.update({
        where: { slug },
        data: {
          price: tarot.price,
          description: tarot.description,
          longDescription: tarot.longDescription,
          tags: tarot.tags,
          inStock: tarot.inStock,
        },
      });
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
        inStock: tarot.inStock,
        featured: false,
        tags: tarot.tags,
      },
    });
    console.log(`  + ${tarot.name} ajoute !`);
  }

  const count = await prisma.product.count({ where: { category: 'tarot' } });
  console.log(`\nTermine ! ${count} tarots au total dans la base.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
