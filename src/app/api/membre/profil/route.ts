import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { compare, hash } from "bcryptjs";

/**
 * PUT /api/membre/profil
 * Met à jour le profil du membre connecté (prénom, nom, téléphone) et,
 * optionnellement, son mot de passe (avec vérification du mot de passe actuel).
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const member = await prisma.holisticUser.findUnique({ where: { id: userId } });
  if (!member) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: {
    firstName?: unknown;
    lastName?: unknown;
    phone?: unknown;
    currentPassword?: unknown;
    newPassword?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Le prénom et le nom sont requis." }, { status: 400 });
  }

  const data: { firstName: string; lastName: string; phone: string | null; hashedPassword?: string } = {
    firstName,
    lastName,
    phone: phone || null,
  };

  // Changement de mot de passe (optionnel)
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (newPassword) {
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }
    const ok = currentPassword ? await compare(currentPassword, member.hashedPassword) : false;
    if (!ok) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est incorrect." },
        { status: 400 },
      );
    }
    data.hashedPassword = await hash(newPassword, 10);
  }

  await prisma.holisticUser.update({ where: { id: userId }, data });

  return NextResponse.json({ ok: true });
}
