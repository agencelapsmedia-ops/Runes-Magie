'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Practitioner {
  id: string;
  bio: string;
  specialties: string[];
  yearsExperience: number;
  hourlyRate: number;
  photoUrl: string | null;
  availabilities: Availability[];
  user: { firstName: string; lastName: string; email?: string };
}

interface Offering {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  durationMinutes: number;
  price: number;
  priceForTwo: number | null;
  modes: string[];
  emoji: string;
}

interface SessionUser {
  name: string;
  email: string;
}

const DAY_NAMES_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Durée d'une séance par défaut si aucune Offering n'est sélectionnée
const DEFAULT_SESSION_DURATION_MINUTES = 90;

function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  for (let m = startMins; m + durationMinutes <= endMins; m += durationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function ReservationPage({
  params,
}: {
  params: Promise<{ practitionerId: string }>;
}) {
  const { practitionerId } = use(params);
  const searchParams = useSearchParams();
  const offeringSlug = searchParams.get('offering');

  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('IN_PERSON');
  const [loadingPractitioner, setLoadingPractitioner] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Durée d'une séance (vient de l'Offering si choisi, sinon par défaut)
  const sessionDuration = offering?.durationMinutes ?? DEFAULT_SESSION_DURATION_MINUTES;

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ bookingRef: string } | null>(null);

  // Charge l'Offering si ?offering=slug est dans l'URL
  useEffect(() => {
    if (!offeringSlug) return;
    async function loadOffering() {
      try {
        const res = await fetch(`/api/holistique/offerings/by-slug/${offeringSlug}`);
        if (!res.ok) return; // silencieux : on retombe sur le comportement par défaut
        const data = await res.json();
        setOffering(data);
        // Pré-sélectionne le premier mode disponible
        if (data.modes?.length > 0) {
          setSelectedMode(data.modes[0]);
        }
      } catch {
        // ignore
      }
    }
    loadOffering();
  }, [offeringSlug]);

  useEffect(() => {
    async function loadPractitioner() {
      try {
        const res = await fetch(`/api/holistique/practitioners/by-id/${practitionerId}`);
        if (!res.ok) throw new Error('Praticien introuvable.');
        const data = await res.json();
        setPractitioner(data);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Erreur de chargement.');
      } finally {
        setLoadingPractitioner(false);
      }
    }
    loadPractitioner();
  }, [practitionerId]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/holistique/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSessionUser(data.user ?? null);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  function getWeekDays(): Date[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + weekOffset * 7 + i);
      days.push(d);
    }
    return days;
  }

  function handleDaySelect(day: Date) {
    setSelectedDate(day);
    setSelectedSlot(null);
    if (!practitioner) return;
    const dow = day.getDay();
    // Plusieurs blocs de dispo par jour possibles (ex. matin + après-midi avec pause dîner)
    const availBlocks = practitioner.availabilities.filter((a) => a.dayOfWeek === dow && a.isActive);
    const allSlots = availBlocks.flatMap((a) => generateTimeSlots(a.startTime, a.endTime, sessionDuration));
    // Trier par heure pour un affichage propre
    allSlots.sort();
    setAvailableSlots(allSlots);
  }

  async function handleConfirmAndPay() {
    if (!selectedDate || !selectedSlot || !practitioner) return;

    // Vérif d'abord : doit être connecté en tant que client
    if (isAuthenticated === false) {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/soins/auth/login?next=${encodeURIComponent(currentUrl)}`;
      return;
    }

    setBookingError(null);
    setBooking(true);

    const [h, m] = selectedSlot.split(':').map(Number);
    const startsAt = new Date(selectedDate);
    startsAt.setHours(h, m, 0, 0);
    const endsAt = new Date(startsAt.getTime() + sessionDuration * 60 * 1000);

    try {
      const res = await fetch('/api/holistique/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practitionerId: practitioner.id,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          notes: notes.trim() || undefined,
          offeringId: offering?.id ?? undefined,
          mode: selectedMode,
        }),
      });

      // 401 = pas connecté → redirige vers login en gardant la résa en mémoire
      if (res.status === 401) {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/soins/auth/login?next=${encodeURIComponent(currentUrl)}`;
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Surface l'erreur complète pour debug
        const debugInfo = data.stripeCode || data.prismaCode
          ? ` [${data.stripeType ?? ''}${data.stripeCode ? ` / ${data.stripeCode}` : ''}${data.prismaCode ? ` / Prisma:${data.prismaCode}` : ''}]`
          : '';
        setBookingError(`${data.error ?? 'Erreur lors de la réservation.'}${debugInfo}`);
        return;
      }

      const data = await res.json();

      if (data.url) {
        // Stripe redirect
        window.location.href = data.url;
      } else if (data.success) {
        // Direct confirmation
        setConfirmed({ bookingRef: data.bookingRef ?? data.appointmentId ?? 'CONF-' + Date.now() });
      } else {
        setBookingError('Réponse inattendue du serveur. Veuillez réessayer.');
      }
    } catch {
      setBookingError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setBooking(false);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = practitioner ? getWeekDays() : [];

  // --- Loading state ---
  if (loadingPractitioner) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--noir-nuit)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: '3rem',
            color: 'rgba(46, 196, 182, 0.4)',
            animation: 'runeRotate 4s linear infinite',
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
          }}
        >
          Chargement des disponibilités...
        </p>
        <style>{`
          @keyframes runeRotate {
            0% { transform: rotate(0deg); opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { transform: rotate(360deg); opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  // --- Error state ---
  if (fetchError || !practitioner) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--noir-nuit)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cinzel)',
            color: '#f87171',
            fontSize: '1rem',
          }}
        >
          {fetchError ?? 'Praticien introuvable.'}
        </p>
        <Button href="/soins/praticiens" variant="secondary" size="sm">
          Voir tous les praticiens
        </Button>
      </div>
    );
  }

  // --- Confirmation page ---
  if (confirmed) {
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
        <div style={{ maxWidth: '540px', width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: '4rem',
              color: 'rgba(46, 196, 182, 0.5)',
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
              border: '1px solid rgba(46, 196, 182, 0.35)',
              borderRadius: '4px',
              padding: '40px 32px',
              boxShadow: '0 0 60px rgba(46, 196, 182, 0.06)',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-cinzel-decorative)',
                fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                background: 'linear-gradient(135deg, var(--turquoise-cristal), var(--or-clair))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '16px',
              }}
            >
              Réservation confirmée
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.1rem',
                color: 'rgba(232, 220, 190, 0.55)',
                marginBottom: '8px',
              }}
            >
              Numéro de réservation
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '1.1rem',
                color: 'var(--or-ancien)',
                letterSpacing: '0.1em',
                marginBottom: '28px',
                padding: '12px 20px',
                background: 'rgba(201, 168, 76, 0.08)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '2px',
                display: 'inline-block',
              }}
            >
              {confirmed.bookingRef}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                fontSize: '1.05rem',
                color: 'rgba(232, 220, 190, 0.5)',
                lineHeight: 1.8,
                marginBottom: '32px',
              }}
            >
              Un courriel de confirmation vous a été envoyé.
              Vous pouvez gérer vos rendez-vous depuis votre tableau de bord.
            </p>
            <Button href="/soins/dashboard/client" variant="mystique">
              Aller au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--charbon-mystere)',
    border: '1px solid rgba(74, 45, 122, 0.4)',
    borderRadius: '4px',
    padding: '28px',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir-nuit)', paddingBottom: '80px' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 70%)',
          padding: '60px 24px 50px',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              color: 'rgba(232, 220, 190, 0.4)',
              marginBottom: '12px',
            }}
          >
            ᚠ Réserver une consultation
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: 'clamp(1.4rem, 4vw, 2.4rem)',
              background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
            }}
          >
            {practitioner.user.firstName} {practitioner.user.lastName}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {practitioner.specialties.map((s) => (
              <span
                key={s}
                style={{
                  background: 'rgba(46,196,182,0.12)',
                  border: '1px solid rgba(46,196,182,0.35)',
                  color: 'var(--turquoise-cristal)',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-cinzel)',
                  letterSpacing: '0.05em',
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '1.1rem',
              color: 'var(--or-ancien)',
            }}
          >
            {offering
              ? `${offering.price.toFixed(2)} $ / ${offering.name} (${sessionDuration} min)`
              : `${(practitioner.hourlyRate * sessionDuration / 60).toFixed(2)} $ / séance (${sessionDuration} min)`}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 0', display: 'grid', gap: '24px' }}>

        {/* Bandeau de connexion / inscription si pas connecté */}
        {isAuthenticated === false && (
          <div
            style={{
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '8px',
              padding: '20px 24px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
              ᚨ Connecte-toi pour réserver
            </p>
            <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.8, fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '16px' }}>
              Tu dois avoir un compte client pour finaliser ta réservation. C&apos;est gratuit et ça prend 30 secondes — tu pourras ensuite suivre tes rendez-vous depuis ton tableau de bord.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href={`/soins/auth/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/soins')}`}
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
                  border: '1px solid var(--or-ancien)',
                  color: 'var(--or-ancien)',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                Se connecter
              </Link>
              <Link
                href={`/soins/auth/register?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/soins')}`}
                style={{
                  padding: '10px 22px',
                  background: 'transparent',
                  border: '1px solid var(--turquoise-cristal)',
                  color: 'var(--turquoise-cristal)',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                Créer un compte
              </Link>
            </div>
          </div>
        )}

        {/* Bannière du service choisi */}
        {offering && (
          <div
            style={{
              background: 'rgba(46, 196, 182, 0.06)',
              border: '1px solid rgba(46, 196, 182, 0.3)',
              borderRadius: '8px',
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontFamily: 'var(--font-cinzel-decorative)', fontSize: '2rem', color: 'var(--or-ancien)', lineHeight: 1 }}>
                {offering.emoji}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Service choisi
                </p>
                <h3 style={{ fontFamily: 'var(--font-cinzel-decorative)', color: 'var(--or-clair)', fontSize: '1.3rem', margin: '0 0 6px' }}>
                  {offering.name}
                </h3>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', opacity: 0.7, fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                  {offering.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sélecteur de mode (si plusieurs modes disponibles) */}
        {offering && offering.modes.length > 1 && (
          <div
            style={{
              background: 'rgba(26, 26, 46, 0.6)',
              border: '1px solid rgba(74, 45, 122, 0.4)',
              borderRadius: '8px',
              padding: '20px 24px',
            }}
          >
            <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Comment veux-tu vivre cette séance ?
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {offering.modes.map((m) => {
                const isSelected = selectedMode === m;
                const label = m === 'IN_PERSON' ? 'En présentiel' : 'En ligne (vidéo)';
                const sublabel = m === 'IN_PERSON' ? 'À la boutique Runes & Magie' : 'Via Daily.co — lien envoyé après paiement';
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMode(m)}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '14px 18px',
                      background: isSelected ? 'rgba(46, 196, 182, 0.12)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--turquoise-cristal)' : 'rgba(74, 45, 122, 0.5)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-cinzel)', color: isSelected ? 'var(--turquoise-cristal)' : 'var(--or-ancien)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 4px' }}>
                      {isSelected ? '✓ ' : ''}{label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', opacity: 0.6, fontSize: '0.85rem', margin: 0 }}>
                      {sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly calendar */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--or-ancien)',
              }}
            >
              Choisir une date
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { onClick: () => { setWeekOffset((w) => Math.max(0, w - 1)); setSelectedDate(null); setSelectedSlot(null); setAvailableSlots([]); }, label: '←', disabled: weekOffset === 0 },
                { onClick: () => { setWeekOffset((w) => w + 1); setSelectedDate(null); setSelectedSlot(null); setAvailableSlots([]); }, label: '→', disabled: false },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(201, 168, 76, 0.3)',
                    borderRadius: '2px',
                    color: btn.disabled ? 'rgba(201, 168, 76, 0.2)' : 'var(--or-ancien)',
                    width: '34px',
                    height: '34px',
                    cursor: btn.disabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {weekDays.map((day) => {
              const dow = day.getDay();
              const isPast = day < today;
              const hasAvail = practitioner.availabilities.some((a) => a.dayOfWeek === dow && a.isActive);
              const isSelected = selectedDate?.toDateString() === day.toDateString();

              let border = 'rgba(74, 45, 122, 0.3)';
              let bg = 'transparent';
              let textColor: string = 'rgba(232, 220, 190, 0.4)';
              let cursor = 'not-allowed';

              if (isSelected) {
                border = 'var(--or-ancien)';
                bg = 'rgba(201, 168, 76, 0.15)';
                textColor = 'var(--or-ancien)';
                cursor = 'pointer';
              } else if (!isPast && hasAvail) {
                border = 'rgba(46, 196, 182, 0.45)';
                bg = 'rgba(46, 196, 182, 0.07)';
                textColor = 'var(--parchemin)';
                cursor = 'pointer';
              }

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isPast || !hasAvail}
                  onClick={() => handleDaySelect(day)}
                  title={`${DAY_NAMES_FULL[dow]}${hasAvail && !isPast ? ' — disponible' : ''}`}
                  style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: '4px',
                    padding: '10px 4px',
                    cursor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    opacity: isPast ? 0.3 : 1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '0.6rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: textColor,
                    }}
                  >
                    {DAY_NAMES_SHORT[dow]}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: textColor,
                    }}
                  >
                    {day.getDate()}
                  </span>
                  {hasAvail && !isPast && (
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--or-ancien)' : 'var(--turquoise-cristal)',
                        boxShadow: isSelected ? '0 0 6px rgba(201, 168, 76, 0.6)' : '0 0 6px rgba(46, 196, 182, 0.6)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div style={cardStyle}>
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--or-ancien)',
                marginBottom: '16px',
              }}
            >
              Plages horaires — {formatDisplayDate(selectedDate)}
            </h2>

            {availableSlots.length === 0 ? (
              <p
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontStyle: 'italic',
                  color: 'rgba(232, 220, 190, 0.4)',
                  fontSize: '1rem',
                }}
              >
                Aucune plage disponible ce jour.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '2px',
                        border: `1px solid ${isSelected ? 'var(--or-ancien)' : 'rgba(74, 45, 122, 0.4)'}`,
                        background: isSelected
                          ? 'rgba(201, 168, 76, 0.15)'
                          : 'rgba(10, 10, 18, 0.5)',
                        color: isSelected ? 'var(--or-ancien)' : 'var(--parchemin)',
                        fontFamily: 'var(--font-cinzel)',
                        fontSize: '0.85rem',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 12px rgba(201, 168, 76, 0.25)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.5)';
                          e.currentTarget.style.boxShadow = '0 0 10px rgba(201, 168, 76, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(74, 45, 122, 0.4)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Booking form */}
        {selectedDate && selectedSlot && (
          <div
            style={{
              ...cardStyle,
              borderColor: 'rgba(201, 168, 76, 0.35)',
              boxShadow: '0 0 40px rgba(201, 168, 76, 0.05)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--or-ancien)',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
              }}
            >
              Récapitulatif
            </h2>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
              {[
                { label: 'Praticien', value: `${practitioner.user.firstName} ${practitioner.user.lastName}` },
                { label: 'Date', value: formatDisplayDate(selectedDate) },
                { label: 'Heure', value: `${selectedSlot} (${sessionDuration} min)` },
                ...(offering ? [{ label: 'Service', value: `${offering.emoji} ${offering.name}` }] : []),
                ...(offering && offering.modes.length > 1 ? [{ label: 'Mode', value: selectedMode === 'IN_PERSON' ? 'Présentiel' : 'Virtuel (vidéo)' }] : []),
                {
                  label: 'Tarif',
                  value: offering
                    ? `${offering.price.toFixed(2)} $`
                    : `${(practitioner.hourlyRate * sessionDuration / 60).toFixed(2)} $`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(74, 45, 122, 0.2)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-cinzel)',
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(232, 220, 190, 0.4)',
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '1rem',
                      color: 'var(--parchemin)',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="notes"
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(232, 220, 190, 0.55)',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                Notes pour le praticien (optionnel)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Décrivez brièvement votre intention pour cette séance..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '2px',
                  border: '1px solid rgba(74, 45, 122, 0.4)',
                  background: 'var(--charbon-mystere)',
                  color: 'var(--parchemin)',
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px',
                  lineHeight: 1.7,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(201, 168, 76, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74, 45, 122, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {bookingError && (
              <div
                style={{
                  background: 'rgba(196, 29, 110, 0.1)',
                  border: '1px solid rgba(196, 29, 110, 0.35)',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontFamily: 'var(--font-cormorant)',
                  color: '#f87171',
                  fontSize: '1rem',
                }}
                role="alert"
              >
                {bookingError}
              </div>
            )}

            {isAuthenticated === false ? (
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontStyle: 'italic',
                    color: 'rgba(232, 220, 190, 0.5)',
                    fontSize: '1.05rem',
                    marginBottom: '16px',
                  }}
                >
                  Connectez-vous pour finaliser votre réservation.
                </p>
                <Button
                  href={`/soins/auth/login?redirect=/soins/reserver/${practitionerId}`}
                  variant="primary"
                >
                  Se connecter pour réserver
                </Button>
              </div>
            ) : isAuthenticated === null ? (
              <div
                style={{
                  height: '52px',
                  background: 'rgba(74, 45, 122, 0.2)',
                  borderRadius: '2px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ) : (
              <button
                type="button"
                disabled={booking}
                onClick={handleConfirmAndPay}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  background: booking
                    ? 'rgba(201, 168, 76, 0.3)'
                    : 'linear-gradient(135deg, var(--or-ancien), #b8941f)',
                  color: 'var(--noir-nuit)',
                  border: '1px solid rgba(201, 168, 76, 0.5)',
                  borderRadius: '2px',
                  cursor: booking ? 'not-allowed' : 'pointer',
                  opacity: booking ? 0.7 : 1,
                  transition: 'all 0.3s',
                  boxShadow: booking ? 'none' : '0 4px 20px rgba(201, 168, 76, 0.15)',
                }}
              >
                {booking ? 'Traitement en cours...' : 'Confirmer et Payer'}
              </button>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
          <Link
            href={`/soins/praticiens`}
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(232, 220, 190, 0.25)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            ← Voir tous les praticiens
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
