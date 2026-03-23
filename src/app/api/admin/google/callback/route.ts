import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/parametres?error=no_code", req.url)
    );
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(
      new URL("/admin/parametres?google=connected", req.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/admin/parametres?error=google_auth_failed", req.url)
    );
  }
}
