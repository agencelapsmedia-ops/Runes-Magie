/**
 * Remplace le texte du rituel de Lughnasadh par celui fourni par la cliente
 * et publie l'evenement.
 *
 * Le texte precedent etait une proposition redigee par l'agent ; celui-ci est
 * le texte officiel d'Annabelle (Noctura). Seules corrections apportees :
 * « sabbats » -> « sabbat » (un seul sabbat), ponctuation, et la mention
 * « ou sur le site runesetmagie.ca » retiree — le visiteur y est deja.
 *
 * Usage : npx tsx scripts/maj-lughnasadh.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUG = 'rituel-de-lughnasadh';

const DESCRIPTION = `Venez célébrer le passage du Feu cet été et apposer votre intention pour manifester votre meilleur futur dans la Toile, avec Noctura et Odalguir au Temple de la Boutique Runes & Magie.

Nous ferons un rituel inspiré du sabbat de Lughnasadh avec les 4 éléments de la Nature et à l'aide de la Magie Naturelle.

Nous explorerons l'élément sacré du Feu et ses concepts. Nous invoquerons également l'énergie de la Déesse Sekhmet, divinité égyptienne à tête de lionne, afin de nous instiller de cet archétype de force, de protection et de volonté jusqu'à Samhain, Halloween.

Nous aborderons votre lien avec cet élément et comment il vous affecte au quotidien, comment il peut vous aider au niveau de votre Ka (énergie vitale / feu spirituel), comment il peut améliorer votre quotidien et vos relations personnelles, comment il influence votre vie en général et votre bien-être.

Guidance personnelle et partages ouverts sont également au menu.

C'EST GRATUIT !

Vous pouvez aussi vous inscrire par téléphone au (514) 348-7705, avec Noctura.`;

async function main() {
  const evenement = await prisma.event.update({
    where: { slug: SLUG },
    data: {
      title: 'Rituel de Lughnasadh — le passage du Feu',
      excerpt:
        'Célébrez le passage du Feu avec Noctura et Odalguir. Rituel gratuit inspiré du sabbat de Lughnasadh.',
      description: DESCRIPTION,
      location:
        'Le Temple — Boutique Runes & Magie (sous-sol), 149 Rue Saint-Eustache, Saint-Eustache, QC J7R 2L5',
      bringItems: null, // Rien n'a ete precise par la cliente : on n'invente pas.
      isPublished: true,
    },
  });

  console.log('Evenement mis a jour et PUBLIE.');
  console.log('  Titre  :', evenement.title);
  console.log('  Lieu   :', evenement.location);
  console.log('  Places :', evenement.capacity);
  console.log('  En ligne : https://www.runesetmagie.ca/evenements/' + evenement.slug);
}

main()
  .catch((e) => {
    console.error('ERREUR :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
