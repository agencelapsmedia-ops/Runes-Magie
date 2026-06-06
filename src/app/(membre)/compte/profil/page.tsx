import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembreHeader } from '@/components/membre/MembrePage';
import ProfilForm from '@/components/membre/ProfilForm';

export default async function ProfilPage() {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const member = sessionUserId
    ? await prisma.holisticUser.findUnique({
        where: { id: sessionUserId },
        select: { firstName: true, lastName: true, email: true, phone: true },
      })
    : null;

  return (
    <div>
      <MembreHeader emoji="⚙️" title="Mon profil" subtitle="Vos informations de compte" />

      <ProfilForm
        initial={{
          firstName: member?.firstName ?? '',
          lastName: member?.lastName ?? '',
          email: member?.email ?? '',
          phone: member?.phone ?? '',
        }}
      />
    </div>
  );
}
