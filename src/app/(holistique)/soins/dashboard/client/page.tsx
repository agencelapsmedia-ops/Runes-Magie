import { redirect } from 'next/navigation';
import { holisticSession } from '@/lib/holistic-auth';

/**
 * L'ancien tableau de bord client a été fusionné dans l'espace membre unifié
 * (`/compte`). Cette page ne fait plus que rediriger vers le bon endroit selon
 * le rôle, pour préserver les anciens liens (callbackUrl de login, etc.).
 */
export default async function ClientDashboardRedirect() {
  const session = await holisticSession();

  if (!session?.user) {
    redirect('/soins/auth/login');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role as string | undefined;

  if (role === 'PRACTITIONER') {
    redirect('/soins/dashboard/praticien');
  }
  if (role === 'ADMIN') {
    redirect('/admin');
  }

  // Client → espace membre unifié
  redirect('/compte');
}
