import Link from 'next/link';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Page de remerciement affichée après un paiement de réservation réussi
 * (success_url de Stripe Checkout → ?appointment=<id>).
 * Publique (pas de garde d'auth) : elle doit s'afficher même si la session
 * n'est pas encore rechargée après le retour de Stripe.
 */
export default async function ReservationConfirmeePage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const { appointment: appointmentId } = await searchParams;

  let practitionerName = '';
  let serviceName = '';
  let startsAt: Date | null = null;

  if (appointmentId) {
    const appt = await prisma.holisticAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        practitioner: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (appt) {
      const lastName = appt.practitioner.user.lastName;
      practitionerName = `${appt.practitioner.user.firstName}${lastName ? ' ' + lastName : ''}`.trim();
      startsAt = appt.startsAt;
      const m = (appt.notes ?? '').match(/Service\s*:\s*([^\n]+)/);
      if (m) serviceName = m[1].trim();
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--noir-nuit)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          background: 'var(--charbon-mystere)',
          border: '1px solid rgba(201, 168, 76, 0.3)',
          borderRadius: '8px',
          padding: '48px 32px',
          boxShadow: '0 0 60px rgba(201, 168, 76, 0.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: '3rem',
            color: 'rgba(201, 168, 76, 0.5)',
            marginBottom: '12px',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ᛟ
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
            background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}
        >
          Merci d&apos;avoir réservé un soin
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            color: 'var(--parchemin)',
            opacity: 0.85,
            fontSize: '1.2rem',
            lineHeight: 1.7,
            marginBottom: '6px',
          }}
        >
          Ta réservation est confirmée
          {practitionerName && (
            <>
              {' '}avec{' '}
              <strong style={{ color: 'var(--or-ancien)', fontStyle: 'normal' }}>{practitionerName}</strong>
            </>
          )}
          .
        </p>

        {serviceName && (
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              color: 'var(--turquoise-cristal)',
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            {serviceName}
          </p>
        )}

        {startsAt && (
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              color: 'rgba(232, 220, 190, 0.6)',
              fontSize: '1.05rem',
              marginBottom: '24px',
              textTransform: 'capitalize',
            }}
          >
            {formatDateTime(startsAt)}
          </p>
        )}

        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            color: 'rgba(232, 220, 190, 0.5)',
            fontSize: '0.98rem',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          Un courriel de confirmation t&apos;a été envoyé. Tu retrouveras tous les détails
          dans ton espace.
        </p>

        <Link
          href="/soins/dashboard/client"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '14px 32px',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
            color: 'var(--noir-nuit)',
            border: 'none',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Voir mes réservations →
        </Link>
      </div>
    </div>
  );
}
