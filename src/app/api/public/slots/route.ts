import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slot-generator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");
    const timezone = searchParams.get("timezone");

    if (!serviceId || !date || !timezone) {
      return NextResponse.json(
        { error: "Missing required parameters: serviceId, date, timezone" },
        { status: 400 }
      );
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(serviceId, date, timezone);

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
