import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth non configure" },
      { status: 400 }
    );
  }

  const url = getAuthUrl();
  return NextResponse.json({ url });
}
