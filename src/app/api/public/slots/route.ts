import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slot-generator";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");
  const timezone = searchParams.get("timezone") || process.env.TIMEZONE || "America/Toronto";

  if (!serviceId || !date) {
    return NextResponse.json(
      { error: "serviceId and date are required" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlots(serviceId, date, timezone);
  return NextResponse.json(slots);
}
