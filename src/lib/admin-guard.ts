import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Garde d'accès aux routes admin. Vérifie :
 *   1) Une session est valide
 *   2) Le rôle est ADMIN (pas seulement connecté)
 *
 * À utiliser en début de TOUTE route /api/admin/* avant d'exécuter la logique.
 *
 * Exemple :
 *   export async function POST(req) {
 *     const guard = await requireAdmin();
 *     if (guard) return guard;
 *     // ... logique admin
 *   }
 *
 * IMPORTANT : ce check existe parce que /api/auth/* accepte aussi les
 * HolisticUser (clients + praticiens) depuis la fusion auth.ts. Sans ce
 * check sur le rôle, n'importe quel client connecté pourrait appeler
 * les routes admin.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé — connexion requise." }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role;
  // La praticienne propriétaire (isOwner) a aussi les droits admin, même si son
  // rôle reste PRACTITIONER (une seule connexion pour gérer les deux espaces).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session.user as any).isOwner === true;
  if (role !== "ADMIN" && !isOwner) {
    return NextResponse.json(
      { error: "Accès refusé — réservé à l'administration." },
      { status: 403 },
    );
  }
  return null;
}
