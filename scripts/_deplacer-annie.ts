/**
 * Opération ponctuelle (2026-08-21) — Annie Lebrun :
 * 1. Supprime le RDV Interac non payé du 21 août 15 h (doublon, cmt37j4hp0005l1040zo4s5gv)
 * 2. Déplace le RDV payé par carte du 27 août (cmt1z2fmp0004ju04q2kue8el) au 21 août 15 h
 * Avec mise à jour Google Agenda, miroir V2 et courriels de déplacement.
 */
import { prisma } from '../src/lib/db';
import {
  deleteCalendarEventForAppointment,
  updateCalendarEventForAppointment,
} from '../src/lib/google-calendar';
import { syncAppointmentStatusToV2, updateBookingTimesV2 } from '../src/lib/holistic-v2-sync';
import {
  buildBookingEmailData,
  sendRescheduleToClient,
  sendRescheduleToPractitioner,
} from '../src/lib/holistic-booking-email';

const ID_A_SUPPRIMER = 'cmt37j4hp0005l1040zo4s5gv'; // 21 août 15h, Interac non payé
const ID_A_DEPLACER = 'cmt1z2fmp0004ju04q2kue8el'; // 27 août 13h, acompte carte payé
const NOUVEAU_DEBUT = new Date('2026-08-21T19:00:00Z'); // 15h00 heure de Montréal
const NOUVELLE_FIN = new Date('2026-08-21T20:30:00Z'); // 16h30

async function main() {
  // 1 — suppression du doublon Interac (agenda Google + miroir V2 + paiement + RDV)
  try { await deleteCalendarEventForAppointment(ID_A_SUPPRIMER); console.log('Google Agenda : événement du doublon supprimé'); }
  catch (e) { console.error('Google Agenda (suppression) :', (e as Error).message); }
  try { await syncAppointmentStatusToV2({ appointmentId: ID_A_SUPPRIMER, status: 'CANCELLED', cancelledBy: 'ADMIN' }); }
  catch (e) { console.error('V2 sync (annulation) :', (e as Error).message); }
  await prisma.holisticPayment.deleteMany({ where: { appointmentId: ID_A_SUPPRIMER } });
  await prisma.holisticAppointment.delete({ where: { id: ID_A_SUPPRIMER } });
  console.log('RDV Interac du 21 août supprimé.');

  // 2 — déplacement du RDV payé par carte
  const updated = await prisma.holisticAppointment.update({
    where: { id: ID_A_DEPLACER },
    data: { startsAt: NOUVEAU_DEBUT, endsAt: NOUVELLE_FIN, reminder3dSentAt: null, reminder24hSentAt: null },
  });
  console.log('RDV déplacé au', updated.startsAt.toISOString());
  try { await updateBookingTimesV2({ appointmentId: ID_A_DEPLACER, oldStartsAt: new Date('2026-08-27T17:00:00Z'), newStartsAt: NOUVEAU_DEBUT, newEndsAt: NOUVELLE_FIN }); }
  catch (e) { console.error('V2 sync (déplacement) :', (e as Error).message); }
  try { await updateCalendarEventForAppointment(ID_A_DEPLACER); console.log('Google Agenda : événement mis à jour'); }
  catch (e) { console.error('Google Agenda (maj) :', (e as Error).message); }
  try {
    const data = await buildBookingEmailData(ID_A_DEPLACER);
    if (data) {
      await Promise.allSettled([sendRescheduleToClient(data), sendRescheduleToPractitioner(data)]);
      console.log('Courriels de déplacement envoyés (cliente + praticienne).');
    }
  } catch (e) { console.error('Courriels :', (e as Error).message); }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
