import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const services = await prisma.bookingService.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, slug: true, description: true,
        durationMinutes: true, price: true, colorHex: true, emoji: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
