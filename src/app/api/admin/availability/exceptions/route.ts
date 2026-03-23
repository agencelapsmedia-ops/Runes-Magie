import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const exceptions = await prisma.availabilityException.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(exceptions);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { date, isOpen, startTime, endTime, reason } = body;

  if (!date || isOpen === undefined) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const exception = await prisma.availabilityException.create({
    data: {
      date: new Date(date),
      isOpen,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
    },
  });

  return NextResponse.json(exception, { status: 201 });
}
