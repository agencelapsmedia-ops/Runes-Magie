/**
 * Helpers de compte cliente pour le RDV manuel.
 *  - findOrCreateHolisticClient : retrouve (par courriel) ou crée un HolisticUser CLIENT.
 *    Sans courriel → compte « interne » avec adresse non routable dérivée du téléphone.
 *  - isInternalEmail : true pour ces comptes internes (→ aucun courriel ne leur est envoyé).
 */
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { INTERNAL_EMAIL_DOMAIN } from '@/lib/constants';

/** True si l'adresse appartient au domaine interne non routable (compte sans courriel). */
export function isInternalEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

/** Adresse interne dérivée du téléphone (chiffres uniquement), repli aléatoire si vide. */
function internalEmailFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '') || randomBytes(5).toString('hex');
  return `${digits}@${INTERNAL_EMAIL_DOMAIN}`;
}

export async function findOrCreateHolisticClient(input: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
}): Promise<{
  user: { id: string; email: string; firstName: string; lastName: string; hashedPassword: string; phone: string | null };
  created: boolean;
  internal: boolean;
}> {
  const rawEmail = (input.email ?? '').trim().toLowerCase();
  const internal = rawEmail === '';
  const email = internal ? internalEmailFromPhone(input.phone) : rawEmail;

  const existing = await prisma.holisticUser.findUnique({ where: { email } });
  if (existing) {
    return { user: existing, created: false, internal };
  }

  // Mot de passe aléatoire haché : champ jamais vide ; inutilisable tant que la cliente
  // n'a pas défini le sien via le courriel d'activation (compte interne = jamais).
  const randomPassword = randomBytes(24).toString('hex');
  const hashedPassword = await bcrypt.hash(randomPassword, 12);
  const user = await prisma.holisticUser.create({
    data: {
      email,
      hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: 'CLIENT',
    },
  });
  return { user, created: true, internal };
}
