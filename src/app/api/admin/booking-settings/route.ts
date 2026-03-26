import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const settings = await prisma.bookingSetting.findMany();

    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();

    const upserts = Object.entries(body).map(([key, value]) =>
      prisma.bookingSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(upserts);

    // Return updated settings
    const settings = await prisma.bookingSetting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
