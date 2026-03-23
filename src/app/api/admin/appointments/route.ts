import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { addMinutes, format, parse } from "date-fns";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const serviceId = searchParams.get("serviceId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (serviceId) where.serviceId = serviceId;
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { clientName: { contains: search } },
      { clientEmail: { contains: search } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { service: { select: { name: true, emoji: true, colorHex: true } } },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { serviceId, date, time, clientName, clientEmail, clientPhone, notes, forceOverride } = body;

  if (!serviceId || !date || !time || !clientName || !clientEmail) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const service = await prisma.bookingService.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "Service introuvable" }, { status: 404 });

  const startDate = parse(time, "HH:mm", new Date());
  const endDate = addMinutes(startDate, service.durationMinutes);
  const endTime = format(endDate, "HH:mm");
  const appointmentDate = parse(date, "yyyy-MM-dd", new Date());

  const appointment = await prisma.appointment.create({
    data: {
      serviceId,
      clientName,
      clientEmail,
      clientPhone: clientPhone || null,
      date: appointmentDate,
      startTime: time,
      endTime,
      notes: notes || null,
      status: "confirmed",
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
