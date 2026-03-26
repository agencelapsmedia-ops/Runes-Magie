export type Category =
  | 'cristaux'
  | 'runes'
  | 'tarot'
  | 'herbes-encens'
  | 'bougies'
  | 'bijoux'
  | 'orgonites'
  | 'baguettes-magiques';

export interface Subcategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  longDescription: string;
  category: Category;
  subcategory?: string;
  stone?: string;
  image: string;
  images: string[];
  inStock: boolean;
  featured: boolean;
  tags: string[];
}

// Liste des noms de pierres (pour la catégorie Pierres et Cristaux)
export const stoneNames: Subcategory[] = [
  { id: 'lapis-lazuli', name: 'Lapis lazuli' },
  { id: 'obsidienne', name: 'Obsidienne' },
  { id: 'oeil-de-tigre', name: 'Oeil de tigre' },
  { id: 'cornaline', name: 'Cornaline' },
  { id: 'citrine', name: 'Citrine' },
  { id: 'amethyste', name: 'Améthyste' },
  { id: 'quartz', name: 'Quartz' },
  { id: 'labradorite', name: 'Labradorite' },
  { id: 'fluorite', name: 'Fluorite' },
  { id: 'selenite', name: 'Sélénite' },
  { id: 'turquoise', name: 'Turquoise' },
  { id: 'tourmaline', name: 'Tourmaline' },
  { id: 'opale-de-feu', name: 'Opale de feu' },
  { id: 'aventurine', name: 'Aventurine' },
  { id: 'pierre-de-sang', name: 'Pierre de sang' },
];

export const categorySubcategories: Record<Category, Subcategory[]> = {
  cristaux: [
    { id: 'lampes', name: 'Lampes' },
    { id: 'ensembles-combinaisons', name: 'Ensembles et combinaisons' },
    { id: 'tranches', name: 'Tranches' },
    { id: 'pepites', name: 'Pépites' },
    { id: 'sables', name: 'Sables' },
    { id: 'geodes', name: 'Géodes' },
    { id: 'spheres', name: 'Sphères' },
    { id: 'pyramides', name: 'Pyramides' },
    { id: 'tours', name: 'Tours' },
    { id: 'athames-dagues', name: 'Athamés/dagues' },
    { id: 'pierres-tantriques', name: 'Pierres tantriques' },
    { id: 'animaux-creatures', name: 'Animaux/créatures' },
    { id: 'pierres-roulees', name: 'Pierres roulées' },
    { id: 'pierres-blacklight', name: 'Pierres Blacklight' },
    { id: 'plaques', name: 'Plaques' },
    { id: 'pierres-gravees', name: 'Pierres gravées' },
    { id: 'creations-originales', name: 'Créations originales' },
    { id: 'autres-formes', name: 'Autres formes' },
    { id: 'pierres-pouces', name: 'Pierres pouces' },
    { id: 'piliers', name: 'Piliers' },
    { id: 'cabochons', name: 'Cabochons' },
    { id: 'flammes', name: 'Flammes' },
    { id: 'baguettes', name: 'Baguettes' },
    { id: 'fleurs-de-cristal', name: 'Fleurs de cristal' },
    { id: 'raretes', name: 'Raretés' },
    { id: 'pointes', name: 'Pointes' },
    { id: 'oeufs', name: 'Oeufs' },
    { id: 'yoni-feminin-sacre', name: 'Yoni/Féminin sacré' },
    { id: 'lunes-etoiles', name: 'Lunes/étoiles' },
    { id: 'bols', name: 'Bols' },
    { id: 'des', name: 'Dés' },
    { id: 'mobilier-bains-lavabos', name: 'Mobilier/bains/lavabos' },
  ],
  runes: [],
  tarot: [],
  'herbes-encens': [],
  bougies: [],
  bijoux: [],
  orgonites: [],
  'baguettes-magiques': [],
};

export const categories: {
  id: Category;
  name: string;
  icon: string;
  description: string;
}[] = [
  {
    id: 'cristaux',
    name: 'Pierres et Cristaux',
    icon: 'diamond',
    description:
      'Pierres et cristaux naturels choisis pour leurs vibrations uniques et leurs vertus de guerison ancestrale.',
  },
  {
    id: 'runes',
    name: 'Runes',
    icon: 'rune',
    description:
      "Jeux de runes artisanaux graves dans la pierre, le bois ou l'os pour la divination et la meditation.",
  },
  {
    id: 'tarot',
    name: 'Tarot',
    icon: 'cards',
    description:
      "Jeux de tarot et d'oracles selectionnes pour leur puissance symbolique et leur connexion spirituelle.",
  },
  {
    id: 'herbes-encens',
    name: 'Herbes & Encens',
    icon: 'leaf',
    description:
      'Herbes sacrees, encens naturels et melanges rituels pour la purification et les ceremonies.',
  },
  {
    id: 'bougies',
    name: 'Bougies',
    icon: 'flame',
    description:
      'Bougies rituelles en cire naturelle, chargees et consacrees pour vos pratiques magiques.',
  },
  {
    id: 'bijoux',
    name: 'Bijoux',
    icon: 'gem',
    description:
      "Bijoux esoteriques faits main, impregnes d'intentions et de symboles sacres protecteurs.",
  },
  {
    id: 'orgonites',
    name: 'Orgonites',
    icon: 'zap',
    description:
      "Orgonites artisanales transformant l'energie negative en force positive et harmonieuse.",
  },
  {
    id: 'baguettes-magiques',
    name: 'Baguettes Magiques',
    icon: 'wand',
    description:
      "Baguettes magiques sculptees a la main dans des bois sacres, chacune dotee d'une ame cristalline.",
  },
];

export const products: Product[] = [
  // ── Cristaux ──────────────────────────────────────────────
  {
    id: 'cristaux-001',
    slug: 'amethyste-pointe-naturelle',
    name: 'Amethyste Pointe Naturelle',
    price: 45,
    description:
      "Pointe d'amethyste naturelle du Bresil, pierre de sagesse et d'intuition spirituelle.",
    longDescription:
      "Cette magnifique pointe d'amethyste naturelle provient des gisements sacres du Bresil. Reconnue depuis l'Antiquite comme la pierre des sages et des mystiques, l'amethyste ouvre le troisieme oeil et renforce l'intuition. Placee pres de votre lit, elle favorise les reves prophetiques et protege contre les energies negatives. Chaque piece est unique, selectionnee a la main pour la purete de sa couleur violette et l'intensite de sa vibration.",
    category: 'cristaux',
    image: '/images/products/amethyste-pointe.jpg',
    images: [
      '/images/products/amethyste-pointe.jpg',
      '/images/products/amethyste-pointe-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['protection', 'intuition', 'meditation', 'troisieme oeil'],
  },
  {
    id: 'cristaux-002',
    slug: 'quartz-rose-brut',
    name: 'Quartz Rose Brut',
    price: 35,
    description:
      "Pierre d'amour inconditionnel, le quartz rose ouvre le chakra du coeur et apaise les blessures emotionnelles.",
    longDescription:
      "Le quartz rose est la pierre de l'amour universel par excellence. Ce specimen brut degage une energie douce et enveloppante qui ouvre le chakra du coeur, favorise l'amour de soi et attire les relations harmonieuses. Utilise en meditation, il dissout les blocages emotionnels et guerit les blessures du passe. Placez-le dans votre espace de vie pour creer une atmosphere de paix et de tendresse.",
    category: 'cristaux',
    image: '/images/products/quartz-rose-brut.jpg',
    images: [
      '/images/products/quartz-rose-brut.jpg',
      '/images/products/quartz-rose-brut-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['amour', 'guerison', 'chakra coeur', 'douceur'],
  },
  {
    id: 'cristaux-003',
    slug: 'obsidienne-noire-miroir',
    name: 'Obsidienne Noire Miroir',
    price: 55,
    description:
      "Puissante pierre de protection et de verite, l'obsidienne noire est le bouclier du guerrier spirituel.",
    longDescription:
      "L'obsidienne noire miroir est une pierre volcanique d'une puissance remarquable. Utilisee par les chamans et les sorciers depuis des millenaires, elle agit comme un bouclier psychique impenetrable contre les energies negatives, les attaques spirituelles et les maledictions. Son pouvoir de miroir revele les verites cachees et aide a confronter ses ombres interieures. Pierre indispensable pour tout praticien de la magie, elle ancre profondement dans la terre tout en protegeant l'aura.",
    category: 'cristaux',
    image: '/images/products/obsidienne-noire.jpg',
    images: [
      '/images/products/obsidienne-noire.jpg',
      '/images/products/obsidienne-noire-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['protection', 'ancrage', 'verite', 'bouclier'],
  },

  // ── Runes ─────────────────────────────────────────────────
  {
    id: 'runes-001',
    slug: 'jeu-runes-futhark-pierre',
    name: 'Jeu de Runes Futhark en Pierre',
    price: 65,
    description:
      "Ensemble complet de 25 runes de l'ancien Futhark gravees dans la pierre naturelle.",
    longDescription:
      "Cet ensemble complet de 25 runes de l'ancien Futhark est grave a la main dans la pierre naturelle. Chaque rune porte en elle la sagesse des anciens peuples nordiques et la puissance des forces cosmiques. Livrees dans un pochon en velours noir, ces runes sont ideales pour la divination, la meditation et les rituels de protection. Un guide d'interpretation est inclus pour vous accompagner dans votre pratique runique.",
    category: 'runes',
    image: '/images/products/runes-pierre-futhark.jpg',
    images: [
      '/images/products/runes-pierre-futhark.jpg',
      '/images/products/runes-pierre-futhark-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['futhark', 'divination', 'nordique', 'pierre'],
  },
  {
    id: 'runes-002',
    slug: 'runes-bois-frene-sacre',
    name: 'Runes en Bois de Frene Sacre',
    price: 85,
    description:
      "Runes artisanales gravees dans le bois de frene, l'arbre sacre d'Yggdrasil.",
    longDescription:
      "Taillees dans le bois de frene — l'arbre cosmique Yggdrasil de la mythologie nordique — ces runes portent une connexion directe avec les neuf mondes. Chaque symbole est grave au pyrographe puis consacre lors d'un rituel sous la pleine lune. Le frene confere a ces runes une resonance particuliere avec les energies de sagesse, de voyance et de transformation. Ensemble de 25 runes livrees dans un etui en cuir artisanal.",
    category: 'runes',
    image: '/images/products/runes-bois-frene.jpg',
    images: [
      '/images/products/runes-bois-frene.jpg',
      '/images/products/runes-bois-frene-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['futhark', 'bois', 'yggdrasil', 'artisanal'],
  },
  {
    id: 'runes-003',
    slug: 'runes-os-cerf-ancestrales',
    name: "Runes en Os de Cerf Ancestrales",
    price: 120,
    description:
      "Runes traditionnelles gravees dans l'os de cerf, selon les methodes ancestrales nordiques.",
    longDescription:
      "Ces runes exceptionnelles sont gravees dans de l'os de cerf veritable, suivant les traditions ancestrales des peuples nordiques. L'os de cerf, symbole de regeneration et de connexion avec le monde sauvage, confere a chaque rune une puissance divinatoire remarquable. Teintures naturelles a base de sang de dragon (resine de Daemonorops) remplissent les gravures. Chaque jeu est unique et consacre individuellement. Livrees dans un coffret en bois sculpte.",
    category: 'runes',
    image: '/images/products/runes-os-cerf.jpg',
    images: [
      '/images/products/runes-os-cerf.jpg',
      '/images/products/runes-os-cerf-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['futhark', 'os', 'ancestral', 'premium'],
  },

  // ── Tarot ─────────────────────────────────────────────────
  {
    id: 'tarot-001',
    slug: 'tarot-marseille-traditionnel',
    name: 'Tarot de Marseille Traditionnel',
    price: 55,
    description:
      "Le classique Tarot de Marseille, 78 lames aux couleurs vibrantes pour une lecture profonde et authentique.",
    longDescription:
      "Ce Tarot de Marseille traditionnel suit fidelement l'iconographie classique des maitres cartiers du XVIIIe siecle. Les 78 lames aux couleurs vibrantes et aux symboles intemporels offrent une lecture riche et profonde. Que vous soyez debutant ou praticien confirme, ce jeu est un outil incontournable pour la divination, la connaissance de soi et la guidance spirituelle. Livre avec un guide d'interpretation detaille en francais.",
    category: 'tarot',
    image: '/images/products/tarot-marseille.jpg',
    images: [
      '/images/products/tarot-marseille.jpg',
      '/images/products/tarot-marseille-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['tarot', 'marseille', 'classique', 'divination'],
  },
  {
    id: 'tarot-002',
    slug: 'oracle-des-runes-nordiques',
    name: 'Oracle des Runes Nordiques',
    price: 48,
    description:
      "Jeu d'oracle de 25 cartes illustrees representant les runes du Futhark ancien avec leurs messages.",
    longDescription:
      "L'Oracle des Runes Nordiques est un pont unique entre l'art du tarot et la sagesse runique. Chaque carte est magnifiquement illustree et represente une rune du Futhark ancien accompagnee de son message spirituel. Les illustrations evoquent les paysages mythiques du Nord et les dieux de la tradition nordique. Ce jeu est parfait pour ceux qui souhaitent explorer la sagesse des runes a travers un support visuel riche et inspirant.",
    category: 'tarot',
    image: '/images/products/oracle-runes-nordiques.jpg',
    images: [
      '/images/products/oracle-runes-nordiques.jpg',
      '/images/products/oracle-runes-nordiques-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['oracle', 'runes', 'nordique', 'cartes'],
  },
  {
    id: 'tarot-003',
    slug: 'tarot-des-sorciers',
    name: 'Tarot des Sorciers',
    price: 62,
    description:
      "Un tarot moderne inspire par les traditions de sorcellerie, 78 lames aux illustrations envoutantes.",
    longDescription:
      "Le Tarot des Sorciers est un jeu de 78 lames cree specialement pour les praticiens de la magie moderne. Ses illustrations envoutantes melent symbolisme ancien et esthetique contemporaine, creant un outil de divination puissant et intuitif. Chaque arcane est impregne d'une energie unique qui facilite la connexion avec les forces invisibles. Les bordures noires et les details dores ajoutent une touche d'elegance a ce jeu exceptionnel.",
    category: 'tarot',
    image: '/images/products/tarot-sorciers.jpg',
    images: [
      '/images/products/tarot-sorciers.jpg',
      '/images/products/tarot-sorciers-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['tarot', 'sorcellerie', 'moderne', 'magie'],
  },

  // ── Herbes & Encens ───────────────────────────────────────
  {
    id: 'herbes-001',
    slug: 'sauge-blanche-baton-purification',
    name: 'Baton de Sauge Blanche de Purification',
    price: 22,
    description:
      "Baton de sauge blanche de Californie pour la purification des espaces et de l'aura.",
    longDescription:
      "Ce baton de sauge blanche (Salvia apiana) est recolte de maniere durable en Californie. Utilisee depuis des millenaires par les peuples autochtones, la sauge blanche est la plante de purification par excellence. Allumez le baton et laissez la fumee sacree nettoyer votre espace de toute energie negative, stagnante ou malveillante. Ideal avant un rituel, une seance de divination ou simplement pour rafraichir l'energie de votre maison.",
    category: 'herbes-encens',
    image: '/images/products/sauge-blanche.jpg',
    images: [
      '/images/products/sauge-blanche.jpg',
      '/images/products/sauge-blanche-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['purification', 'sauge', 'fumigation', 'nettoyage'],
  },
  {
    id: 'herbes-002',
    slug: 'encens-oliban-resine-sacree',
    name: "Resine d'Oliban Sacree",
    price: 28,
    description:
      "Resine d'oliban (frankincense) de qualite ceremonielle pour l'elevation spirituelle et la protection.",
    longDescription:
      "L'oliban, ou encens sacre, est la resine la plus venerable de l'histoire spirituelle de l'humanite. Utilisee dans les temples depuis l'Egypte ancienne, cette resine de qualite ceremonielle degage un parfum profond et enveloppant lorsqu'elle est brulee sur du charbon ardent. Elle eleve la vibration de tout espace, facilite la meditation profonde et cree un pont entre le monde visible et invisible. Sachet de 50g de resine pure en grains.",
    category: 'herbes-encens',
    image: '/images/products/oliban-resine.jpg',
    images: [
      '/images/products/oliban-resine.jpg',
      '/images/products/oliban-resine-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['encens', 'oliban', 'ceremonie', 'elevation'],
  },
  {
    id: 'herbes-003',
    slug: 'melange-herbes-protection-rituelle',
    name: 'Melange de Protection Rituelle',
    price: 32,
    description:
      "Melange artisanal d'herbes sacrees pour les rituels de protection : romarin, rue, basilic et sel noir.",
    longDescription:
      "Ce melange de protection rituelle est compose selon une recette ancienne transmise de generation en generation. Il reunit le romarin (purification), la rue (brise-sort), le basilic sacre (protection divine) et le sel noir (absorption des negativites). Utilisez-le pour tracer des cercles de protection, charger vos amulettes ou ajouter a un bain rituel. Chaque sachet est prepare a la main et consacre lors du dernier croissant de lune. Sachet de 30g.",
    category: 'herbes-encens',
    image: '/images/products/melange-protection.jpg',
    images: [
      '/images/products/melange-protection.jpg',
      '/images/products/melange-protection-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['protection', 'herbes', 'rituel', 'brise-sort'],
  },

  // ── Bougies ───────────────────────────────────────────────
  {
    id: 'bougies-001',
    slug: 'bougie-rituelle-noire-protection',
    name: 'Bougie Rituelle Noire de Protection',
    price: 25,
    description:
      "Bougie en cire d'abeille noire, chargee pour les rituels de protection et de bannissement.",
    longDescription:
      "Cette bougie rituelle noire est coulee a la main dans de la cire d'abeille pure, teintee avec du charbon actif naturel. Le noir est la couleur de l'absorption et du bannissement — cette bougie est specialement concue pour les rituels de protection, de rupture des maledictions et d'eloignement des energies negatives. Chargee avec de l'huile essentielle de sauge et des eclats d'obsidienne, elle brule pendant environ 8 heures. Gravee a la main avec des sigils de protection.",
    category: 'bougies',
    image: '/images/products/bougie-noire-protection.jpg',
    images: [
      '/images/products/bougie-noire-protection.jpg',
      '/images/products/bougie-noire-protection-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['protection', 'bannissement', 'rituel', 'bougie noire'],
  },
  {
    id: 'bougies-002',
    slug: 'bougie-blanche-purification-lumiere',
    name: 'Bougie Blanche Lumiere Divine',
    price: 22,
    description:
      "Bougie blanche en cire de soja, infusee d'huiles sacrees pour la purification et l'illumination.",
    longDescription:
      "La bougie blanche est un pilier de toute pratique magique. Symbole de purete, de lumiere et de connexion divine, cette bougie est coulee en cire de soja naturelle et infusee d'huile essentielle de lotus blanc et de copeaux d'argent. Elle est ideale pour les rituels de purification, les prieres, les consacrations et l'ouverture de tout travail magique. Sa flamme douce et stable cree une atmosphere sacree propice a la communion avec le divin. Duree de combustion : environ 10 heures.",
    category: 'bougies',
    image: '/images/products/bougie-blanche-lumiere.jpg',
    images: [
      '/images/products/bougie-blanche-lumiere.jpg',
      '/images/products/bougie-blanche-lumiere-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['purification', 'lumiere', 'divin', 'bougie blanche'],
  },
  {
    id: 'bougies-003',
    slug: 'bougie-rouge-passion-volonte',
    name: 'Bougie Rouge Flamme de Volonte',
    price: 28,
    description:
      "Bougie rouge chargee pour les rituels d'amour, de passion et de renforcement de la volonte.",
    longDescription:
      "Le rouge est la couleur du feu interieur, de la passion et de la volonte indomptable. Cette bougie rituelle rouge est coulee en cire d'abeille, enrichie d'huile essentielle de rose de Damas et de poudre de cannelle. Elle est l'alliee ideale pour les rituels d'amour, d'attraction, de courage et de manifestation des desirs profonds. Gravee de symboles venus et de sigils de passion, elle brule avec une intensite qui reflète la force de vos intentions. Duree : environ 8 heures.",
    category: 'bougies',
    image: '/images/products/bougie-rouge-passion.jpg',
    images: [
      '/images/products/bougie-rouge-passion.jpg',
      '/images/products/bougie-rouge-passion-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['amour', 'passion', 'volonte', 'bougie rouge'],
  },

  // ── Bijoux ────────────────────────────────────────────────
  {
    id: 'bijoux-001',
    slug: 'pendentif-arbre-de-vie-amethyste',
    name: "Pendentif Arbre de Vie en Amethyste",
    price: 68,
    description:
      "Pendentif Arbre de Vie en fil d'argent avec eclats d'amethyste, symbole de connexion universelle.",
    longDescription:
      "Ce pendentif Arbre de Vie est une creation artisanale realisee en fil d'argent sterling 925. Les branches de l'arbre cosmique sont ornees d'eclats d'amethyste naturelle, creant un bijou a la fois magnifique et energetiquement puissant. L'Arbre de Vie represente la connexion entre le ciel et la terre, entre le monde visible et invisible. Porte au quotidien, ce pendentif favorise l'intuition, la sagesse et la protection spirituelle. Chaine en argent de 45 cm incluse.",
    category: 'bijoux',
    image: '/images/products/pendentif-arbre-vie.jpg',
    images: [
      '/images/products/pendentif-arbre-vie.jpg',
      '/images/products/pendentif-arbre-vie-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['arbre de vie', 'amethyste', 'argent', 'protection'],
  },
  {
    id: 'bijoux-002',
    slug: 'bracelet-oeil-de-tigre-protection',
    name: "Bracelet Oeil de Tigre Gardien",
    price: 42,
    description:
      "Bracelet en perles d'oeil de tigre naturel, pierre de courage et de protection contre le mauvais oeil.",
    longDescription:
      "Ce bracelet est compose de perles d'oeil de tigre naturel de 8 mm, soigneusement selectionnees pour leurs reflets dores et chatoyants. L'oeil de tigre est une pierre de protection ancestrale, reconnue pour son pouvoir de renvoyer les energies negatives a leur emetteur et de proteger contre le mauvais oeil. Elle renforce le courage, la confiance en soi et la clarte mentale. Monte sur un elastique resistant, ce bracelet s'adapte a tous les poignets et se porte au quotidien comme un talisman protecteur.",
    category: 'bijoux',
    image: '/images/products/bracelet-oeil-tigre.jpg',
    images: [
      '/images/products/bracelet-oeil-tigre.jpg',
      '/images/products/bracelet-oeil-tigre-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['oeil de tigre', 'protection', 'courage', 'bracelet'],
  },
  {
    id: 'bijoux-003',
    slug: 'bague-triple-lune-argent',
    name: 'Bague Triple Lune en Argent',
    price: 78,
    description:
      "Bague en argent sterling representant la Triple Lune, symbole de la deesse et des cycles feminins.",
    longDescription:
      "Cette bague en argent sterling 925 represente le symbole sacre de la Triple Lune — la lune croissante, pleine et decroissante — incarnant les trois visages de la Deesse : la Vierge, la Mere et la Sage. Portee par les praticiens de la Wicca et de la sorcellerie, elle honore les cycles lunaires et la puissance feminine. Le centre est orne d'une petite pierre de lune naturelle qui capte la lumiere comme un eclat d'astre nocturne. Disponible en plusieurs tailles.",
    category: 'bijoux',
    image: '/images/products/bague-triple-lune.jpg',
    images: [
      '/images/products/bague-triple-lune.jpg',
      '/images/products/bague-triple-lune-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['triple lune', 'deesse', 'argent', 'pierre de lune'],
  },

  // ── Orgonites ─────────────────────────────────────────────
  {
    id: 'orgonites-001',
    slug: 'pyramide-orgonite-7-chakras',
    name: 'Pyramide Orgonite 7 Chakras',
    price: 95,
    description:
      "Pyramide orgonite artisanale avec les 7 pierres des chakras, purifie et harmonise l'energie ambiante.",
    longDescription:
      "Cette pyramide orgonite est une creation artisanale composee de resine, de copeaux de cuivre et d'aluminium, et des sept pierres correspondant aux chakras principaux : jaspe rouge, cornaline, citrine, aventurine, lapis-lazuli, amethyste et quartz clair. Basee sur les travaux de Wilhelm Reich, l'orgonite transforme les energies negatives (DOR) en energie positive (OR). Placee dans une piece, elle purifie l'atmosphere, harmonise le champ energetique et protege contre les ondes electromagnetiques. Hauteur : 12 cm.",
    category: 'orgonites',
    image: '/images/products/pyramide-orgonite-chakras.jpg',
    images: [
      '/images/products/pyramide-orgonite-chakras.jpg',
      '/images/products/pyramide-orgonite-chakras-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['orgonite', 'chakras', 'pyramide', 'harmonisation'],
  },
  {
    id: 'orgonites-002',
    slug: 'pendentif-orgonite-protection',
    name: 'Pendentif Orgonite Bouclier Energetique',
    price: 52,
    description:
      "Pendentif orgonite portable avec tourmaline noire et cuivre, bouclier contre les energies negatives.",
    longDescription:
      "Ce pendentif orgonite est un bouclier energetique portable concu pour vous proteger au quotidien. Compose de resine cristalline, de spirale de cuivre et de tourmaline noire, il cree un champ de protection autour de son porteur. La tourmaline noire est reputee pour sa capacite a absorber et transmuter les energies negatives, tandis que la spirale de cuivre amplifie le flux energetique positif. Ideal pour les personnes sensibles aux energies ou travaillant dans des environnements charges. Cordon en cuir inclus.",
    category: 'orgonites',
    image: '/images/products/pendentif-orgonite.jpg',
    images: [
      '/images/products/pendentif-orgonite.jpg',
      '/images/products/pendentif-orgonite-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['orgonite', 'protection', 'pendentif', 'tourmaline'],
  },
  {
    id: 'orgonites-003',
    slug: 'disque-orgonite-fleur-de-vie',
    name: 'Disque Orgonite Fleur de Vie',
    price: 75,
    description:
      "Disque orgonite grave du symbole de la Fleur de Vie, harmoniseur d'espace et rechargeur de cristaux.",
    longDescription:
      "Ce disque orgonite est grave du symbole sacre de la Fleur de Vie, une figure geometrique presente dans toutes les traditions spirituelles du monde. Compose de resine, de copeaux metalliques et de cristal de quartz, il est un puissant harmoniseur d'espace. Utilisez-le comme base pour recharger vos cristaux, comme support de meditation ou comme plaque de purification pour vos bijoux esoteriques. Le symbole de la Fleur de Vie amplifie les proprietes de l'orgonite et cree un champ d'harmonie universel. Diametre : 10 cm.",
    category: 'orgonites',
    image: '/images/products/disque-orgonite-fleur-vie.jpg',
    images: [
      '/images/products/disque-orgonite-fleur-vie.jpg',
      '/images/products/disque-orgonite-fleur-vie-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['orgonite', 'fleur de vie', 'geometrie sacree', 'harmonisation'],
  },

  // ── Baguettes Magiques ────────────────────────────────────
  {
    id: 'baguettes-001',
    slug: 'baguette-chene-ancestral-quartz',
    name: 'Baguette en Chene Ancestral avec Quartz',
    price: 145,
    description:
      "Baguette magique sculptee dans le chene centenaire, couronnee d'une pointe de quartz clair.",
    longDescription:
      "Cette baguette magique est sculptee a la main dans une branche de chene centenaire, arbre sacre des druides et symbole de force, de sagesse et d'endurance. Sa pointe est couronnee d'un cristal de quartz clair naturel qui amplifie et dirige l'energie magique avec precision. Des entrelacs celtiques sont graves le long du manche, honorant la tradition druidique. Chaque baguette est unique et consacree lors d'un rituel de pleine lune. Longueur approximative : 30 cm. Livree dans un ecrin en velours.",
    category: 'baguettes-magiques',
    image: '/images/baguettes/baguette-chene-quartz.jpg',
    images: [
      '/images/baguettes/baguette-chene-quartz.jpg',
      '/images/baguettes/baguette-chene-quartz-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['chene', 'quartz', 'druide', 'celtique'],
  },
  {
    id: 'baguettes-002',
    slug: 'baguette-sureau-amethyste',
    name: "Baguette en Sureau avec Amethyste",
    price: 165,
    description:
      "Baguette en bois de sureau, le bois des sorciers, sertie d'une amethyste pour l'intuition.",
    longDescription:
      "Le sureau est connu dans les traditions europeennes comme le bois des sorciers et des fees. Cette baguette exceptionnelle est taillee dans une branche de sureau recolte avec respect et ceremonie. Son coeur est une amethyste naturelle qui confere a la baguette un pouvoir d'intuition et de clairvoyance remarquable. Des runes protectrices sont gravees sur le manche. Parfaite pour les travaux de divination, les enchantements et la communication avec le monde des esprits. Longueur approximative : 28 cm.",
    category: 'baguettes-magiques',
    image: '/images/baguettes/baguette-sureau-amethyste.jpg',
    images: [
      '/images/baguettes/baguette-sureau-amethyste.jpg',
      '/images/baguettes/baguette-sureau-amethyste-2.jpg',
    ],
    inStock: true,
    featured: true,
    tags: ['sureau', 'amethyste', 'sorcier', 'divination'],
  },
  {
    id: 'baguettes-003',
    slug: 'baguette-noisetier-labradorite',
    name: 'Baguette en Noisetier avec Labradorite',
    price: 155,
    description:
      "Baguette traditionnelle en bois de noisetier, pierre de labradorite pour la magie et la transformation.",
    longDescription:
      "Le noisetier est le bois traditionnel de la baguette magique dans les traditions celtiques et europeennes. Cette baguette est taillée dans une branche de noisetier sauvage, recoltee a la croisee des chemins selon l'ancien rituel. Sa pierre de labradorite aux reflets iridescents est un puissant catalyseur de transformation et de magie. Le noisetier favorise la sagesse, la poesie et la communication avec les mondes subtils. Ornee de fils de cuivre en spirale qui canalisent l'energie. Longueur approximative : 32 cm.",
    category: 'baguettes-magiques',
    image: '/images/baguettes/baguette-noisetier-labradorite.jpg',
    images: [
      '/images/baguettes/baguette-noisetier-labradorite.jpg',
      '/images/baguettes/baguette-noisetier-labradorite-2.jpg',
    ],
    inStock: true,
    featured: false,
    tags: ['noisetier', 'labradorite', 'celtique', 'transformation'],
  },
];
