import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ProfileEditor from './ProfileEditor';

export default async function PraticienProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/soins/auth/login');

  const role = (session.user as { role?: string }).role;
  if (role !== 'PRACTITIONER') {
    if (role === 'CLIENT') redirect('/soins/dashboard/client');
    if (role === 'ADMIN') redirect('/admin');
    redirect('/soins/auth/login');
  }

  const practitionerId = (session.user as { practitionerId?: string }).practitionerId;
  if (!practitionerId) redirect('/soins');

  const practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!practitioner) redirect('/soins');

  // Demandes de modif de profil en attente (les plus récentes en premier)
  const pendingProfileChanges = await prisma.pendingPractitionerChange.findMany({
    where: { practitionerId, type: 'PROFILE', status: 'PENDING' },
    orderBy: { requestedAt: 'desc' },
  });

  return (
    <div style={{ background: 'var(--noir-nuit)', minHeight: '100vh', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Link
          href="/soins/dashboard/praticien"
          style={{
            display: 'inline-block',
            marginBottom: '20px',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.8rem',
            color: 'var(--turquoise-cristal)',
            textDecoration: 'none',
            letterSpacing: '0.1em',
          }}
        >
          ← Retour au tableau de bord
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
            background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}
        >
          Mon profil
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            color: 'var(--parchemin)/60',
            fontSize: '1.05rem',
            marginBottom: '32px',
          }}
        >
          Modifications soumises à l&apos;approbation de Runes &amp; Magie. Tes infos actuelles
          restent visibles aux clients jusqu&apos;à validation.
        </p>

        {/* Bandeau modifications en attente */}
        {pendingProfileChanges.length > 0 && (
          <div
            style={{
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-cinzel)',
                color: 'var(--or-ancien)',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              ⏳ {pendingProfileChanges.length} demande{pendingProfileChanges.length > 1 ? 's' : ''} en attente d&apos;approbation
            </p>
            <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', fontSize: '0.95rem', marginBottom: 0 }}>
              Soumise{pendingProfileChanges.length > 1 ? 's' : ''} le{' '}
              {pendingProfileChanges
                .map((c) => new Date(c.requestedAt).toLocaleDateString('fr-CA'))
                .join(', ')}
              . Tu seras notifié·e dès qu&apos;elle{pendingProfileChanges.length > 1 ? 's seront' : ' sera'} traitée{pendingProfileChanges.length > 1 ? 's' : ''}.
            </p>
          </div>
        )}

        <ProfileEditor
          defaults={{
            firstName: practitioner.user.firstName,
            lastName: practitioner.user.lastName,
            bio: practitioner.bio,
            specialties: practitioner.specialties,
            yearsExperience: practitioner.yearsExperience,
            hourlyRate: practitioner.hourlyRate,
            photoUrl: practitioner.photoUrl,
          }}
        />
      </div>
    </div>
  );
}
