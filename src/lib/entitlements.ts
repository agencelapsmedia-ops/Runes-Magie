/**
 * entitlements.ts — Accès des membres aux contenus ACHETÉS (cours, ebooks).
 *
 * Rappel (voir docs/superpowers/plans/2026-06-06-espace-membre.md) :
 *   - Cours / ebooks  → nécessitent un MemberEntitlement (octroyé au paiement).
 *   - Merestegere / Veillées / Bibliothèque → GRATUITS pour tout membre connecté,
 *     donc PAS gérés ici (il suffit d'être authentifié).
 */

import { prisma } from "@/lib/db";

export type EntitlementKind = "COURSE" | "EBOOK";
export type EntitlementSource = "PURCHASE" | "MANUAL" | "GIFT";

/**
 * Octroie l'accès à un produit (cours/ebook) pour un utilisateur.
 * Idempotent grâce à @@unique([userId, productId]) : un re-call (ex : webhook
 * Stripe rejoué) ne crée pas de doublon.
 */
export async function grantEntitlement(params: {
  userId: string;
  productId: string;
  kind: EntitlementKind;
  source?: EntitlementSource;
  orderId?: string | null;
  expiresAt?: Date | null;
}) {
  const { userId, productId, kind, source = "PURCHASE", orderId = null, expiresAt = null } = params;

  return prisma.memberEntitlement.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, kind, source, orderId, expiresAt },
    update: {}, // déjà accordé → on ne touche à rien
  });
}

/**
 * À partir d'une commande payée, octroie l'accès à tous les produits de type
 * COURSE / EBOOK qu'elle contient — si la commande est rattachée à un compte.
 * Sans userId (achat invité), on ne peut rien octroyer : l'accès sera réconcilié
 * plus tard quand l'invité créera/connectera un compte avec le même email.
 */
export async function grantEntitlementsForOrder(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || !order.userId) return 0;

  const productIds = order.items
    .map((i) => i.productId)
    .filter((id): id is string => Boolean(id));

  if (productIds.length === 0) return 0;

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, productType: { in: ["COURSE", "EBOOK"] } },
    select: { id: true, productType: true },
  });

  let granted = 0;
  for (const product of products) {
    await grantEntitlement({
      userId: order.userId,
      productId: product.id,
      kind: product.productType as EntitlementKind,
      source: "PURCHASE",
      orderId: order.id,
    });
    granted += 1;
  }

  return granted;
}

/** Vrai si l'utilisateur a un accès (non expiré) au produit donné. */
export async function hasEntitlement(userId: string, productId: string): Promise<boolean> {
  const ent = await prisma.memberEntitlement.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (!ent) return false;
  if (ent.expiresAt && ent.expiresAt < new Date()) return false;
  return true;
}

/** Liste les entitlements actifs d'un utilisateur (optionnellement filtrés par type). */
export async function listEntitlements(userId: string, kind?: EntitlementKind) {
  return prisma.memberEntitlement.findMany({
    where: {
      userId,
      ...(kind ? { kind } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { grantedAt: "desc" },
  });
}
