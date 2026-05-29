import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AvailabilityEditor from './AvailabilityEditor';

export default async function PraticienAvailabilitiesPage() {
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

  // Dispos actuelles (groupées par jour)
  const availabilities = await prisma.holisticAvailability.findMany({
    where: { practitionerId, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  // Demandes de modif de dispos en attente
  const pendingChanges = await prisma.pendingPractitionerChange.findMany({
    where: { practitionerId, type: 'AVAILABILITY', status: 'PENDING' },
    orderBy: { requestedAt: 'desc' },
  });

  return (
    <div style={{ background: 'var(--noir-nuit)', minHeight: '100vh', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
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
          Mes disponibilités
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            color: 'var(--parchemin)',
            opacity: 0.6,
            fontSize: '1.05rem',
            marginBottom: '32px',
          }}
        >
          Modifie tes créneaux de la semaine type. Les modifications sont soumises à
          l&apos;approbation de Runes &amp; Magie. Tes créneaux actuels restent actifs jusqu&apos;à
          validation.
        </p>

        {pendingChanges.length > 0 && (
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
                marginBottom: '4px',
              }}
            >
              ⏳ {pendingChanges.length} demande{pendingChanges.length > 1 ? 's' : ''} de modification de dispos en attente
            </p>
            <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', fontSize: '0.95rem', marginBottom: 0 }}>
              Soumise le {new Date(pendingChanges[0].requestedAt).toLocaleDateString('fr-CA')}.
            </p>
          </div>
        )}

        <AvailabilityEditor
          initialBlocks={availabilities.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            isActive: a.isActive,
          }))}
        />
      </div>
    </div>
  );
}
