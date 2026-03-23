import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const rules = await prisma.availabilityRule.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { service: { select: { name: true } } },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { serviceId, dayOfWeek, startTime, endTime } = body;

  if (dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const rule = await prisma.availabilityRule.create({
    data: {
      serviceId: serviceId || null,
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}
