import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    const service = await prisma.bookingService.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: "Service non trouve" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) { data.name = body.name; data.slug = slugify(body.name); }
    if (body.description !== undefined) data.description = body.description;
    if (body.emoji !== undefined) data.emoji = body.emoji;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.durationMinutes !== undefined) data.durationMinutes = parseInt(body.durationMinutes);
    if (body.bufferMinutes !== undefined) data.bufferMinutes = parseInt(body.bufferMinutes);
    if (body.price !== undefined) data.price = body.price === null ? null : parseFloat(body.price);
    if (body.colorHex !== undefined) data.colorHex = body.colorHex;
    if (body.maxPerSlot !== undefined) data.maxPerSlot = parseInt(body.maxPerSlot);

    const service = await prisma.bookingService.update({
      where: { id },
      data,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.bookingService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
