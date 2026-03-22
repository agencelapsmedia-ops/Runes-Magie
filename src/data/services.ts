export interface Service {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  duration: string;
  description: string;
  longDescription: string;
  image: string;
  icon: string;
  features: string[];
}

export const services: Service[] = [
  {
    id: 'service-001',
    slug: 'sessions-de-lecture',
    name: 'Sessions de Lecture',
    price: 75,
    duration: '60 minutes',
    description:
      "Lecture intuitive de votre energie et guidance spirituelle personnalisee pour eclairer votre chemin de vie.",
    longDescription:
      "Les Sessions de Lecture sont un voyage au coeur de votre etre. Grace a un don inne de clairvoyance et des annees de pratique, je lis les energies qui vous entourent et qui vous habitent. Cette lecture intuitive revele les influences passees qui faconnent votre present, les forces invisibles a l'oeuvre dans votre vie et les chemins qui s'ouvrent devant vous. Chaque session est unique et adaptee a vos besoins : que vous cherchiez des reponses sur votre vie sentimentale, professionnelle ou spirituelle, la lecture vous offre une perspective nouvelle et eclairante. Je canalise les messages de vos guides spirituels et vous transmets leur sagesse avec bienveillance et honnetete. Cette session se deroule dans un espace sacre et confidentiel, en personne ou a distance.",
    image: '/images/services/lecture-intuitive.jpg',
    icon: 'ᚨ',
    features: [
      'Lecture intuitive de votre champ energetique',
      'Canalisation des messages de vos guides spirituels',
      'Identification des blocages et influences karmiques',
      'Guidance personnalisee pour votre chemin de vie',
      'Reponses a vos questions specifiques',
      'Disponible en personne ou a distance',
      'Compte-rendu ecrit envoye apres la session',
    ],
  },
  {
    id: 'service-002',
    slug: 'tirages-tarot-runes',
    name: 'Tirages de Tarot & Runes',
    price: 60,
    duration: '45 minutes',
    description:
      "Tirage divinatoire par le Tarot de Marseille ou les Runes du Futhark pour eclairer vos choix et reveler votre destin.",
    longDescription:
      "Le Tarot et les Runes sont des portes ouvertes sur les mysteres du temps et du destin. Lors de cette seance, je realise un tirage personnalise selon vos questions et votre situation. Le Tarot de Marseille, avec ses 78 arcanes, offre une lecture riche et nuancee des influences a l'oeuvre dans votre vie. Les Runes du Futhark ancien, heritees des traditions nordiques, parlent un langage plus brut et direct, revélant les forces primordiales qui gouvernent votre chemin. Vous pouvez choisir le support qui vous appelle, ou je peux combiner les deux pour une lecture croisee d'une profondeur remarquable. Chaque tirage est accompagne d'une interpretation detaillee et de conseils pratiques pour naviguer les energies revelees.",
    image: '/images/services/tirage-tarot-runes.jpg',
    icon: 'ᛈ',
    features: [
      'Choix du support : Tarot de Marseille, Runes ou tirage croise',
      'Interpretation detaillee de chaque carte ou rune',
      'Exploration du passe, present et futur',
      'Guidance pratique et conseils adaptes',
      'Plusieurs types de tirages disponibles (croix celtique, tirage en 3 cartes, etc.)',
      'Disponible en personne ou a distance',
    ],
  },
  {
    id: 'service-003',
    slug: 'soins-energetiques',
    name: 'Soins Energetiques',
    price: 90,
    duration: '75 minutes',
    description:
      "Soin energetique complet pour retablir l'equilibre de vos chakras, liberer les blocages et restaurer votre vitalite.",
    longDescription:
      "Les Soins Energetiques sont une approche holistique de la guerison qui agit sur les corps subtils — ethérique, emotionnel, mental et spirituel. Lors de cette seance, je travaille avec les cristaux, le son et l'imposition des mains pour retablir la circulation harmonieuse de l'energie vitale dans votre corps. Le soin commence par un scan energetique complet de vos chakras et de votre aura, identifiant les zones de blocage, de fuite ou de stagnation. Puis, a l'aide de pierres soigneusement selectionnees et de techniques transmises par la lignee des guerisseurs, je restaure l'equilibre de chaque centre energetique. Vous ressentez une profonde detente, un soulagement des tensions et un regain de vitalite. Plusieurs seances peuvent etre necessaires pour les desequilibres profonds.",
    image: '/images/services/soins-energetiques.jpg',
    icon: 'ᛊ',
    features: [
      'Scan energetique complet des chakras et de l\'aura',
      'Nettoyage et reequilibrage des 7 chakras principaux',
      'Travail avec les cristaux de guerison',
      'Harmonisation des corps subtils',
      'Liberation des memoires cellulaires',
      'Techniques de son et de vibration',
      'Recommandations post-soin pour maintenir l\'equilibre',
    ],
  },
  {
    id: 'service-004',
    slug: 'deblocage-emotionnel',
    name: 'Deblocage Emotionnel',
    price: 85,
    duration: '60 minutes',
    description:
      "Seance de liberation des emotions bloquees, des schemas repetitifs et des memoires karmiques qui entravent votre evolution.",
    longDescription:
      "Le Deblocage Emotionnel est un travail profond de liberation des emotions enfouies, des traumas non resolus et des schemas karmiques qui se repetent dans votre vie. Nous portons tous en nous des blessures — certaines de cette vie, d'autres heritees de nos vies anterieures ou de notre lignee familiale. Ces memoires non traitees creent des blocages qui se manifestent sous forme de peurs irrationnelles, de relations toxiques repetitives, de maladies ou d'un sentiment persistant de stagnation. Lors de cette seance, j'utilise une combinaison de techniques ancestrales — voyage chamanique, travail avec les runes de guerison, liberation des cordes energetiques et rituels de pardon — pour identifier et dissoudre ces blocages a leur source. Le processus peut etre intense mais profondement liberateur.",
    image: '/images/services/deblocage-emotionnel.jpg',
    icon: 'ᛁ',
    features: [
      'Identification des blocages emotionnels et karmiques',
      'Liberation des memoires transgenerationnelles',
      'Rupture des schemas repetitifs negatifs',
      'Coupure des liens toxiques et cordes energetiques',
      'Rituels de pardon et de reconciliation interieure',
      'Travail avec les runes de guerison',
      'Suivi personnalise entre les seances',
    ],
  },
  {
    id: 'service-005',
    slug: 'cours-formations',
    name: 'Cours & Formations',
    price: 120,
    duration: '2 heures par session',
    description:
      "Ecole de sorcellerie et de magie pratique : apprenez les arts ancestraux de la divination, des rituels et de la magie naturelle.",
    longDescription:
      "Bienvenue a l'Ecole de Sorcellerie de Runes & Magie. Nos cours et formations vous ouvrent les portes des arts ancestraux de la magie, de la divination et de la spiritualite pratique. Que vous soyez novice curieux ou praticien souhaitant approfondir vos connaissances, nos programmes sont concus pour vous transmettre un savoir authentique et applicable. Les formations couvrent un large eventail de sujets : initiation aux runes et au Futhark, lecture du Tarot de Marseille, magie des cristaux, herbalisme magique, creation de rituels, fabrication de talismans et d'amulettes, travail avec les cycles lunaires, et bien plus encore. Chaque cours allie theorie et pratique, avec des exercices concrets et un suivi personnalise. Les formations sont disponibles en individuel ou en petit groupe (maximum 6 personnes).",
    image: '/images/services/cours-formations.jpg',
    icon: 'ᚱ',
    features: [
      'Initiation aux runes et au Futhark ancien',
      'Apprentissage de la lecture du Tarot',
      'Magie des cristaux et lithotherapie',
      'Herbalisme magique et potions',
      'Creation de rituels et de cercles sacres',
      'Fabrication de talismans et d\'amulettes',
      'Formations individuelles ou en petit groupe',
      'Support de cours et materiel inclus',
    ],
  },
  {
    id: 'service-006',
    slug: 'ceremonies',
    name: 'Ceremonies',
    price: 'Sur devis',
    duration: 'Variable selon la ceremonie',
    description:
      "Ceremonies spirituelles personnalisees : mariages sacres, baptemes de lumiere et celebrations de passage pour honorer les moments sacres de la vie.",
    longDescription:
      "Les grandes etapes de la vie meritent d'etre honorees par des ceremonies qui resonnent avec votre ame et vos croyances. Je celebre des ceremonies spirituelles personnalisees pour ceux qui cherchent une alternative aux rites traditionnels ou qui souhaitent ajouter une dimension sacree a leurs celebrations. Les Mariages Sacres unissent les ames par des rituels de handfasting (union des mains), des voeux personnalises et la benediction des elements. Les Baptemes de Lumiere accueillent les nouveaux etres dans la communaute avec douceur et intention. Les Celebrations de Passage honorent les transitions — entree dans l'age adulte, menopause, retraite — avec reverence et reconnaissance. Les Ceremonies de Memoire accompagnent le depart des etres chers avec amour et esperance. Chaque ceremonie est concue sur mesure, en etroite collaboration avec vous, pour creer un moment inoubliable et profondement significatif.",
    image: '/images/services/ceremonies.jpg',
    icon: 'ᚹ',
    features: [
      'Mariages sacres et rituels de handfasting',
      'Baptemes de lumiere et ceremonies de bienvenue',
      'Celebrations de passage et rites de transition',
      'Ceremonies funeraires et celebrations de memoire',
      'Conception entierement personnalisee',
      'Rencontre prealable pour definir vos souhaits',
      'Fourniture des elements rituels (bougies, encens, cristaux)',
      'Disponible partout au Quebec',
    ],
  },
];
