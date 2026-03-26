import { NextRequest, NextResponse } from "next/server";
import { getMonthAvailability } from "@/lib/slot-generator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const timezone = searchParams.get("timezone");

    if (!serviceId || !year || !month || !timezone) {
      return NextResponse.json(
        { error: "Missing required parameters: serviceId, year, month, timezone" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Invalid year or month value" },
        { status: 400 }
      );
    }

    const availability = await getMonthAvailability(serviceId, yearNum, monthNum, timezone);

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching month availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch month availability" },
      { status: 500 }
    );
  }
}
