/**
 * Libération automatique des réservations Interac impayées.
 *
 * Règle (décision cliente) : un RDV créé avec paiement Interac dont le virement
 * n'a pas été marqué reçu dans les 30 minutes est ANNULÉ automatiquement — le
 * créneau redevient réservable et la cliente reçoit un courriel explicatif.
 *
 * Ciblage précis : status CONFIRMED + paymentMode INTERAC + depositPaidAt null
 * (mark-paid le renseigne) + créé il y a plus de 30 min + RDV encore À VENIR
 * (on ne touche jamais aux RDV passés, qu'Annabelle peut encaisser après coup).
 *
 * Appelé en « ménage paresseux » au chargement de la page de réservation
 * (route practitioners/by-id) et par le cron quotidien. Best-effort : une
 * erreur sur un RDV n'empêche pas les autres d'être traités.
 */

import { prisma } from '@/lib/db';
import { buildBookingEmailData, sendInteracExpiredToClient } from '@/lib/holistic-booking-email';
import { deleteCalendarEventForAppointment } from '@/lib/google-calendar';
import { syncAppointmentStatusToV2 } from '@/lib/holistic-v2-sync';
import { isInternalEmail } from '@/lib/holistic-clients';

const INTERAC_HOLD_MINUTES = 30;

export async function releaseExpiredInteracHolds(): Promise<number> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - INTERAC_HOLD_MINUTES * 60 * 1000);

  const stale = await prisma.holisticAppointment.findMany({
    where: {
      status: 'CONFIRMED',
      paymentMode: 'INTERAC',
      depositPaidAt: null,
      createdAt: { lt: cutoff },
      startsAt: { gt: now },
    },
    select: { id: true },
  });

  let released = 0;
  for (const a of stale) {
    try {
      // Données du courriel chargées AVANT l'annulation (contenu complet garanti).
      const emailData = await buildBookingEmailData(a.id);

      await prisma.holisticAppointment.update({
        where: { id: a.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'SYSTEM' },
      });
      released++;

      // Effets de bord best-effort : miroir v2, agenda Google, courriel cliente.
      try {
        await syncAppointmentStatusToV2({ appointmentId: a.id, status: 'CANCELLED', cancelledBy: 'SYSTEM' });
      } catch (err) {
        console.error('[interac-release] sync v2 échoué (non-bloquant)', { appointmentId: a.id, err });
      }
      try {
        await deleteCalendarEventForAppointment(a.id);
      } catch (err) {
        console.error('[interac-release] retrait Google Agenda échoué (non-bloquant)', { appointmentId: a.id, err });
      }
      if (emailData && !isInternalEmail(emailData.clientEmail)) {
        await sendInteracExpiredToClient(emailData);
      }
    } catch (err) {
      console.error('[interac-release] échec libération', { appointmentId: a.id, err });
    }
  }
  return released;
}
