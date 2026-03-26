import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code d'autorisation manquant" },
        { status: 400 }
      );
    }

    await exchangeCodeForTokens(code);

    return NextResponse.redirect(new URL("/admin/parametres", request.url));
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return NextResponse.redirect(
      new URL("/admin/parametres?error=google_auth_failed", request.url)
    );
  }
}
