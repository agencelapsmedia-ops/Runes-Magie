import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteEvent } from "@/lib/google-calendar";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  // If cancelled, remove Google Calendar event
  if (status === "cancelled" && appointment.googleEventId) {
    deleteEvent(appointment.googleEventId).catch(console.error);
  }

  return NextResponse.json(appointment);
}
