/**
 * Test de la règle rôle → destination (src/lib/session-utilisateur.ts).
 *
 * Ce n'est pas de la décoration : cette règle était recopiée dans quatre
 * composants et avait divergé — c'est exactement ce qui a fait passer la
 * praticienne propriétaire pour une cliente sur téléphone. Elle mérite donc
 * d'être vérifiée, pas seulement relue.
 *
 * Lancer :  npx tsx scripts/_test-session-utilisateur.ts
 */
import { espacePrincipal, aAccesAdmin } from '../src/lib/session-utilisateur';

let echecs = 0;

function verifie(intitule: string, obtenu: unknown, attendu: unknown) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (!ok) echecs++;
  console.log(`${ok ? '✅' : '❌'} ${intitule}`);
  if (!ok) console.log(`   attendu : ${JSON.stringify(attendu)}\n   obtenu  : ${JSON.stringify(obtenu)}`);
}

// Noctura : praticienne ET propriétaire. Le cas qui était cassé.
const noctura = { role: 'PRACTITIONER', isOwner: true, email: 'noctura@runesetmagie.ca' };
verifie(
  'Noctura (PRACTITIONER + isOwner) → son espace praticienne',
  espacePrincipal(noctura),
  { href: '/soins/dashboard/praticien', label: 'Mon espace', labelLong: 'Mon espace praticien' },
);
verifie('Noctura a accès à l\'administration', aAccesAdmin(noctura), true);

// Praticienne ordinaire : espace praticienne, mais pas d'administration.
const praticienne = { role: 'PRACTITIONER', isOwner: false };
verifie(
  'Praticienne ordinaire → son espace praticienne',
  espacePrincipal(praticienne),
  { href: '/soins/dashboard/praticien', label: 'Mon espace', labelLong: 'Mon espace praticien' },
);
verifie('Praticienne ordinaire n\'a PAS accès à l\'administration', aAccesAdmin(praticienne), false);

// Cliente connectée : espace membre, jamais l'administration.
const cliente = { role: 'CLIENT', isOwner: false };
verifie(
  'Cliente → espace membre',
  espacePrincipal(cliente),
  { href: '/compte', label: 'Compte', labelLong: 'Mon compte' },
);
verifie('Cliente n\'a PAS accès à l\'administration', aAccesAdmin(cliente), false);

// Admin classique.
verifie(
  'ADMIN → back-office',
  espacePrincipal({ role: 'ADMIN' }),
  { href: '/admin', label: 'Admin', labelLong: 'Administration' },
);
verifie('ADMIN a accès à l\'administration', aAccesAdmin({ role: 'ADMIN' }), true);

// Visiteuse non connectée : le repli ne doit jamais ouvrir de porte.
verifie(
  'Non connecté → espace membre par défaut',
  espacePrincipal(null),
  { href: '/compte', label: 'Compte', labelLong: 'Mon compte' },
);
verifie('Non connecté n\'a PAS accès à l\'administration', aAccesAdmin(null), false);
verifie('undefined n\'a PAS accès à l\'administration', aAccesAdmin(undefined), false);

console.log(echecs === 0 ? '\nTout passe.' : `\n${echecs} échec(s).`);
process.exit(echecs === 0 ? 0 : 1);
