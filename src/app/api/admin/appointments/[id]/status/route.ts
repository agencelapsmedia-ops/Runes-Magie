import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteEvent } from "@/lib/google-calendar";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptees: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Rendez-vous non trouve" }, { status: 404 });
    }

    // If cancelling and there's a Google Calendar event, delete it
    if (status === "cancelled" && appointment.googleEventId) {
      try {
        await deleteEvent(appointment.googleEventId);
      } catch (error) {
        console.error("Error deleting Google Calendar event:", error);
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { service: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
