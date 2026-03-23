import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlots } from "@/lib/slot-generator";
import { addMinutes, format, parse } from "date-fns";
import { sendConfirmationEmail, sendAdminNotification } from "@/lib/booking-email";
import { createEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { serviceId, date, time, clientName, clientEmail, clientPhone, notes } = body;

  // Validate required fields
  if (!serviceId || !date || !time || !clientName || !clientEmail) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants" },
      { status: 400 }
    );
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return NextResponse.json(
      { error: "Format d'email invalide" },
      { status: 400 }
    );
  }

  const timezone = process.env.TIMEZONE || "America/Toronto";

  // Verify slot is still available
  const slots = await getAvailableSlots(serviceId, date, timezone);
  const slot = slots.find((s) => s.time === time);

  if (!slot || !slot.available) {
    return NextResponse.json(
      { error: "Ce creneau n'est plus disponible" },
      { status: 409 }
    );
  }

  // Load service
  const service = await prisma.bookingService.findUnique({
    where: { id: serviceId },
  });

  if (!service || !service.isActive) {
    return NextResponse.json(
      { error: "Service introuvable" },
      { status: 404 }
    );
  }

  // Calculate end time
  const startDate = parse(time, "HH:mm", new Date());
  const endDate = addMinutes(startDate, service.durationMinutes);
  const endTime = format(endDate, "HH:mm");
  const appointmentDate = parse(date, "yyyy-MM-dd", new Date());

  // Create appointment with transaction to prevent double-booking
  const appointment = await prisma.$transaction(async (tx) => {
    // Re-check for conflicts inside transaction
    const conflicts = await tx.appointment.findMany({
      where: {
        date: appointmentDate,
        status: { in: ["pending", "confirmed"] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: time } },
        ],
      },
    });

    const spotsUsed = conflicts.length;
    if (spotsUsed >= service.maxPerSlot) {
      throw new Error("SLOT_TAKEN");
    }

    return tx.appointment.create({
      data: {
        serviceId,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        date: appointmentDate,
        startTime: time,
        endTime,
        notes: notes || null,
        status: "confirmed",
      },
    });
  }).catch((err) => {
    if (err.message === "SLOT_TAKEN") return null;
    throw err;
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Ce creneau vient d'etre pris" },
      { status: 409 }
    );
  }

  // Google Calendar event (non-blocking)
  createEvent({
    clientName,
    clientEmail,
    date: appointmentDate,
    startTime: time,
    endTime,
    service: {
      name: service.name,
      emoji: service.emoji,
      durationMinutes: service.durationMinutes,
    },
  })
    .then((eventId) => {
      if (eventId) {
        prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: eventId },
        });
      }
    })
    .catch(console.error);

  // Send emails (non-blocking)
  const emailData = {
    clientName,
    clientEmail,
    serviceName: service.name,
    serviceEmoji: service.emoji,
    date,
    startTime: time,
    durationMinutes: service.durationMinutes,
    price: service.price,
    confirmationToken: appointment.confirmationToken,
  };

  sendConfirmationEmail(emailData).catch(console.error);
  sendAdminNotification(emailData).catch(console.error);

  return NextResponse.json({
    success: true,
    token: appointment.confirmationToken,
    appointment: {
      id: appointment.id,
      serviceName: service.name,
      serviceEmoji: service.emoji,
      date,
      startTime: time,
      endTime,
      durationMinutes: service.durationMinutes,
      clientName,
      clientEmail,
    },
  });
}
