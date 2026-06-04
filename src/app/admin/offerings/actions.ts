'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePractitioners(formData: FormData): string[] {
  // Multi-select : récupère tous les inputs name="practitionerIds"
  return formData.getAll('practitionerIds').map((v) => String(v)).filter(Boolean);
}

function parseModes(formData: FormData): string[] {
  const modes: string[] = [];
  if (formData.get('modeInPerson') === 'on') modes.push('IN_PERSON');
  if (formData.get('modeVirtual') === 'on') modes.push('VIRTUAL');
  return modes;
}

function readOfferingFields(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? '').trim().toUpperCase().replace(/\s+/g, '_');
  const description = String(formData.get('description') ?? '').trim();
  const longDescription = String(formData.get('longDescription') ?? '').trim();
  const durationMinutes = Number(formData.get('durationMinutes') ?? 60);
  const capacity = Number(formData.get('capacity') ?? 1);
  const price = Number(formData.get('price') ?? 0);
  const priceForTwoStr = String(formData.get('priceForTwo') ?? '').trim();
  const pricePackageStr = String(formData.get('pricePackage') ?? '').trim();
  const pricePackageMsrpStr = String(formData.get('pricePackageMsrp') ?? '').trim();
  const numSessionsStr = String(formData.get('numSessions') ?? '').trim();
  const emoji = String(formData.get('emoji') ?? '*').trim() || '*';
  const sortOrder = Number(formData.get('sortOrder') ?? 0);
  const isFeatured = formData.get('isFeatured') === 'on';
  const isActive = formData.get('isActive') !== 'off'; // default true

  return {
    name,
    type,
    description: description || name,
    longDescription,
    durationMinutes,
    capacity,
    price,
    priceForTwo: priceForTwoStr ? Number(priceForTwoStr) : null,
    pricePackage: pricePackageStr ? Number(pricePackageStr) : null,
    pricePackageMsrp: pricePackageMsrpStr ? Number(pricePackageMsrpStr) : null,
    numSessions: numSessionsStr ? Number(numSessionsStr) : null,
    emoji,
    sortOrder,
    isFeatured,
    isActive,
  };
}

export async function createOffering(formData: FormData): Promise<void> {
  const fields = readOfferingFields(formData);
  const practitionerIds = parsePractitioners(formData);
  const modes = parseModes(formData);

  if (!fields.name || !fields.type || !practitionerIds.length || !modes.length) {
    throw new Error('Nom, type, au moins 1 praticien·ne et au moins 1 mode sont obligatoires.');
  }

  const baseSlug = makeSlug(fields.name);
  // Garantit l'unicité du slug
  let slug = baseSlug;
  let i = 1;
  while (await prisma.offering.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const primaryId = practitionerIds[0];
  const additionalIds = practitionerIds.slice(1);

  const offering = await prisma.offering.create({
    data: {
      practitionerId: primaryId,
      type: fields.type,
      slug,
      name: fields.name,
      description: fields.description,
      longDescription: fields.longDescription,
      durationMinutes: fields.durationMinutes,
      bufferMinutes: 15,
      price: fields.price,
      priceForTwo: fields.priceForTwo,
      pricePackage: fields.pricePackage,
      pricePackageMsrp: fields.pricePackageMsrp,
      numSessions: fields.numSessions,
      currency: 'CAD',
      modes,
      capacity: fields.capacity,
      colorHex: '#6B3FA0',
      emoji: fields.emoji,
      imageUrl: null,
      features: [],
      isActive: fields.isActive,
      isFeatured: fields.isFeatured,
      sortOrder: fields.sortOrder,
    },
  });

  for (const pid of additionalIds) {
    await prisma.offeringProvider.create({
      data: { offeringId: offering.id, practitionerId: pid },
    });
  }

  revalidatePath('/admin/offerings');
  revalidatePath('/soins');
  redirect('/admin/offerings');
}

export async function updateOffering(id: string, formData: FormData): Promise<void> {
  const offering = await prisma.offering.findUnique({ where: { id } });
  if (!offering) throw new Error('Service introuvable.');

  const fields = readOfferingFields(formData);
  const practitionerIds = parsePractitioners(formData);
  const modes = parseModes(formData);

  if (!fields.name || !fields.type || !practitionerIds.length || !modes.length) {
    throw new Error('Nom, type, au moins 1 praticien·ne et au moins 1 mode sont obligatoires.');
  }

  const primaryId = practitionerIds[0];
  const additionalIds = practitionerIds.slice(1);

  await prisma.offering.update({
    where: { id },
    data: {
      practitionerId: primaryId,
      type: fields.type,
      name: fields.name,
      description: fields.description,
      longDescription: fields.longDescription,
      durationMinutes: fields.durationMinutes,
      price: fields.price,
      priceForTwo: fields.priceForTwo,
      pricePackage: fields.pricePackage,
      pricePackageMsrp: fields.pricePackageMsrp,
      numSessions: fields.numSessions,
      modes,
      capacity: fields.capacity,
      emoji: fields.emoji,
      isActive: fields.isActive,
      isFeatured: fields.isFeatured,
      sortOrder: fields.sortOrder,
    },
  });

  // Re-synchronise les providers additionnels
  await prisma.offeringProvider.deleteMany({ where: { offeringId: id } });
  for (const pid of additionalIds) {
    await prisma.offeringProvider.create({
      data: { offeringId: id, practitionerId: pid },
    });
  }

  revalidatePath('/admin/offerings');
  revalidatePath('/soins');
  redirect('/admin/offerings');
}

export async function deleteOffering(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  // Un service avec des réservations ne peut pas être supprimé sans effacer
  // l'historique (réservations + paiements). On bloque proprement.
  const bookingsCount = await prisma.booking.count({ where: { offeringId: id } });
  if (bookingsCount > 0) {
    return {
      ok: false,
      error: `Impossible de supprimer : ce service a ${bookingsCount} réservation${bookingsCount > 1 ? 's' : ''} (la suppression effacerait l'historique). Décochez plutôt « Service actif » pour le retirer du site.`,
    };
  }
  await prisma.offeringProvider.deleteMany({ where: { offeringId: id } });
  await prisma.offering.delete({ where: { id } });
  revalidatePath('/admin/offerings');
  revalidatePath('/soins');
  return { ok: true };
}

export async function toggleOfferingActive(id: string): Promise<void> {
  const o = await prisma.offering.findUnique({ where: { id } });
  if (!o) throw new Error('Service introuvable.');
  await prisma.offering.update({
    where: { id },
    data: { isActive: !o.isActive },
  });
  revalidatePath('/admin/offerings');
  revalidatePath('/soins');
}
