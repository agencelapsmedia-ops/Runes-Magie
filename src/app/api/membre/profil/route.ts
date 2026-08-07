import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { compare, hash } from "bcryptjs";
import { deleteImage } from "@/lib/supabase";

/**
 * Seules les images de notre propre stockage sont acceptées comme photo de
 * profil. Sans cette barrière, un membre pourrait enregistrer l'adresse d'une
 * image de 8 Mo hébergée ailleurs et contourner tout le traitement fait par le
 * navigateur — ou faire pointer son avatar vers n'importe quoi.
 */
function estUrlStockageInterne(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  return url.startsWith(`${base}/storage/v1/object/public/products/`);
}

/**
 * PUT /api/membre/profil
 * Met à jour le profil du membre connecté (prénom, nom, téléphone, photo) et,
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
    avatarUrl?: unknown;
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

  // Photo de profil. Champ absent = on n'y touche pas ; chaîne vide = retrait.
  let avatarUrl: string | null | undefined;
  if (body.avatarUrl !== undefined) {
    const brut = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
    if (brut && !estUrlStockageInterne(brut)) {
      return NextResponse.json(
        { error: "Cette image ne provient pas du stockage de Runes & Magie." },
        { status: 400 },
      );
    }
    avatarUrl = brut || null;
  }

  const data: {
    firstName: string;
    lastName: string;
    phone: string | null;
    avatarUrl?: string | null;
    hashedPassword?: string;
  } = {
    firstName,
    lastName,
    phone: phone || null,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
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

  // L'ancienne photo n'a plus de propriétaire : on la retire du stockage une
  // fois l'enregistrement réussi. Côté serveur plutôt que dans le formulaire,
  // pour que le ménage se fasse même si l'onglet est fermé aussitôt après.
  const ancienne = member.avatarUrl;
  if (avatarUrl !== undefined && ancienne && ancienne !== avatarUrl && estUrlStockageInterne(ancienne)) {
    try {
      await deleteImage(ancienne);
    } catch (err) {
      // Un fichier orphelin est sans conséquence : ne jamais faire échouer
      // l'enregistrement du profil pour ça.
      console.error("Suppression de l'ancienne photo de profil échouée:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
