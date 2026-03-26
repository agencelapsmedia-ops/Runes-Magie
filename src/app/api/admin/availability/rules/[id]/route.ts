import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = { ...body };

    if (body.dayOfWeek !== undefined) {
      data.dayOfWeek = parseInt(body.dayOfWeek);
    }

    const rule = await prisma.availabilityRule.update({
      where: { id },
      data,
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating rule:", error);
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
    await prisma.availabilityRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
