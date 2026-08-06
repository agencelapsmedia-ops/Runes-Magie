/**
 * Cree le rituel de Lughnasadh du 8 aout 2026.
 *
 * Cree en BROUILLON (isPublished: false) : la description est une proposition
 * redigee par l'agent, elle doit etre relue et validee par Annabelle avant
 * publication. La publication se fait ensuite en un clic dans /admin/evenements.
 *
 * Heures : 13h00 a 14h30, heure de l'Est. Le 8 aout est en heure avancee (UTC-4),
 * donc 17:00Z a 18:30Z. On ecrit l'instant UTC explicitement plutot que de se fier
 * au fuseau de la machine qui execute ce script.
 *
 * Usage : npx tsx scripts/creer-lughnasadh.ts
 */
import { PrismaClient } from '@prisma/client';
import { BOUTIQUE_ADDRESS } from '../src/lib/constants';

const prisma = new PrismaClient();

const SLUG = 'rituel-de-lughnasadh';

const DESCRIPTION = `Lughnasadh ouvre la saison des récoltes. C'est la première des trois grandes fêtes de la moisson — celle où l'on s'arrête pour reconnaître ce qui a mûri depuis les semences du printemps, dans les champs comme dans nos vies.

Le temps d'un après-midi, nous nous rassemblons au Temple pour honorer Lugh, gardien de la lumière et des savoir-faire, et rendre grâce à ce que l'année nous a déjà donné.

Nous ouvrirons le cercle ensemble, puis viendra le rituel de gratitude et l'offrande des premiers fruits. Suivra un moment de recueillement sur ce que vous souhaitez voir mûrir d'ici Mabon, et nous refermerons par un temps de partage.

Aucune expérience n'est nécessaire. Vous êtes accueilli tel que vous êtes, que ce soit votre premier cercle ou votre centième.`;

const A_APPORTER = `Une offrande symbolique de la moisson : un fruit, un épi de blé, quelques grains, du pain fait maison ou une fleur de votre jardin.

Portez des vêtements confortables. Et si le cœur vous en dit, apportez une intention pour la saison qui vient.`;

async function main() {
  const existant = await prisma.event.findUnique({ where: { slug: SLUG } });
  if (existant) {
    console.log(`L'evenement « ${existant.title} » existe deja (${existant.id}).`);
    console.log(`Etat : ${existant.isPublished ? 'PUBLIE' : 'brouillon'}`);
    console.log('Rien n\'a ete modifie. Passez par /admin/evenements pour l\'ajuster.');
    return;
  }

  const evenement = await prisma.event.create({
    data: {
      slug: SLUG,
      title: 'Rituel de Lughnasadh',
      excerpt: 'La première moisson — un cercle de gratitude et d\'abondance au Temple.',
      description: DESCRIPTION,
      startsAt: new Date('2026-08-08T17:00:00.000Z'), // 13h00, heure de l'Est
      endsAt: new Date('2026-08-08T18:30:00.000Z'), // 14h30, heure de l'Est
      location: `Le Temple — Runes & Magie, ${BOUTIQUE_ADDRESS}`,
      isOnline: false,
      capacity: 15,
      bringItems: A_APPORTER,
      isPublished: false, // BROUILLON — a valider par Annabelle
    },
  });

  console.log('Evenement cree en BROUILLON.');
  console.log('  Titre    :', evenement.title);
  console.log('  Adresse  :', `/evenements/${evenement.slug}`);
  console.log('  Debut    :', evenement.startsAt.toISOString(), '(13h00 heure de l\'Est)');
  console.log('  Fin      :', evenement.endsAt?.toISOString(), '(14h30 heure de l\'Est)');
  console.log('  Lieu     :', evenement.location);
  console.log('  Places   :', evenement.capacity);
  console.log('\nA relire puis publier depuis /admin/evenements.');
}

main()
  .catch((e) => {
    console.error('ERREUR :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
