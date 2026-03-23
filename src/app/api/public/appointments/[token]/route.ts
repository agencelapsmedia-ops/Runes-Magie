import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteEvent } from "@/lib/google-calendar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { confirmationToken: token },
    include: {
      service: {
        select: {
          name: true,
          emoji: true,
          durationMinutes: true,
          price: true,
          colorHex: true,
        },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Rendez-vous introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: appointment.id,
    clientName: appointment.clientName,
    clientEmail: appointment.clientEmail,
    date: appointment.date.toISOString().split("T")[0],
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    service: appointment.service,
    createdAt: appointment.createdAt,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { confirmationToken: token },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Rendez-vous introuvable" },
      { status: 404 }
    );
  }

  if (appointment.status === "cancelled") {
    return NextResponse.json(
      { error: "Ce rendez-vous est deja annule" },
      { status: 400 }
    );
  }

  // Check cancellation deadline
  const cancelHours = parseInt(
    (await prisma.bookingSetting.findUnique({
      where: { key: "cancellation_hours_before" },
    }))?.value || "24"
  );

  const appointmentDateTime = new Date(appointment.date);
  const [h, m] = appointment.startTime.split(":").map(Number);
  appointmentDateTime.setHours(h, m, 0, 0);

  const hoursUntil =
    (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < cancelHours) {
    return NextResponse.json(
      {
        error: `Annulation impossible : le delai minimum est de ${cancelHours}h avant la seance`,
      },
      { status: 400 }
    );
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "cancelled" },
  });

  // Delete Google Calendar event
  if (appointment.googleEventId) {
    deleteEvent(appointment.googleEventId).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
