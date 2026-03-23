import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!appointment) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(appointment);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
