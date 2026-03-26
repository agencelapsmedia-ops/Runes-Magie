import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const rules = await prisma.availabilityRule.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        service: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "rules doit etre un tableau" }, { status: 400 });
    }

    // Delete all existing rules and recreate
    await prisma.availabilityRule.deleteMany({});

    const created = [];
    for (const rule of rules) {
      if (rule.enabled && rule.startTime && rule.endTime) {
        const newRule = await prisma.availabilityRule.create({
          data: {
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            isActive: true,
            ...(rule.serviceId && { serviceId: rule.serviceId }),
          },
        });
        created.push(newRule);
      }
    }

    return NextResponse.json({ rules: created });
  } catch (error) {
    console.error("Error updating rules:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { dayOfWeek, startTime, endTime, serviceId } = body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Les champs dayOfWeek, startTime et endTime sont requis" },
        { status: 400 }
      );
    }

    const rule = await prisma.availabilityRule.create({
      data: {
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        ...(serviceId && { serviceId }),
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
