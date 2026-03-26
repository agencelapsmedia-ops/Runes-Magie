import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const serviceId = searchParams.get("serviceId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (from || to) {
      where.date = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { service: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const body = await request.json();
    const { serviceId, date, time, clientName, clientEmail, clientPhone, notes } = body;

    if (!serviceId || !date || !time || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: "Les champs serviceId, date, time, clientName et clientEmail sont requis" },
        { status: 400 }
      );
    }

    const service = await prisma.bookingService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service non trouve" }, { status: 404 });
    }

    // Calculate endTime from startTime + durationMinutes
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + service.durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        date: new Date(date),
        startTime: time,
        endTime,
        clientName,
        clientEmail,
        ...(clientPhone && { clientPhone }),
        ...(notes && { notes }),
      },
      include: { service: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
