import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const services = await prisma.bookingService.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      durationMinutes: true,
      price: true,
      colorHex: true,
      emoji: true,
    },
  });

  return NextResponse.json(services);
}
