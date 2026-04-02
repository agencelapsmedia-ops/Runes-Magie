import { redirect } from 'next/navigation';
import Link from 'next/link';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import Button from '@/components/ui/Button';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
    PENDING: {
      bg: 'rgba(201,168,76,0.12)',
      color: '#d4a017',
      border: 'rgba(201,168,76,0.35)',
      label: 'En attente',
    },
    CONFIRMED: {
      bg: 'rgba(46,196,182,0.1)',
      color: 'var(--turquoise-cristal)',
      border: 'rgba(46,196,182,0.35)',
      label: 'Confirmé',
    },
    COMPLETED: {
      bg: 'rgba(34,197,94,0.1)',
      color: '#4ade80',
      border: 'rgba(34,197,94,0.3)',
      label: 'Complété',
    },
    CANCELLED: {
      bg: 'rgba(196,29,110,0.1)',
      color: '#f87171',
      border: 'rgba(196,29,110,0.3)',
      label: 'Annulé',
    },
  };

  const s = map[status] ?? map.PENDING;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 11px',
        borderRadius: '20px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: 'var(--font-cinzel)',
        fontSize: '0.68rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function PractitionerAvatar({
  photoUrl,
  firstName,
  lastName,
}: {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid rgba(74, 45, 122, 0.5)',
          flexShrink: 0,
        }}
      />
    );
  }

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'rgba(74, 45, 122, 0.4)',
        border: '1px solid rgba(74, 45, 122, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-cinzel)',
        fontSize: '0.85rem',
        color: 'var(--or-ancien)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default async function ClientDashboardPage() {
  const session = await holisticSession();

  if (!session?.user) {
    redirect('/soins/auth/login');
  }

  const role = (session.user as any).role as string | undefined;
  if (role && role !== 'CLIENT') {
    redirect('/soins/auth/login');
  }

  const userId = (session.user as any).id as string;
  const firstName = (session.user as any).firstName
    ?? session.user.name?.split(' ')[0]
    ?? 'Cher client';

  const appointments = await prisma.holisticAppointment.findMany({
    where: { clientId: userId },
    include: {
      practitioner: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { startsAt: 'desc' },
  });

  const now = new Date();

  const upcoming = appointments.filter(
    (a) => new Date(a.startsAt) >= now && a.status !== 'CANCELLED',
  );
  const past = appointments.filter(
    (a) => new Date(a.startsAt) < now || a.status === 'COMPLETED' || a.status === 'CANCELLED',
  );

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'var(--font-cinzel)',
    fontSize: '0.88rem',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: 'var(--or-ancien)',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir-nuit)', paddingBottom: '80px' }}>
      {/* Header */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 70%)',
          padding: '60px 24px 50px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: '2.5rem',
              color: 'rgba(201, 168, 76, 0.3)',
              marginBottom: '12px',
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            ᚹ
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
            }}
          >
            Bienvenue, {firstName}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontStyle: 'italic',
              color: 'rgba(232, 220, 190, 0.5)',
              fontSize: '1.1rem',
            }}
          >
            Votre espace de soins holistiques personnalisé
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '28px 0',
            opacity: 0.5,
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(74, 45, 122, 0.4)' }} />
          <span style={{ fontFamily: 'var(--font-cinzel-decorative)', color: 'var(--or-ancien)', fontSize: '1rem' }}>ᚢ ᛟ ᚨ</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(74, 45, 122, 0.4)' }} />
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '48px',
          }}
        >
          {[
            { label: 'Consultations', value: appointments.length, symbol: 'ᚠ' },
            { label: 'À venir', value: upcoming.length, symbol: 'ᛏ' },
            { label: 'Complétées', value: appointments.filter((a) => a.status === 'COMPLETED').length, symbol: 'ᛉ' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--charbon-mystere)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '4px',
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-cinzel-decorative)',
                  fontSize: '1.5rem',
                  color: 'rgba(201, 168, 76, 0.35)',
                  marginBottom: '8px',
                }}
                aria-hidden="true"
              >
                {stat.symbol}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '2rem',
                  color: 'var(--or-ancien)',
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(232, 220, 190, 0.4)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming appointments */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={sectionTitle}>À venir</h2>

          {upcoming.length === 0 ? (
            <div
              style={{
                background: 'var(--charbon-mystere)',
                border: '1px solid rgba(74, 45, 122, 0.3)',
                borderRadius: '4px',
                padding: '40px 32px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-cinzel-decorative)',
                  fontSize: '2.5rem',
                  color: 'rgba(201, 168, 76, 0.25)',
                  marginBottom: '16px',
                }}
                aria-hidden="true"
              >
                ᛟ
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  color: 'rgba(232, 220, 190, 0.4)',
                  fontSize: '1.15rem',
                  lineHeight: 1.8,
                  marginBottom: '24px',
                }}
              >
                Votre chemin de guérison vous attend.<br />
                <span style={{ fontSize: '1rem', opacity: 0.7 }}>Aucun rendez-vous à venir pour le moment.</span>
              </p>
              <Button href="/soins/praticiens" variant="primary" size="sm">
                Trouver un praticien
              </Button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {upcoming.map((appt) => {
                const startsAt = new Date(appt.startsAt);
                const diffMs = startsAt.getTime() - now.getTime();
                const isWithin15Min = diffMs >= 0 && diffMs <= 15 * 60 * 1000;
                const canJoin = appt.status === 'CONFIRMED' && isWithin15Min;
                const practitioner = (appt as any).practitioner;

                return (
                  <div
                    key={appt.id}
                    style={{
                      background: 'var(--charbon-mystere)',
                      border: `1px solid ${canJoin ? 'rgba(46, 196, 182, 0.4)' : 'rgba(74, 45, 122, 0.35)'}`,
                      borderRadius: '4px',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: canJoin ? '0 0 20px rgba(46, 196, 182, 0.08)' : 'none',
                      transition: 'box-shadow 0.3s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <PractitionerAvatar
                        photoUrl={(practitioner as any)?.photoUrl ?? null}
                        firstName={practitioner?.user?.firstName ?? '?'}
                        lastName={practitioner?.user?.lastName ?? '?'}
                      />
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.92rem',
                            color: 'var(--parchemin)',
                            marginBottom: '4px',
                          }}
                        >
                          {practitioner?.user?.firstName} {practitioner?.user?.lastName}
                        </p>
                        {practitioner?.specialties?.length > 0 && (
                          <p
                            style={{
                              fontFamily: 'var(--font-cormorant)',
                              fontSize: '0.9rem',
                              color: 'var(--turquoise-cristal)',
                              opacity: 0.8,
                              marginBottom: '4px',
                            }}
                          >
                            {(practitioner.specialties as string[]).slice(0, 2).join(' · ')}
                          </p>
                        )}
                        <p
                          style={{
                            fontFamily: 'var(--font-cormorant)',
                            fontSize: '0.95rem',
                            color: 'rgba(232, 220, 190, 0.5)',
                            marginBottom: '8px',
                          }}
                        >
                          {formatDate(startsAt)} à {formatTime(startsAt)}
                        </p>
                        <StatusBadge status={appt.status} />
                      </div>
                    </div>
                    {canJoin && (
                      <Link
                        href={`/soins/consultation/${appt.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '10px 22px',
                          fontFamily: 'var(--font-cinzel)',
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          background: 'rgba(46, 196, 182, 0.15)',
                          color: 'var(--turquoise-cristal)',
                          border: '1px solid rgba(46, 196, 182, 0.4)',
                          borderRadius: '2px',
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 0 12px rgba(46, 196, 182, 0.1)',
                        }}
                      >
                        Rejoindre la séance →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past appointments */}
        {past.length > 0 && (
          <section>
            <h2 style={sectionTitle}>Passées</h2>

            <div style={{ display: 'grid', gap: '10px' }}>
              {past.map((appt) => {
                const startsAt = new Date(appt.startsAt);
                const practitioner = (appt as any).practitioner;

                return (
                  <div
                    key={appt.id}
                    style={{
                      background: 'rgba(26, 26, 46, 0.5)',
                      border: '1px solid rgba(74, 45, 122, 0.25)',
                      borderRadius: '4px',
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <PractitionerAvatar
                        photoUrl={(practitioner as any)?.photoUrl ?? null}
                        firstName={practitioner?.user?.firstName ?? '?'}
                        lastName={practitioner?.user?.lastName ?? '?'}
                      />
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.85rem',
                            color: 'rgba(232, 220, 190, 0.65)',
                            marginBottom: '3px',
                          }}
                        >
                          {practitioner?.user?.firstName} {practitioner?.user?.lastName}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-cormorant)',
                            fontSize: '0.9rem',
                            color: 'rgba(232, 220, 190, 0.38)',
                            marginBottom: '6px',
                          }}
                        >
                          {formatDate(startsAt)} à {formatTime(startsAt)}
                        </p>
                        <StatusBadge status={appt.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
