import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { reconcileGuestOrders } from '@/lib/entitlements';
import MembreShell from '@/components/membre/MembreShell';

export const metadata: Metadata = {
  title: 'Mon espace membre | Runes & Magie',
  robots: { index: false, follow: false },
};

export default async function CompteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;

  // Garde d'accès : il faut être un membre (HolisticUser). La session peut aussi
  // appartenir à un AdminUser (id absent de HolisticUser) → on renvoie au login.
  const member = sessionUserId
    ? await prisma.holisticUser.findUnique({
        where: { id: sessionUserId },
        select: { firstName: true, lastName: true, email: true },
      })
    : null;

  if (!member) {
    redirect('/soins/auth/login?next=/compte');
  }

  // Rattache d'éventuelles commandes passées en invité (même email) au compte.
  try {
    await reconcileGuestOrders(sessionUserId!, member.email);
  } catch (err) {
    console.error('Réconciliation des commandes invité échouée:', err);
  }

  return <MembreShell user={member}>{children}</MembreShell>;
}
