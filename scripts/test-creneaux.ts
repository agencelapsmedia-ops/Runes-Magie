/**
 * Verifie le calcul des creneaux sur les VRAIES disponibilites de Noctura.
 * Lecture seule : n'ecrit rien en base.
 *
 * Usage : npx tsx scripts/test-creneaux.ts
 */
import { PrismaClient } from '@prisma/client';
import { calculerCreneaux } from '../src/lib/creneaux';

const prisma = new PrismaClient();

/** Prochaine date (AAAA-MM-JJ) tombant sur ce jour de la semaine. */
function prochain(jour: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  while (d.getUTCDay() !== jour) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const noctura: any = await prisma.practitioner.findFirst({ where: { slug: 'noctura' } });
  if (!noctura) throw new Error('Noctura introuvable');
  const offering: any = await prisma.offering.findFirst({
    where: { practitionerId: noctura.id, isActive: true },
    orderBy: { durationMinutes: 'asc' },
  });
  if (!offering) throw new Error('Aucun soin actif');
  console.log(`Soin de test : ${offering.name} (${offering.durationMinutes} min)\n`);

  let succes = true;

  const mardi = await calculerCreneaux({ practitionerId: noctura.id, date: prochain(2), offeringId: offering.id });
  console.log(`Mardi ${prochain(2)} : ${mardi.creneaux.length} creneau(x), Google consulte : ${mardi.agendaGoogleConsulte}`);
  console.log('  ' + mardi.creneaux.map((c) => `${c.debut}${c.disponible ? '' : '(pris)'}`).join(' '));
  if (mardi.creneaux.length === 0) { console.log('  ECHEC : un mardi devrait offrir des creneaux'); succes = false; }

  const lundi = await calculerCreneaux({ practitionerId: noctura.id, date: prochain(1), offeringId: offering.id });
  console.log(`\nLundi ${prochain(1)} : ${lundi.creneaux.length} creneau(x)`);
  if (lundi.creneaux.length !== 0) { console.log('  ECHEC : Noctura ne travaille pas le lundi'); succes = false; }

  const premier = mardi.creneaux[0];
  if (premier) {
    const heureLocale = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(premier.debutIso));
    console.log(`\nCoherence du fuseau : etiquette « ${premier.debut} » vs instant reel « ${heureLocale} »`);
    if (heureLocale.replace('h', ':').trim() !== premier.debut) {
      console.log('  ECHEC : l heure affichee ne correspond pas a l instant enregistre');
      succes = false;
    }
  }

  console.log(succes ? '\nRESULTAT : SUCCES' : '\nRESULTAT : ECHEC');
  process.exitCode = succes ? 0 : 1;
}

main().catch((e) => { console.error('ERREUR :', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
