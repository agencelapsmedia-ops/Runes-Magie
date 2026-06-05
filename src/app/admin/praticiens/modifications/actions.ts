'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { notifyAdminsPractitionerChange } from '@/lib/practitioner-change-email';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface ProfilePayload {
  bio?: string;
  specialties?: string[];
  yearsExperience?: number;
  hourlyRate?: number;
  photoUrl?: string | null;
  firstName?: string;
  lastName?: string;
}

interface AvailabilityBlock {
  dayOfWeek: number;
  date?: string | null; // "YYYY-MM-DD" => dispo PONCTUELLE à cette date ; null/absent => hebdo récurrent
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface AvailabilityPayload {
  blocks: AvailabilityBlock[];
}

/**
 * Soumis par le praticien lui-même. Crée une PendingPractitionerChange en statut PENDING.
 * Le profil public n'est PAS modifié immédiatement — il faut l'approbation admin.
 */
export async function requestProfileChange(payload: ProfilePayload): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error('Non connecté.');
  const role = (session.user as { role?: string }).role;
  if (role !== 'PRACTITIONER') throw new Error('Réservé aux praticiens.');
  const practitionerId = (session.user as { practitionerId?: string }).practitionerId;
  if (!practitionerId) throw new Error('Praticien introuvable.');

  const change = await prisma.pendingPractitionerChange.create({
    data: {
      practitionerId,
      type: 'PROFILE',
      payload: payload as object,
      status: 'PENDING',
    },
    include: {
      practitioner: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  // Email aux admins (fail-safe — log si Resend non configuré, n'interrompt jamais le flow)
  await notifyAdminsPractitionerChange({
    practitionerName: `${change.practitioner.user.firstName} ${change.practitioner.user.lastName}`.trim(),
    changeType: 'PROFILE',
    fieldsChanged: Object.keys(payload),
    changeId: change.id,
  });

  revalidatePath('/soins/dashboard/praticien');
  revalidatePath('/admin/praticiens/modifications');
}

export async function requestAvailabilityChange(payload: AvailabilityPayload): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error('Non connecté.');
  const role = (session.user as { role?: string }).role;
  if (role !== 'PRACTITIONER') throw new Error('Réservé aux praticiens.');
  const practitionerId = (session.user as { practitionerId?: string }).practitionerId;
  if (!practitionerId) throw new Error('Praticien introuvable.');

  const change = await prisma.pendingPractitionerChange.create({
    data: {
      practitionerId,
      type: 'AVAILABILITY',
      payload: payload as object,
      status: 'PENDING',
    },
    include: {
      practitioner: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  await notifyAdminsPractitionerChange({
    practitionerName: `${change.practitioner.user.firstName} ${change.practitioner.user.lastName}`.trim(),
    changeType: 'AVAILABILITY',
    fieldsChanged: [`${payload.blocks?.length ?? 0} créneau(x)`],
    changeId: change.id,
  });

  revalidatePath('/soins/dashboard/praticien');
  revalidatePath('/admin/praticiens/modifications');
}

/**
 * Côté admin : applique la modification demandée.
 */
export async function approveChange(changeId: string, adminNote?: string): Promise<void> {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    throw new Error('Réservé aux admins.');
  }
  const adminId = (session.user as { id?: string }).id ?? null;

  const change = await prisma.pendingPractitionerChange.findUnique({
    where: { id: changeId },
  });
  if (!change) throw new Error('Demande introuvable.');
  if (change.status !== 'PENDING') throw new Error('Cette demande a déjà été traitée.');

  if (change.type === 'PROFILE') {
    const p = change.payload as ProfilePayload;
    await prisma.$transaction(async (tx) => {
      // Mise à jour User (nom) si présent
      if (p.firstName !== undefined || p.lastName !== undefined) {
        const practitioner = await tx.practitioner.findUnique({
          where: { id: change.practitionerId },
        });
        if (practitioner) {
          await tx.holisticUser.update({
            where: { id: practitioner.userId },
            data: {
              ...(p.firstName !== undefined && { firstName: p.firstName }),
              ...(p.lastName !== undefined && { lastName: p.lastName }),
            },
          });
        }
      }
      // Mise à jour Practitioner (champs métier)
      await tx.practitioner.update({
        where: { id: change.practitionerId },
        data: {
          ...(p.bio !== undefined && { bio: p.bio }),
          ...(p.specialties !== undefined && { specialties: p.specialties }),
          ...(p.yearsExperience !== undefined && { yearsExperience: p.yearsExperience }),
          ...(p.hourlyRate !== undefined && { hourlyRate: p.hourlyRate }),
          ...(p.photoUrl !== undefined && { photoUrl: p.photoUrl }),
        },
      });
    });
  } else if (change.type === 'AVAILABILITY') {
    const p = change.payload as AvailabilityPayload;
    await prisma.$transaction(async (tx) => {
      // Stratégie : remplace l'ensemble des dispos (le payload est la vérité)
      await tx.holisticAvailability.deleteMany({
        where: { practitionerId: change.practitionerId },
      });
      if (p.blocks?.length) {
        await tx.holisticAvailability.createMany({
          data: p.blocks.map((b) => ({
            practitionerId: change.practitionerId,
            dayOfWeek: b.dayOfWeek,
            date: b.date ? new Date(`${b.date}T12:00:00.000Z`) : null,
            startTime: b.startTime,
            endTime: b.endTime,
            isActive: b.isActive,
          })),
        });
      }
    });
  }

  await prisma.pendingPractitionerChange.update({
    where: { id: changeId },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedById: adminId,
      adminNote: adminNote ?? null,
    },
  });

  revalidatePath('/admin/praticiens');
  revalidatePath('/admin/praticiens/modifications');
  revalidatePath('/soins/praticiens');
  revalidatePath('/soins/dashboard/praticien');
  redirect('/admin/praticiens/modifications');
}

export async function rejectChange(changeId: string, adminNote: string): Promise<void> {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    throw new Error('Réservé aux admins.');
  }
  const adminId = (session.user as { id?: string }).id ?? null;

  const change = await prisma.pendingPractitionerChange.findUnique({
    where: { id: changeId },
  });
  if (!change) throw new Error('Demande introuvable.');
  if (change.status !== 'PENDING') throw new Error('Cette demande a déjà été traitée.');

  if (!adminNote?.trim()) {
    throw new Error('Une raison de rejet est obligatoire pour informer le praticien.');
  }

  await prisma.pendingPractitionerChange.update({
    where: { id: changeId },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedById: adminId,
      adminNote: adminNote.trim(),
    },
  });

  revalidatePath('/admin/praticiens/modifications');
  revalidatePath('/soins/dashboard/praticien');
  redirect('/admin/praticiens/modifications');
}
