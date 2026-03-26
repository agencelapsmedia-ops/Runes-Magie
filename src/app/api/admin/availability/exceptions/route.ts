import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const exceptions = await prisma.availabilityException.findMany({
      orderBy: { date: "asc" },
    });

    return NextResponse.json(exceptions);
  } catch (error) {
    console.error("Error fetching exceptions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { date, isOpen, startTime, endTime, reason } = body;

    if (!date || isOpen === undefined) {
      return NextResponse.json(
        { error: "Les champs date et isOpen sont requis" },
        { status: 400 }
      );
    }

    const exception = await prisma.availabilityException.create({
      data: {
        date: new Date(date),
        isOpen: Boolean(isOpen),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(reason && { reason }),
      },
    });

    return NextResponse.json(exception, { status: 201 });
  } catch (error) {
    console.error("Error creating exception:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
