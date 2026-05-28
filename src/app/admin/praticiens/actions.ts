'use server';

import { prisma } from '@/lib/db';
import { uploadImage, deleteImage } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Slug helper : "Marie-Pierre Lefèvre" → "marie-pierre-lefevre"
function makeSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents combinants
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Parse "Reiki, Soins Énergétiques" → ['Reiki', 'Soins Énergétiques']
function parseSpecialties(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Génère un mot de passe random de 16 caractères
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

/**
 * Crée un nouveau praticien (statut APPROVED par défaut depuis l'admin).
 * Génère un mot de passe automatique qu'on retourne pour affichage une seule fois.
 */
export async function createPractitioner(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const specialties = parseSpecialties(formData.get('specialties'));
  const yearsExperience = Number(formData.get('yearsExperience') ?? 0);
  // Prix par séance (90 min) → stocké en $/h (séance / 1.5)
  const sessionPrice = Number(formData.get('sessionPrice') ?? 0);
  const hourlyRate = sessionPrice > 0 ? sessionPrice / 1.5 : 80;
  const photoUrlText = String(formData.get('photoUrlText') ?? '').trim();
  const photoFile = formData.get('photoFile') as File | null;

  if (!email || !firstName) {
    throw new Error('Email et prénom sont obligatoires.');
  }

  // Empêche les doublons
  const existing = await prisma.holisticUser.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`Un compte avec l'email ${email} existe déjà.`);
  }

  // Upload photo si fichier fourni, sinon prend l'URL texte
  let photoUrl: string | null = photoUrlText || null;
  if (photoFile && photoFile.size > 0) {
    photoUrl = await uploadImage(photoFile, 'praticiens');
  }

  const password = generatePassword();
  const hashedPassword = await bcrypt.hash(password, 12);
  const slug = makeSlug(firstName, lastName || firstName);

  await prisma.holisticUser.create({
    data: {
      email,
      hashedPassword,
      firstName,
      lastName,
      role: 'PRACTITIONER',
      practitioner: {
        create: {
          slug,
          status: 'APPROVED',
          bio,
          specialties,
          yearsExperience,
          hourlyRate,
          photoUrl,
          approvedAt: new Date(),
        },
      },
    },
  });

  revalidatePath('/admin/praticiens');
  revalidatePath('/soins/praticiens');
  // Le mot de passe généré est passé dans l'URL pour affichage une seule fois
  redirect(`/admin/praticiens?tab=APPROVED&newPassword=${encodeURIComponent(password)}&newEmail=${encodeURIComponent(email)}`);
}

/**
 * Modifie un praticien existant. Tous les champs sont optionnels.
 */
export async function updatePractitioner(id: string, formData: FormData): Promise<void> {
  const practitioner = await prisma.practitioner.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!practitioner) throw new Error('Praticien introuvable.');

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const specialties = parseSpecialties(formData.get('specialties'));
  const yearsExperience = Number(formData.get('yearsExperience') ?? 0);
  const sessionPrice = Number(formData.get('sessionPrice') ?? 0);
  const hourlyRate = sessionPrice > 0 ? sessionPrice / 1.5 : practitioner.hourlyRate;
  const photoUrlText = String(formData.get('photoUrlText') ?? '').trim();
  const photoFile = formData.get('photoFile') as File | null;

  if (!email || !firstName) throw new Error('Email et prénom sont obligatoires.');

  // Gestion photo : nouveau fichier > URL texte > inchangé
  let photoUrl: string | null = practitioner.photoUrl;
  if (photoFile && photoFile.size > 0) {
    // Supprime l'ancienne photo Supabase si elle y était
    if (practitioner.photoUrl?.includes('/storage/v1/object/public/products/')) {
      await deleteImage(practitioner.photoUrl).catch(() => {});
    }
    photoUrl = await uploadImage(photoFile, 'praticiens');
  } else if (photoUrlText && photoUrlText !== practitioner.photoUrl) {
    photoUrl = photoUrlText;
  }

  // Si email/nom change, vérifier unicité email et regénérer slug si nom change
  if (email !== practitioner.user.email) {
    const dupe = await prisma.holisticUser.findUnique({ where: { email } });
    if (dupe && dupe.id !== practitioner.userId) {
      throw new Error(`L'email ${email} est déjà utilisé.`);
    }
  }

  const newSlug =
    firstName !== practitioner.user.firstName || lastName !== practitioner.user.lastName
      ? makeSlug(firstName, lastName || firstName)
      : practitioner.slug;

  await prisma.holisticUser.update({
    where: { id: practitioner.userId },
    data: {
      email,
      firstName,
      lastName,
      practitioner: {
        update: {
          slug: newSlug,
          bio,
          specialties,
          yearsExperience,
          hourlyRate,
          photoUrl,
        },
      },
    },
  });

  revalidatePath('/admin/praticiens');
  revalidatePath('/soins/praticiens');
  revalidatePath(`/soins/praticiens/${newSlug}`);
  redirect('/admin/praticiens?tab=APPROVED');
}

/**
 * Supprime définitivement un praticien (cascade sur Practitioner, Availability, etc.)
 */
export async function deletePractitioner(id: string): Promise<void> {
  const practitioner = await prisma.practitioner.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!practitioner) throw new Error('Praticien introuvable.');

  // Supprime la photo Supabase Storage si applicable
  if (practitioner.photoUrl?.includes('/storage/v1/object/public/products/')) {
    await deleteImage(practitioner.photoUrl).catch(() => {});
  }

  // Cascade : HolisticUser → Practitioner → HolisticAvailability, etc.
  await prisma.holisticUser.delete({ where: { id: practitioner.userId } });

  revalidatePath('/admin/praticiens');
  revalidatePath('/soins/praticiens');
  redirect('/admin/praticiens?tab=APPROVED');
}
