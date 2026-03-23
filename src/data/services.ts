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
    slug: 'soin-rituel',
    name: 'Le Soin Rituel',
    price: '125$ +taxes',
    duration: '60 a 90 minutes',
    description:
      "Soin energetique sur chaise a massage avec points de pression et techniques de respiration, faisant appel aux 4 elements et a la magie naturelle.",
    longDescription:
      "Le Soin Rituel est une experience unique et profondement personnalisee. Sur chaise a massage, Noctura travaille avec des points de pression et des techniques de respiration, faisant appel aux 4 elements et a la magie naturelle. Plusieurs outils spirituels sont utilises selon chaque cas : bol chantant, baguettes de radiesthesie, batons d'Horus, pierres et cristaux, musique et chants inspires, fumigation d'herbes sacrees, et bien plus encore. Chaque seance est unique et s'adapte aux besoins de chaque personne rencontree. Le soin agit sur les corps subtils pour retablir l'equilibre energetique, liberer les blocages et restaurer votre vitalite.",
    image: '/images/services/soin-rituel.jpg',
    icon: 'ᛊ',
    features: [
      'Soin energetique sur chaise a massage',
      'Points de pression et techniques de respiration',
      'Travail avec les 4 elements et la magie naturelle',
      'Bol chantant, baguettes de radiesthesie, batons d\'Horus',
      'Pierres et cristaux de guerison',
      'Musique et chants inspires',
      'Fumigation d\'herbes sacrees',
      'Chaque seance est unique et adaptee a vos besoins',
    ],
  },
  {
    id: 'service-002',
    slug: 'tirage-runes-cartes-combines',
    name: 'Tirage de Runes Futhark & Cartes Divinatoires Combines',
    price: '95$ +taxes',
    duration: '60 minutes',
    description:
      "Tirage de Runes Futhark (art divinatoire nordique) combine a un tirage de Cartes de Tarot ou d'Oracle, selectionne selon l'energie de la personne rencontree.",
    longDescription:
      "Le tirage combine les Runes Futhark, un art divinatoire nordique, a un tirage de Cartes de Tarot ou d'Oracle selectionne par Noctura selon l'energie de la personne rencontree. Les Runes Futhark sont un alphabet compose de 25 lettres sacrees qui existent depuis plus de 3 millenaires. Elles sont l'heritage du peuple paien scandinave, les proto-germains ou plus communement appeles les Vikings. On utilise ces 25 symboles graves sur de petites pierres que l'on jette sur une fourrure ou un tissus pour en faire la lecture de plusieurs destins possibles, selon les prises de decisions et les hesitations en suspend dans l'esprit de la personne qui les consulte. Combinees avec les cartes, les Runes Futhark nous font part des resultats et des risques potentiels lorsqu'on prend l'un des chemins reveles. Ainsi, suite a la lecture des Runes, il est plus facile de percevoir l'avenue la plus interessante a suivre.",
    image: '/images/services/tirage-tarot-runes.jpg',
    icon: 'ᛈ',
    features: [
      'Tirage de Runes Futhark (art divinatoire nordique)',
      'Combine a un tirage de Cartes de Tarot ou d\'Oracle',
      'Selection du jeu selon votre energie personnelle',
      'Lecture de plusieurs destins possibles',
      'Analyse des risques et resultats potentiels de chaque chemin',
      'Guidance pour percevoir l\'avenue la plus interessante',
    ],
  },
  {
    id: 'service-003',
    slug: 'tirage-simple',
    name: 'Tirage Simple',
    price: '60$ +taxes',
    duration: '30 minutes',
    description:
      "Tirage de Cartes divinatoires ou de Runes Futhark pour une question precise.",
    longDescription:
      "Le Tirage Simple est ideal pour obtenir une reponse claire et directe a une question precise. Vous choisissez votre support — Cartes divinatoires ou Runes Futhark — et Noctura realise un tirage cible pour eclairer votre situation. Ce format plus court est parfait lorsque vous avez une question specifique en tete et que vous cherchez une guidance rapide mais profonde. A noter que le destin change constamment. Il est bon de voir les tirages divinatoires, que ce soit les cartes ou les Runes, comme une guidance interieure qui nous revele a nous-meme, plutot que de la pure voyance dans le futur. Les outils spirituels nous enseignent a maitriser notre personne afin de faconner notre propre futur.",
    image: '/images/services/tirage-simple.jpg',
    icon: 'ᚨ',
    features: [
      'Cartes divinatoires ou Runes Futhark au choix',
      'Pour une question precise',
      'Reponse claire et directe',
      'Guidance rapide mais profonde',
      'Disponible en personne ou a distance',
    ],
  },
  {
    id: 'service-004',
    slug: 'cours-formations',
    name: 'Formations & Cours Prives',
    price: 89.99,
    duration: '60 minutes',
    description:
      "Session individuelle de formation, sur place ou en virtuel, selon vos besoins. Ideale pour developper des fondations solides dans l'univers energetique et spirituel.",
    longDescription:
      "Les Formations & Cours Prives de Runes & Magie vous offrent un apprentissage personnalise dans l'univers energetique et spirituel. Que ce soit en session individuelle (Cours Prive) ou en Formation de Base, chaque cours est adapte a vos besoins et a votre rythme. Les sessions sont disponibles sur place ou en virtuel. Les formations couvrent un large eventail de sujets : initiation aux runes et au Futhark ancien, lecture du Tarot, magie des cristaux et lithotherapie, herbalisme magique, creation de rituels, et bien plus encore. Chaque cours allie theorie et pratique pour vous transmettre un savoir authentique et applicable.",
    image: '/images/services/cours-formations.jpg',
    icon: 'ᚱ',
    features: [
      'Cours Prive : 89.99$ / 60 minutes',
      'Formation de Base : 89.99$ / 60 minutes',
      'Session individuelle personnalisee',
      'Disponible sur place ou en virtuel',
      'Initiation aux runes et au Futhark ancien',
      'Apprentissage de la lecture du Tarot',
      'Magie des cristaux et lithotherapie',
      'Fondations solides dans l\'univers energetique et spirituel',
    ],
  },
  {
    id: 'service-005',
    slug: 'animation-de-groupe',
    name: 'Soiree d\'Animation',
    price: 'A partir de 245$',
    duration: '2 a 3 heures',
    description:
      "Soiree decouverte en groupe avec capsules au choix : Tarot, Projection d'energie, Lithomancie, Runes Futhark. Location de salle incluse.",
    longDescription:
      "Les Soirees d'Animation de groupe sont des experiences uniques a vivre entre amis, en famille ou entre collegues. La Salle de la Chapelle Cachee est reservee pour vous, avec tables et chaises fournies sur place, un petit frigo a disposition pour nourriture et breuvages, et un acces a la salle 60 minutes avant pour la decoration. L'animation dure 2 heures, en 2 blocs, avec une pause de 30 minutes entre les blocs pour un repas ou une collation. Vous choisissez vos capsules decouvertes avec Noctura lors de la reservation : Tarot, Projection d'energie, Lithomancie, Runes Futhark et autres options disponibles. Permis d'alcool inclus (a prevoir et confirmer plusieurs jours a l'avance). Reservation obligatoire.",
    image: '/images/services/animation-groupe.jpg',
    icon: 'ᛁ',
    features: [
      '4 personnes : 245$ / 2 heures (Boutique)',
      '5 personnes : 300$ / 2 heures (Boutique)',
      '6 personnes : 350$ / 2 heures (Boutique)',
      '7 personnes : 400$ / 3 heures (Chapelle Cachee)',
      '8 a 9 personnes : 450$ / 3 heures (Chapelle Cachee)',
      '10 personnes : 500$ / 3 heures (Chapelle Cachee)',
      'Capsules au choix : Tarot, Projection d\'energie, Lithomancie, Runes Futhark',
      'Location de salle, tables et chaises incluses',
    ],
  },
  {
    id: 'service-006',
    slug: 'ceremonies',
    name: 'Ceremonies de Noctura',
    price: 'A partir de 449.99$',
    duration: 'Variable selon la ceremonie',
    description:
      "Ceremonies spirituelles personnalisees : baptemes, funerailles, mariages et autres celebrations. Chaque ceremonie est ecrite, preparee et guidee sur mesure.",
    longDescription:
      "Chaque ceremonie est ecrite, preparee et guidee sur mesure. L'approche Noctura allie rituels symboliques, guidance intuitive et soutien aux familles ou aux couples. Que ce soit pour un bapteme, des funerailles, un mariage ou toute autre celebration de passage, chaque ceremonie est concue en etroite collaboration avec vous pour creer un moment inoubliable et profondement significatif. Les ceremonies comprennent une rencontre gratuite prealable, une conception entierement personnalisee, et la fourniture de tous les elements rituels necessaires.",
    image: '/images/services/ceremonies.jpg',
    icon: 'ᚹ',
    features: [
      'Bapteme : 449.99$ — ceremonie personnalisee, tirage spirituel pour l\'enfant',
      'Funerailles : 449.99$ — guidance spirituelle, tirage pour le defunt',
      'Mariage : 924.99$ — mariage legal, conception personnalisee de la ceremonie',
      'Autres ceremonies : 449.99$ — renouvellements de voeux, rituels saisonniers, rituels de passage',
      'Rencontre gratuite prealable incluse',
      'Reservation avec depot de 50% (mariage : depot 200$)',
      'Plans de paiement disponibles pour les mariages',
      'Deplacement inclus ou virtuel si trop eloigne',
    ],
  },
];
