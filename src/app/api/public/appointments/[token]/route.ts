import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { deleteEvent } from "@/lib/google-calendar";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { confirmationToken: token },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment is already cancelled" },
        { status: 400 }
      );
    }

    // Check cancellation_hours_before setting
    const setting = await prisma.bookingSetting.findFirst({
      where: { key: "cancellation_hours_before" },
    });

    if (setting) {
      const hoursRequired = parseInt(setting.value, 10);
      const now = new Date();
      // appointment.startTime est un String "HH:MM", appointment.date est un DateTime (00:00 UTC).
      // On combine les deux pour obtenir le timestamp réel du RDV.
      const [hh, mm] = appointment.startTime.split(':').map((n) => parseInt(n, 10));
      const appointmentDateTime = new Date(appointment.date);
      appointmentDateTime.setUTCHours(hh ?? 0, mm ?? 0, 0, 0);
      const hoursUntilAppointment =
        (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < hoursRequired) {
        return NextResponse.json(
          {
            error: `Cancellations must be made at least ${hoursRequired} hours before the appointment`,
          },
          { status: 400 }
        );
      }
    }

    // Update status to cancelled
    const updated = await prisma.appointment.update({
      where: { confirmationToken: token },
      data: { status: "cancelled" },
    });

    // Delete Google Calendar event if it exists
    if (updated.googleEventId) {
      deleteEvent(updated.googleEventId).catch((err) =>
        console.error("Failed to delete Google Calendar event:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
