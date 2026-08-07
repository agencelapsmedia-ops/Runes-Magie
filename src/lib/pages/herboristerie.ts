import { FONTS, type FontKey } from '@/lib/service-landing';

/**
 * Contenu de la page « Herboristerie ».
 *
 * ⚠️ Ces textes sont une PREMIÈRE VERSION, à faire relire par Annabelle : ils
 * décrivent une approche sans lui prêter de propos qu'elle n'a pas tenus. Ils
 * s'éditent depuis la page publique, comme partout ailleurs.
 *
 * Registre volontairement traditionnel et symbolique, jamais thérapeutique :
 * l'herboristerie n'est pas un acte médical et la page le dit explicitement.
 * Toute reformulation devrait garder cette limite.
 *
 * Même principe que les autres gabarits : champs plats, un bouton d'édition
 * par élément, et un champ vidé retombe sur sa valeur d'origine.
 */
const DEFAUTS = {
  // ── Hero ──────────────────────────────────────────────────────────────
  heroSurtitre: 'La voie des plantes',
  heroTitre: 'Herboristerie',
  heroAccroche: 'Le savoir des plantes, au service de ton chemin.',
  heroImage: '',
  heroImageAlt: 'Plantes séchées, mortier et flacons dans l’atelier d’herboristerie',

  // ── Ce qu'est l'herboristerie ici ─────────────────────────────────────
  introTitre: 'L’herboristerie chez Runes & Magie',
  introTexte:
    'Les plantes accompagnent les gestes rituels depuis aussi longtemps qu’on célèbre, qu’on soigne et qu’on transmet.\n\n' +
    'Chez Runes & Magie, l’herboristerie n’est pas une pharmacie parallèle : c’est une manière d’entrer en relation avec le vivant. Reconnaître une plante, comprendre où elle pousse, à quelle saison la cueillir, ce que la tradition lui a confié — puis choisir en conscience de l’inviter dans un rituel, un espace ou un quotidien.\n\n' +
    'Cette branche se vit de trois façons : en consultation, en formation, et à travers les plantes et encens de la boutique.',
  introImage: '',
  introImageAlt: 'Herbes fraîchement cueillies posées sur une table de bois',

  // ── Notre approche (4 cartes) ─────────────────────────────────────────
  approcheTitre: 'Notre approche',
  approche1Titre: 'Cueillette respectueuse',
  approche1Texte:
    'Prendre peu, laisser la plante se refaire, et ne jamais récolter ce qu’on ne sait pas nommer.',
  approche1Icone: 'feuille',
  approche2Titre: 'Les plantes d’ici',
  approche2Texte:
    'Priorité à ce qui pousse sous notre climat et à ce que la tradition nordique et locale a retenu.',
  approche2Icone: 'sauge',
  approche3Titre: 'Plante et rituel',
  approche3Texte:
    'Une plante rejoint un rituel pour ce qu’elle représente autant que pour ce qu’elle est.',
  approche3Icone: 'mortier',
  approche4Titre: 'Prudence d’abord',
  approche4Texte:
    'Ce qui agit peut aussi nuire. Contre-indications, grossesse, allergies et médicaments : on en parle avant.',
  approche4Icone: 'mains',

  // ── Les plantes alliées ───────────────────────────────────────────────
  plantesTitre: 'Quelques plantes alliées',
  plantesIntro:
    'Un aperçu de ce que la tradition leur a confié. Ces associations sont symboliques et culturelles : elles ne remplacent aucun avis de santé.',
  plante1Nom: 'Armoise',
  plante1Latin: 'Artemisia vulgaris',
  plante1Note: 'La plante des passages et des songes, brûlée pour ouvrir et pour clore.',
  plante2Nom: 'Sauge',
  plante2Latin: 'Salvia officinalis',
  plante2Note: 'Associée depuis toujours à la purification des lieux et des objets.',
  plante3Nom: 'Camomille',
  plante3Latin: 'Matricaria chamomilla',
  plante3Note: 'Plante de l’apaisement et des commencements doux.',
  plante4Nom: 'Lavande',
  plante4Latin: 'Lavandula angustifolia',
  plante4Note: 'Le calme, la clarté, et la protection du seuil.',
  plante5Nom: 'Millepertuis',
  plante5Latin: 'Hypericum perforatum',
  plante5Note: 'Cueilli au solstice, associé à la lumière que l’on garde pour l’hiver.',
  plante6Nom: 'Achillée millefeuille',
  plante6Latin: 'Achillea millefolium',
  plante6Note: 'Plante des guerriers et des tirages : courage et divination.',

  // ── Consultation ──────────────────────────────────────────────────────
  consultationTitre: 'Consultation et accompagnement',
  consultationTexte:
    'Une rencontre pour faire le point, apprendre à reconnaître les plantes qui te concernent et repartir avec des gestes simples, adaptés à ta situation.',
  consultationCtaLabel: 'Écrire pour prendre rendez-vous',
  consultationCtaHref: '/contact',

  // ── Se former ─────────────────────────────────────────────────────────
  formationTitre: 'Se former, parmi les possibilités',
  formationTexte:
    'Apprendre les plantes est une des voies qu’ouvre l’herboristerie — pas la seule, mais celle qui reste. Les rencontres et formations sont annoncées ici et dans l’infolettre.',

  // ── Boutique ──────────────────────────────────────────────────────────
  boutiqueTitre: 'À la boutique',
  boutiqueTexte:
    'Herbes, encens et résines choisis pour la qualité de leur récolte, disponibles au Temple et en ligne.',

  // ── Avertissement ─────────────────────────────────────────────────────
  avertissementTitre: 'À savoir avant de commencer',
  avertissementTexte:
    'L’herboristerie proposée ici est un accompagnement traditionnel et symbolique. Elle ne remplace ni un diagnostic, ni un traitement, ni l’avis d’un professionnel de la santé, et ne doit jamais conduire à interrompre une médication.\n\n' +
    'Certaines plantes sont déconseillées pendant la grossesse ou l’allaitement, ou interagissent avec des médicaments. En cas de doute, parles-en à ta ou ton médecin ou à ta ou ton pharmacien.',

  // ── Appel final ───────────────────────────────────────────────────────
  finalTitre: 'Entrer en relation avec les plantes',
  finalTexte:
    'Une question sur une plante, une envie d’apprendre, un besoin d’être guidée ? Écris-nous, on prendra le temps de répondre.',
  finalCtaLabel: 'Nous écrire',
  finalCtaHref: '/contact',

  // ── Polices ───────────────────────────────────────────────────────────
  titleFont: 'cinzel-decorative',
  labelFont: 'cinzel',
  bodyFont: 'cormorant',
};

export type ContenuHerboristerie = typeof DEFAUTS;

export const CHAMPS_HERBORISTERIE = Object.keys(DEFAUTS) as ReadonlyArray<
  keyof ContenuHerboristerie
>;

const CHAMPS_POLICE = ['titleFont', 'labelFont', 'bodyFont'] as const;

export const HERBORISTERIE_DEFAUT: ContenuHerboristerie = DEFAUTS;

/** Voir `parseCeremonies` : même contrat, on ne fait pas confiance à la base. */
export function parseHerboristerie(json: unknown): ContenuHerboristerie {
  const source =
    json && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {};

  const sortie: ContenuHerboristerie = { ...DEFAUTS };

  for (const cle of CHAMPS_HERBORISTERIE) {
    const valeur = source[cle];
    if (typeof valeur !== 'string') continue;

    if ((CHAMPS_POLICE as readonly string[]).includes(cle)) {
      if (valeur in FONTS) sortie[cle] = valeur as FontKey;
      continue;
    }

    if (valeur.trim()) sortie[cle] = valeur;
  }

  return sortie;
}
