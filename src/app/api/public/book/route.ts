import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, date, time, clientName, clientEmail, clientPhone, notes } = body;

    if (!serviceId || !date || !time || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const service = await prisma.bookingService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service non trouve" }, { status: 404 });
    }

    // Calculate end time string (HH:mm)
    const [h, m] = time.split(":").map(Number);
    const totalMinutes = h * 60 + m + service.durationMinutes;
    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const endM = (totalMinutes % 60).toString().padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    // Check for conflicting appointments on the same date
    const conflicts = await prisma.appointment.findMany({
      where: {
        date: new Date(`${date}T00:00:00Z`),
        status: { not: "cancelled" },
      },
    });

    const hasConflict = conflicts.some((apt) => {
      return apt.startTime < endTime && apt.endTime > time;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "Ce creneau n'est plus disponible" },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        date: new Date(`${date}T00:00:00Z`),
        startTime: time,
        endTime,
        clientName,
        clientEmail,
        clientPhone: clientPhone || null,
        notes: notes || null,
        status: "confirmed",
      },
    });

    return NextResponse.json({
      success: true,
      token: appointment.confirmationToken,
      appointmentId: appointment.id,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation du rendez-vous" },
      { status: 500 }
    );
  }
}
