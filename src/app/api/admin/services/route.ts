import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const services = await prisma.bookingService.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { appointments: true } } },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { name, description, durationMinutes, bufferMinutes, price, colorHex, emoji, maxPerSlot } = body;

  if (!name || !description || !durationMinutes) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const service = await prisma.bookingService.create({
    data: {
      name,
      slug: slugify(name),
      description,
      durationMinutes,
      bufferMinutes: bufferMinutes || 15,
      price: price || null,
      colorHex: colorHex || "#6B3FA0",
      emoji: emoji || "*",
      maxPerSlot: maxPerSlot || 1,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
