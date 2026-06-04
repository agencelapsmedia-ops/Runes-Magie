import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Regroupement des types d'offering par page publique.
 * Décision cliente (« Strict ») :
 *  - Séances ← SOIN + CONSULTATION
 *  - École   ← COURS + ATELIER
 * (Guidance, Cérémonie, Service extérieur : pages séparées plus tard.)
 */
export const SEANCES_TYPES = ['SOIN', 'CONSULTATION'] as const;
export const ECOLE_TYPES = ['COURS', 'ATELIER'] as const;

const offeringInclude = {
  practitioner: {
    include: { user: { select: { firstName: true, lastName: true } } },
  },
} satisfies Prisma.OfferingInclude;

type OfferingRow = Prisma.OfferingGetPayload<{ include: typeof offeringInclude }>;

export interface OfferingView {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  longDescription: string;
  priceLabel: string;
  durationLabel: string;
  features: string[];
  practitionerName: string;
  modes: string[];
  isFormation: boolean;
  sessionsLabel: string | null;
  bookingHref: string;
  imageUrl: string | null;
  detailHref: string;
}

function money(n: number): string {
  return `${n.toFixed(2)} $`;
}

function toView(o: OfferingRow): OfferingView {
  const priceLabel = o.priceForTwo
    ? `${money(o.price)} / ${money(o.priceForTwo)} duo`
    : money(o.price);
  const durationLabel =
    `${o.durationMinutes} min` + (o.capacity > 1 ? ` · ${o.capacity} places` : '');
  const lastName = o.practitioner.user.lastName;
  const practitionerName = `${o.practitioner.user.firstName}${lastName ? ' ' + lastName : ''}`;
  const detailHref = (SEANCES_TYPES as readonly string[]).includes(o.type)
    ? `/seances/${o.slug}`
    : `/ecole/${o.slug}`;

  return {
    slug: o.slug,
    name: o.name,
    emoji: o.emoji,
    description: o.description,
    longDescription: o.longDescription || o.description,
    priceLabel,
    durationLabel,
    features: o.features,
    practitionerName,
    modes: o.modes,
    isFormation: o.pricePackage != null || (o.numSessions ?? 0) > 1,
    sessionsLabel: o.numSessions ? `${o.numSessions} séances` : null,
    bookingHref: `/soins/reserver/${o.practitionerId}?offering=${o.slug}`,
    imageUrl: o.imageUrl,
    detailHref,
  };
}

async function fetchByTypes(types: readonly string[]): Promise<OfferingView[]> {
  const rows = await prisma.offering.findMany({
    where: { type: { in: [...types] }, isActive: true },
    include: offeringInclude,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map(toView);
}

export function getSeancesOfferings(): Promise<OfferingView[]> {
  return fetchByTypes(SEANCES_TYPES);
}

export function getEcoleOfferings(): Promise<OfferingView[]> {
  return fetchByTypes(ECOLE_TYPES);
}

/** Aperçu pour la page d'accueil : un échantillon de séances + cours/ateliers. */
export async function getHomeOfferings(limit = 6): Promise<OfferingView[]> {
  const rows = await prisma.offering.findMany({
    where: { type: { in: [...SEANCES_TYPES, ...ECOLE_TYPES] }, isActive: true },
    include: offeringInclude,
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    take: limit,
  });
  return rows.map(toView);
}

export async function getOfferingViewBySlug(
  slug: string,
  allowedTypes: readonly string[],
): Promise<OfferingView | null> {
  const o = await prisma.offering.findFirst({
    where: { slug, isActive: true, type: { in: [...allowedTypes] } },
    include: offeringInclude,
  });
  return o ? toView(o) : null;
}
