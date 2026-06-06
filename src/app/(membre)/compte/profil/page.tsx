import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MembreHeader } from '@/components/membre/MembrePage';

export default async function ProfilPage() {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const member = sessionUserId
    ? await prisma.holisticUser.findUnique({
        where: { id: sessionUserId },
        select: { firstName: true, lastName: true, email: true, phone: true },
      })
    : null;

  const rows: { label: string; value: string }[] = [
    { label: 'Prénom', value: member?.firstName ?? '—' },
    { label: 'Nom', value: member?.lastName ?? '—' },
    { label: 'Courriel', value: member?.email ?? '—' },
    { label: 'Téléphone', value: member?.phone ?? '—' },
  ];

  return (
    <div>
      <MembreHeader emoji="⚙️" title="Mon profil" subtitle="Vos informations de compte" />

      <div
        className="overflow-hidden rounded-sm border"
        style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-6 py-4"
            style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(74, 45, 122, 0.2)' }}
          >
            <span className="font-cinzel text-xs uppercase tracking-widest text-parchemin/45">
              {row.label}
            </span>
            <span className="font-cormorant text-lg text-parchemin">{row.value}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 font-cormorant text-base italic text-parchemin/40">
        La modification du profil et du mot de passe sera disponible prochainement (Phase 6).
      </p>
    </div>
  );
}
