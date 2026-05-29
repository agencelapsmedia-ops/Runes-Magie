/**
 * Helpers pour l'intégration Daily.co (vidéoconférence des RDV virtuels).
 */

import { prisma } from '@/lib/db';

interface CreateRoomArgs {
  appointmentId: string;
  endsAt: Date;
  /** Si la salle existe déjà, on retourne son URL sans rien faire. */
  reuseIfExists?: boolean;
}

/**
 * Crée une salle Daily.co pour un RDV et stocke l'URL sur l'appointment.
 * Idempotent : si une salle existe déjà, retourne son URL.
 *
 * À appeler depuis :
 *  - Le webhook Stripe quand le RDV passe en CONFIRMED (auto)
 *  - Le endpoint /api/holistique/video/[id] quand l'utilisateur visite la salle (à la demande)
 *
 * Retourne `null` en cas d'échec — caller décide s'il bloque ou laisse passer.
 */
export async function createDailyRoomForAppointment(args: CreateRoomArgs): Promise<string | null> {
  const { appointmentId, endsAt, reuseIfExists = true } = args;

  if (!process.env.DAILY_API_KEY) {
    console.warn('[Daily.co] DAILY_API_KEY non configuré — création de salle ignorée');
    return null;
  }

  const appointment = await prisma.holisticAppointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, dailyRoomUrl: true, dailyRoomName: true },
  });
  if (!appointment) {
    console.warn('[Daily.co] appointment introuvable:', appointmentId);
    return null;
  }

  if (reuseIfExists && appointment.dailyRoomUrl) {
    return appointment.dailyRoomUrl;
  }

  // Nom UUID-style pour éviter la collision et empêcher les attaques par devinette
  const roomName = `rm-${appointmentId.slice(0, 16)}`;

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private', // salle privée — accès uniquement avec token (à venir si besoin)
        properties: {
          // expire 1h après la fin prévue du RDV (marge si la séance dépasse)
          exp: Math.round(endsAt.getTime() / 1000) + 3600,
          max_participants: 2,
          enable_screenshare: false,
          enable_chat: true,
          lang: 'fr',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Daily.co] échec création salle:', {
        appointmentId,
        status: response.status,
        body: errorBody,
      });
      return null;
    }

    const room = await response.json();
    await prisma.holisticAppointment.update({
      where: { id: appointmentId },
      data: { dailyRoomUrl: room.url, dailyRoomName: roomName },
    });
    return room.url;
  } catch (err) {
    console.error('[Daily.co] erreur réseau:', err);
    return null;
  }
}
