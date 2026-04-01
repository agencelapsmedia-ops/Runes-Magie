import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pierres = [
  {
    slug: 'amethyste-pierre-femme-sacree',
    name: 'Amethyste',
    price: 0,
    description: "Pierre de la Femme Sacree, l'amethyste incarne la puissance douce et profonde du feminin sacre.",
    longDescription: "L'Amethyste - Pierre de la Femme Sacree\n\nNee des entrailles de la Terre, bercee par les eaux primordiales, l'amethyste incarne la puissance douce et profonde du feminin sacre. Pierre de maternite et d'intuition, elle relie votre ame a Gaia et au divin - un pont vivant entre mer, terre et ciel.\n\nPortez-la. Ressentez-vous entiere.",
    category: 'cristaux',
    stone: 'amethyste',
    image: '/images/products/amethyste.jpg',
    images: ['/images/products/amethyste.jpg'],
    inStock: true,
    featured: false,
    tags: ['feminin sacre', 'intuition', 'maternite', 'gaia', 'protection'],
  },
  {
    slug: 'citrine-pierre-de-feu',
    name: 'Citrine',
    price: 0,
    description: "Solaire et indomptable, la citrine brule d'une lumiere qui ne s'eteint pas. Elle eveille le plexus solaire.",
    longDescription: "La Citrine - Pierre de Feu\n\nSolaire et indomptable, la citrine brule d'une lumiere qui ne s'eteint pas. Elle eveille le plexus solaire, ce centre de puissance en vous, et souffle sur les braises de votre courage. Face aux defis, elle vous pousse en avant, debout, determinee, fonceuse, audacieuse.\n\nPortez-la. Osez.",
    category: 'cristaux',
    stone: 'citrine',
    image: '/images/products/citrine.jpg',
    images: ['/images/products/citrine.jpg'],
    inStock: true,
    featured: false,
    tags: ['courage', 'plexus solaire', 'energie', 'solaire', 'confiance'],
  },
  {
    slug: 'obsidienne-miroir-de-lame',
    name: 'Obsidienne',
    price: 0,
    description: "Nee du feu volcanique, l'obsidienne est la gardienne des passages et le miroir de l'ame.",
    longDescription: "L'Obsidienne - Miroir de l'Ame\n\nNee du feu volcanique, noire comme l'entre-deux mondes, l'obsidienne est la gardienne des passages. Elle accompagne courageusement ceux qui osent traverser les portails psychiques, explorer les dimensions spirituelles et dialoguer avec l'invisible. Bouclier contre les energies sombres, elle revele sans pitie ce que l'on cache a soi-meme. Travailler avec elle, c'est plonger dans ses propres ombres pour en revenir transforme.\n\nElle ne ment pas. Elle libere.",
    category: 'cristaux',
    stone: 'obsidienne',
    image: '/images/products/obsidienne.jpg',
    images: ['/images/products/obsidienne.jpg'],
    inStock: true,
    featured: false,
    tags: ['protection', 'portails', 'ombre', 'transformation', 'bouclier'],
  },
  {
    slug: 'tourmaline-noire-bouclier-de-terre',
    name: 'Tourmaline Noire',
    price: 0,
    description: "Ancree dans les profondeurs de la Terre, la tourmaline noire est la sentinelle silencieuse qui veille.",
    longDescription: "La Tourmaline Noire - Bouclier de Terre\n\nAncree dans les profondeurs de la Terre, la tourmaline noire est la sentinelle silencieuse qui veille. Elle cree autour de vous un bouclier invisible, repoussant toute onde negative, toute energie indesirable. Protectrice du corps physique autant qu'energetique, elle vous maintient solide, enracine, inebranlable quoi que le monde envoie.\n\nPortez-la. Restez entier.",
    category: 'cristaux',
    stone: 'tourmaline',
    image: '/images/products/tourmaline-noire.jpg',
    images: ['/images/products/tourmaline-noire.jpg'],
    inStock: true,
    featured: false,
    tags: ['protection', 'ancrage', 'bouclier', 'terre', 'energie'],
  },
  {
    slug: 'labradorite-pierre-des-dons-caches',
    name: 'Labradorite',
    price: 0,
    description: "La labradorite eveille et affute les dons psychiques, ouvre le regard au-dela du visible.",
    longDescription: "La Labradorite - Pierre des Dons Caches\n\nDerriere son apparence discrete se cache un univers de lumieres - comme en vous. La labradorite eveille et affute les dons psychiques, ouvre le regard au-dela du visible, revele les intentions cachees de ceux qui vous entourent. Gardienne magique, elle tisse autour de vous un voile de protection contre les energies malveillantes et les sombres intentions. Elle guide votre ame vers une connexion divine plus profonde, plus vraie, plus puissante.\n\nVoyez ce que les autres ne montrent pas. Soyez protegee. Soyez eveillee.",
    category: 'cristaux',
    stone: 'labradorite',
    image: '/images/products/labradorite.jpg',
    images: ['/images/products/labradorite.jpg'],
    inStock: true,
    featured: false,
    tags: ['dons psychiques', 'clairvoyance', 'protection', 'magie', 'intuition'],
  },
  {
    slug: 'oeil-de-tigre-regard-du-guerrier',
    name: 'Oeil de Tigre',
    price: 0,
    description: "Feu et terre fusionnes en une seule pierre, l'oeil de tigre est l'arme silencieuse du guerrier interieur.",
    longDescription: "L'Oeil de Tigre - Regard du Guerrier\n\nFeu et terre fusionnes en une seule pierre, l'oeil de tigre est l'arme silencieuse du guerrier interieur. Il repousse le mauvais oeil, neutralise les intentions malveillantes et renvoie les ondes negatives a leur source. Face a vos ennemis, il allume en vous ce courage feroce et lucide qui ne tremble pas. Il ancre, il protege, il rugit.\n\nPortez-le. Regardez droit devant. Ne reculez jamais.",
    category: 'cristaux',
    stone: 'oeil-de-tigre',
    image: '/images/products/oeil-de-tigre.jpg',
    images: ['/images/products/oeil-de-tigre.jpg'],
    inStock: true,
    featured: false,
    tags: ['courage', 'protection', 'mauvais oeil', 'guerrier', 'ancrage'],
  },
  {
    slug: 'fluorite-pierre-des-eaux-interieures',
    name: 'Fluorite',
    price: 0,
    description: "Douce et implacable a la fois, la fluorite plonge dans les profondeurs de l'ame pour guerir.",
    longDescription: "La Fluorite - Pierre des Eaux Interieures\n\nDouce et implacable a la fois, la fluorite plonge ses mains dans les profondeurs de l'ame et remonte ce qui attend d'etre gueri. Pierre du ventre et de l'intime, elle touche ce qui a ete enfoui depuis longtemps - les traumatismes d'enfance, les douleurs tues, les emotions refoulees annee apres annee. Elle revele la tristesse enfouie, la nostalgie silencieuse, le chagrin oublie - et les accueille sans jugement. Purificatrice puissante, elle provoque ces crises de guerison necessaires, ces tempetes interieures qui laissent place au calme et a la clarte. Elle eveille l'intelligence emotionnelle, cette sagesse rare qui sait ressentir sans se perdre.\n\nPleurez s'il le faut. L'enfant en vous merite d'etre entendu.",
    category: 'cristaux',
    stone: 'fluorite',
    image: '/images/products/fluorite.jpg',
    images: ['/images/products/fluorite.jpg'],
    inStock: true,
    featured: false,
    tags: ['guerison', 'emotions', 'purification', 'enfant interieur', 'intelligence emotionnelle'],
  },
  {
    slug: 'lapis-lazuli-pierre-des-dieux',
    name: 'Lapis-Lazuli',
    price: 0,
    description: "Bleu comme le ciel d'Egypte ancienne, le lapis-lazuli est la pierre sacree de Thot, dieu de la sagesse.",
    longDescription: "Le Lapis-Lazuli - Pierre des Dieux et des Sages\n\nBleu comme le ciel d'Egypte ancienne, le lapis-lazuli est la pierre sacree de Thot - dieu de la connaissance, de la magie et de la sagesse universelle. Il ouvre un canal direct avec le pantheon egyptien, invitant les dieux a marcher a vos cotes, a guider vos pas sur le chemin de l'ame.\n\nPierre des erudits et des esprits disperses, il ramene le focus la ou tout s'eparpille - non pas dans l'action frenetique, mais dans la profondeur tranquille de ce que vous etes vraiment. Il ancre l'ame en elle-meme, la ou resident les vraies reponses.\n\nIl eveille la claire connaissance - ce savoir ancien qui ne s'apprend pas, qui se souvient. Il rouvre les memoires des vies anterieures, ravive les reincarnations oubliees, revele les fils invisibles qui relient votre ame a travers le temps. Il vous montre la prochaine etape - celle qui n'est pas choisie par la tete, mais reconnue par l'ame.\n\nVous n'apprenez pas. Vous vous souvenez.",
    category: 'cristaux',
    stone: 'lapis-lazuli',
    image: '/images/products/lapis-lazuli.jpg',
    images: ['/images/products/lapis-lazuli.jpg'],
    inStock: true,
    featured: false,
    tags: ['sagesse', 'egypte', 'thot', 'vies anterieures', 'connaissance', 'focus'],
  },
  {
    slug: 'selenite-flamme-divine',
    name: 'Selenite',
    price: 0,
    description: "Pure comme la lumiere qu'elle porte, la selenite est un etre de lumiere a elle seule, flamme divine incarnee.",
    longDescription: "La Selenite - Flamme Divine & Lumiere Vivante\n\nPure comme la lumiere qu'elle porte, la selenite est bien plus qu'une pierre - elle est un etre de lumiere a elle seule. Flamme divine incarnee, elle rayonne le feminin sacre dans toute sa splendeur et nettoie en profondeur le champ energetique, purgeant ce qui alourdit, ce qui encombre, ce qui n'appartient plus.\n\nElle tranche les cordes energetiques toxiques, defait les liens invisibles qui drainent et epuisent, libere des emprises energetiques que l'on ne voit pas mais que l'on ressent. La ou l'energie stagne, elle circule. La ou l'ombre s'installe, elle illumine.\n\nPierre rare et precieuse entre toutes - elle s'autonettoyage, se recharge seule et synergise les autres cristaux autour d'elle. Posez-la au soleil et regardez-la s'eveiller pleinement.\n\nLes anciens marins la connaissaient bien. Ils la levaient vers le ciel pour retrouver la direction du soleil meme a travers les nuages - boussole de lumiere dans l'obscurite des mers. Pierre de navigation, hier comme aujourd'hui, elle vous aide a retrouver votre nord interieur quand tout semble brumeux.\n\nLa ou elle entre, la lumiere reste.",
    category: 'cristaux',
    stone: 'selenite',
    image: '/images/products/selenite.jpg',
    images: ['/images/products/selenite.jpg'],
    inStock: true,
    featured: false,
    tags: ['lumiere', 'purification', 'feminin sacre', 'nettoyage', 'recharge', 'navigation'],
  },
];

async function main() {
  console.log('Insertion de 9 pierres/cristaux dans la base de donnees...');

  for (const pierre of pierres) {
    const existing = await prisma.product.findUnique({ where: { slug: pierre.slug } });
    if (existing) {
      console.log(`  - ${pierre.name} existe deja, ignore.`);
      continue;
    }
    await prisma.product.create({ data: pierre });
    console.log(`  + ${pierre.name} ajoutee !`);
  }

  console.log('Termine !');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
