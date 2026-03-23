import { NextRequest, NextResponse } from "next/server";
import { getMonthAvailability } from "@/lib/slot-generator";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const timezone = searchParams.get("timezone") || process.env.TIMEZONE || "America/Toronto";

  if (!serviceId || !year || !month) {
    return NextResponse.json(
      { error: "serviceId, year and month are required" },
      { status: 400 }
    );
  }

  const availability = await getMonthAvailability(
    serviceId,
    parseInt(year),
    parseInt(month),
    timezone
  );

  return NextResponse.json(availability);
}
