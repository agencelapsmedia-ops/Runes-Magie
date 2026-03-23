import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const service = await prisma.bookingService.findUnique({ where: { id } });
  if (!service) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    data.name = body.name;
    data.slug = slugify(body.name);
  }
  if (body.description !== undefined) data.description = body.description;
  if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes;
  if (body.bufferMinutes !== undefined) data.bufferMinutes = body.bufferMinutes;
  if (body.price !== undefined) data.price = body.price;
  if (body.colorHex !== undefined) data.colorHex = body.colorHex;
  if (body.emoji !== undefined) data.emoji = body.emoji;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.maxPerSlot !== undefined) data.maxPerSlot = body.maxPerSlot;

  const service = await prisma.bookingService.update({ where: { id }, data });
  return NextResponse.json(service);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  await prisma.bookingService.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
