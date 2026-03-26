import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const services = await prisma.bookingService.findMany({
      include: {
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, durationMinutes, bufferMinutes, price, colorHex, emoji, maxPerSlot } = body;

    if (!name || !description || !durationMinutes) {
      return NextResponse.json(
        { error: "Les champs name, description et durationMinutes sont requis" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const service = await prisma.bookingService.create({
      data: {
        name,
        slug,
        description,
        durationMinutes: parseInt(durationMinutes),
        ...(bufferMinutes !== undefined && { bufferMinutes: parseInt(bufferMinutes) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(colorHex && { colorHex }),
        ...(emoji && { emoji }),
        ...(maxPerSlot !== undefined && { maxPerSlot: parseInt(maxPerSlot) }),
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
