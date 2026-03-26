import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID non configure" },
        { status: 500 }
      );
    }

    const url = getAuthUrl();

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
