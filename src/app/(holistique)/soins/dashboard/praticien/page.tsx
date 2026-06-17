import { redirect } from 'next/navigation';
import Link from 'next/link';
import { holisticSession } from '@/lib/holistic-auth';
import { prisma } from '@/lib/db';
import Button from '@/components/ui/Button';
import StripeConnectBanner from './StripeConnectBanner';
import GoogleCalendarBanner from './GoogleCalendarBanner';
import CompleteAppointmentButton from './CompleteAppointmentButton';
import RescheduleButton from './RescheduleButton';
import ManualAppointmentButton from '@/components/holistique/ManualAppointmentButton';

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

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default async function PraticienDashboardPage() {
  const session = await holisticSession();

  if (!session?.user) {
    redirect('/soins/auth/login');
  }

  const role = (session.user as any).role as string;
  // Rediriger vers le bon dashboard selon le rôle (au lieu de boucler vers /login)
  if (role === 'CLIENT') {
    redirect('/soins/dashboard/client');
  }
  if (role === 'ADMIN') {
    redirect('/admin');
  }

  const userId = (session.user as any).id as string;
  const practitionerId = (session.user as any).practitionerId as string;

  if (!practitionerId) {
    // Praticien sans fiche (cas anormal) : retour à l'accueil
    redirect('/soins');
  }

  let practitioner = await prisma.practitioner.findUnique({
    where: { id: practitionerId },
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  });

  // Auto-refresh du statut Stripe Connect : si on a un account mais qu'il n'est
  // pas encore marqué "ready", on re-demande à Stripe (capacités peuvent passer
  // à actif après upload de documents). Best-effort, n'échoue jamais le rendu.
  if (practitioner?.stripeAccountId && !practitioner.stripeAccountReady) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Stripe = (await import('stripe')).default as any;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiVersion: '2026-03-25.dahlia' as any,
      });
      const account = await stripe.accounts.retrieve(practitioner.stripeAccountId);
      const ready = !!(account.charges_enabled && account.payouts_enabled && account.details_submitted);
      if (ready !== practitioner.stripeAccountReady) {
        await prisma.practitioner.update({
          where: { id: practitionerId },
          data: { stripeAccountReady: ready },
        });
        practitioner = { ...practitioner, stripeAccountReady: ready };
      }
    } catch (err) {
      console.error('[dashboard] auto-refresh Stripe status failed', err);
    }
  }

  if (!practitioner) {
    redirect('/soins/auth/login');
  }

  const practitionerStatus = practitioner.status;

  // --- PENDING state: waiting for approval ---
  if (practitionerStatus === 'PENDING') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--noir-nuit)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ maxWidth: '580px', width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: '4rem',
              color: 'rgba(201, 168, 76, 0.4)',
              marginBottom: '20px',
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            ᛏ
          </div>
          <div
            style={{
              background: 'var(--charbon-mystere)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '4px',
              padding: '40px 32px',
              boxShadow: '0 0 60px rgba(201, 168, 76, 0.06)',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-cinzel-decorative)',
                fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '20px',
              }}
            >
              Profil en attente de validation
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                color: 'rgba(232, 220, 190, 0.65)',
                lineHeight: 1.85,
                marginBottom: '20px',
              }}
            >
              Votre profil est en cours de validation par notre équipe.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1rem',
                color: 'rgba(232, 220, 190, 0.45)',
                lineHeight: 1.8,
                marginBottom: '32px',
              }}
            >
              Vous recevrez un courriel de confirmation dès que votre dossier sera approuvé.
              Ce processus prend généralement 24 à 48 heures ouvrables.
            </p>
            <div
              style={{
                background: 'rgba(201, 168, 76, 0.06)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '4px',
                padding: '14px 20px',
                marginBottom: '28px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(201, 168, 76, 0.6)',
                }}
              >
                Connecté en tant que : {practitioner.user.firstName} {practitioner.user.lastName}
              </p>
            </div>
            <Button href="/soins" variant="secondary" size="sm">
              Retour à la plateforme
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Fetch dashboard data ---
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [upcomingAppointments, monthRevenue, totalCompleted, pendingChangesCount, myOfferings] = await Promise.all([
    prisma.holisticAppointment.findMany({
      where: {
        practitionerId,
        // Seulement les RDV payés (CONFIRMED) : on n'affiche pas les « en attente »
        // (paiement non complété) dans l'espace praticien.
        status: 'CONFIRMED',
        // Inclut les RDV dont le début est dans les 6 dernières heures (en cours / juste fini)
        // pour que la praticienne puisse cliquer « Terminer la séance » dessus
        startsAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        payment: true,
      },
      orderBy: { startsAt: 'asc' },
      take: 20,
    }),
    prisma.holisticPayment.aggregate({
      where: {
        appointment: { practitionerId },
        status: 'PAID',
        paidAt: { gte: monthStart },
      },
      _sum: { amountPractitioner: true },
    }),
    prisma.holisticAppointment.count({
      where: { practitionerId, status: 'COMPLETED' },
    }),
    prisma.pendingPractitionerChange.count({
      where: { practitionerId, status: 'PENDING' },
    }),
    prisma.offering.findMany({
      where: { practitionerId, isActive: true },
      select: { id: true, name: true, durationMinutes: true, price: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const monthEarnings = monthRevenue._sum.amountPractitioner ?? 0;

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
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
            ᚷ
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: 'clamp(1.4rem, 4vw, 2.3rem)',
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
            }}
          >
            {practitioner.user.firstName} {practitioner.user.lastName}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontStyle: 'italic',
              color: 'rgba(232, 220, 190, 0.45)',
              fontSize: '1.05rem',
            }}
          >
            Espace praticien · Soins Holistiques
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        {/* Navigation espace praticien */}
        <nav
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '24px 0 12px',
          }}
        >
          {[
            { label: 'Tableau de bord', href: '/soins/dashboard/praticien' },
            { label: 'Mon profil', href: '/soins/dashboard/praticien/profil' },
            { label: 'Mes disponibilités', href: '/soins/dashboard/praticien/disponibilites' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.78rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--turquoise-cristal)',
                textDecoration: 'none',
                padding: '8px 16px',
                border: '1px solid rgba(46, 196, 182, 0.3)',
                borderRadius: '4px',
                background: 'rgba(46, 196, 182, 0.05)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bandeau Stripe Connect (toujours affiché — soit ✓ vert, soit CTA configuration) */}
        <StripeConnectBanner
          stripeAccountReady={practitioner.stripeAccountReady}
          hasStripeAccount={!!practitioner.stripeAccountId}
        />

        {/* Bandeau Google Agenda (connexion OAuth par praticienne) */}
        <GoogleCalendarBanner
          connected={!!practitioner.googleCalendarConnectedAt}
          googleEmail={practitioner.googleCalendarEmail}
        />

        {/* Bandeau modifications en attente */}
        {pendingChangesCount > 0 && (
          <div
            style={{
              marginTop: '16px',
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '8px',
              padding: '14px 18px',
              fontFamily: 'var(--font-cormorant)',
              color: 'var(--parchemin)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.8rem', letterSpacing: '0.08em' }}>
              ⏳ {pendingChangesCount} demande{pendingChangesCount > 1 ? 's' : ''} en attente d&apos;approbation
            </span>
          </div>
        )}

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
            {
              label: 'Revenus ce mois',
              value: `${monthEarnings.toFixed(0)} $`,
              symbol: 'ᛟ',
            },
            {
              label: 'Consultations complétées',
              value: totalCompleted,
              symbol: 'ᚠ',
            },
            {
              label: 'Rdv à venir',
              value: upcomingAppointments.length,
              symbol: 'ᛏ',
            },
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
                  fontSize: '1.9rem',
                  color: 'var(--or-ancien)',
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.66rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'rgba(232, 220, 190, 0.38)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming appointments */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}>
            <h2 style={{ ...sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>Rendez-vous à venir</h2>
            <ManualAppointmentButton
              practitioners={[{ id: practitionerId, name: `${practitioner.user.firstName} ${practitioner.user.lastName}`, offerings: myOfferings }]}
              lockedPractitionerId={practitionerId}
            />
          </div>

          {upcomingAppointments.length === 0 ? (
            <div
              style={{
                background: 'var(--charbon-mystere)',
                border: '1px solid rgba(74, 45, 122, 0.25)',
                borderRadius: '4px',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  color: 'rgba(232, 220, 190, 0.4)',
                  fontSize: '1.05rem',
                }}
              >
                Aucun rendez-vous à venir pour le moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {upcomingAppointments.map((appt) => {
                const client = appt.client;
                const clientDisplay = client
                  ? `${client.firstName} ${client.lastName[0]}.`
                  : 'Client';

                return (
                  <div
                    key={appt.id}
                    style={{
                      background: 'var(--charbon-mystere)',
                      border: '1px solid rgba(74, 45, 122, 0.35)',
                      borderRadius: '4px',
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-cinzel)',
                          fontSize: '0.9rem',
                          color: 'var(--parchemin)',
                          marginBottom: '4px',
                        }}
                      >
                        {clientDisplay}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-cormorant)',
                          fontSize: '0.95rem',
                          color: 'rgba(232, 220, 190, 0.5)',
                          marginBottom: '8px',
                        }}
                      >
                        {formatDateTime(new Date(appt.startsAt))}
                      </p>
                      <StatusBadge status={appt.status} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Bouton « Rejoindre la séance vidéo » — si le RDV est virtuel et bientôt/maintenant */}
                      {appt.status === 'CONFIRMED' && appt.notes?.toLowerCase().includes('virtuel') && (
                        <Link
                          href={`/soins/consultation/${appt.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '9px 20px',
                            fontFamily: 'var(--font-cinzel)',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            background: 'rgba(46, 196, 182, 0.15)',
                            color: 'var(--turquoise-cristal)',
                            border: '1px solid rgba(46, 196, 182, 0.4)',
                            borderRadius: '2px',
                            textDecoration: 'none',
                          }}
                        >
                          ᛜ Rejoindre la vidéo
                        </Link>
                      )}
                      {/* Bouton « Déplacer » : reprogrammer le RDV (praticienne propriétaire) */}
                      {appt.status === 'CONFIRMED' && (
                        <RescheduleButton
                          appointmentId={appt.id}
                          currentStartsAt={new Date(appt.startsAt).toISOString()}
                        />
                      )}
                      {/* Bouton « Terminer la séance » : disponible pour tous les RDV CONFIRMÉS
                          (la praticienne décide quand l'utiliser — typiquement à la fin de la séance) */}
                      {appt.status === 'CONFIRMED' && (
                        <CompleteAppointmentButton
                          appointmentId={appt.id}
                          clientName={clientDisplay}
                          remainingAmount={appt.remainingAmount ?? 0}
                          depositAmount={appt.depositAmount ?? 0}
                          totalAmount={appt.totalAmount ?? 0}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Profile actions */}
        <section>
          <h2 style={sectionTitle}>Mon profil</h2>
          <div
            style={{
              background: 'var(--charbon-mystere)',
              border: '1px solid rgba(74, 45, 122, 0.3)',
              borderRadius: '4px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.88rem',
                  color: 'var(--parchemin)',
                  marginBottom: '4px',
                }}
              >
                {practitioner.user.firstName} {practitioner.user.lastName}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.95rem',
                  color: 'rgba(232, 220, 190, 0.45)',
                }}
              >
                Gérez vos disponibilités et informations professionnelles
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/soins/dashboard/praticien/disponibilites"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  background: 'transparent',
                  color: 'var(--turquoise-cristal)',
                  border: '1px solid rgba(46, 196, 182, 0.35)',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                Disponibilités →
              </Link>
              <Link
                href="/soins/dashboard/praticien/profil"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  background: 'rgba(201, 168, 76, 0.1)',
                  color: 'var(--or-ancien)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                Modifier le profil →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
