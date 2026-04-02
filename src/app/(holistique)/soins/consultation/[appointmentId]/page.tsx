'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface ConsultationData {
  dailyRoomUrl: string | null;
  practitionerName: string;
  clientName: string;
  startsAt: string;
  myRole: 'client' | 'practitioner';
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<ConsultationData | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/holistique/video/${appointmentId}`);

        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/soins/auth/login');
            return;
          }
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Impossible de charger la consultation.');
        }

        const consultData: ConsultationData = await res.json();
        setData(consultData);

        if (consultData.dailyRoomUrl) {
          setRoomUrl(consultData.dailyRoomUrl);
        } else {
          const createRes = await fetch(`/api/holistique/video/${appointmentId}`, {
            method: 'POST',
          });

          if (!createRes.ok) {
            const body = await createRes.json().catch(() => ({}));
            throw new Error(body.error ?? 'Impossible de créer la salle de consultation.');
          }

          const created: ConsultationData = await createRes.json();
          setRoomUrl(created.dailyRoomUrl);
          setData(created);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [appointmentId, router]);

  function handleQuit() {
    setEnding(true);
    const role = data?.myRole ?? 'client';
    const destination =
      role === 'practitioner'
        ? '/soins/dashboard/praticien'
        : '/soins/dashboard/client';
    router.push(destination);
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: '3.5rem',
            color: 'rgba(46, 196, 182, 0.4)',
            animation: 'runeRotate 3s linear infinite',
          }}
          aria-hidden="true"
        >
          ᚹ
        </div>
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            color: 'rgba(232, 220, 190, 0.45)',
            fontSize: '1.15rem',
          }}
        >
          Préparation de votre espace de consultation...
        </p>
        <style>{`
          @keyframes runeRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // --- Error state ---
  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cinzel-decorative)',
            fontSize: '3rem',
            color: 'rgba(196, 29, 110, 0.5)',
          }}
          aria-hidden="true"
        >
          ᚾ
        </div>
        <div
          style={{
            background: 'rgba(196, 29, 110, 0.08)',
            border: '1px solid rgba(196, 29, 110, 0.3)',
            borderRadius: '4px',
            padding: '20px 28px',
            maxWidth: '480px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#f87171',
              marginBottom: '8px',
            }}
          >
            Erreur de connexion
          </p>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1rem',
              color: 'rgba(248, 113, 113, 0.8)',
              lineHeight: 1.7,
            }}
          >
            {error ?? 'Consultation introuvable.'}
          </p>
        </div>
        <Button href="/soins/dashboard/client" variant="secondary" size="sm">
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  const otherParticipant =
    data.myRole === 'client' ? data.practitionerName : data.clientName;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Minimal header */}
      <div
        style={{
          background: 'rgba(10, 10, 18, 0.95)',
          borderBottom: '1px solid rgba(201, 168, 76, 0.15)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--turquoise-cristal)',
                animation: 'pulse 1.5s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--turquoise-cristal)',
              }}
            >
              Consultation en cours
            </span>
          </div>

          <div
            style={{
              width: '1px',
              height: '16px',
              background: 'rgba(201, 168, 76, 0.2)',
            }}
          />

          {/* Participant */}
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1rem',
              color: 'var(--or-ancien)',
              fontStyle: 'italic',
            }}
          >
            {data.myRole === 'client' ? 'Praticien' : 'Client'} : {otherParticipant}
          </span>

          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '0.88rem',
              color: 'rgba(232, 220, 190, 0.35)',
              fontStyle: 'italic',
            }}
          >
            {formatDateTime(data.startsAt)}
          </span>
        </div>

        {/* Quit button */}
        <button
          type="button"
          onClick={handleQuit}
          disabled={ending}
          style={{
            padding: '9px 20px',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            background: 'rgba(196, 29, 110, 0.12)',
            border: '1px solid rgba(196, 29, 110, 0.35)',
            borderRadius: '2px',
            color: '#f87171',
            cursor: ending ? 'not-allowed' : 'pointer',
            opacity: ending ? 0.6 : 1,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {ending ? 'Fermeture...' : 'Quitter'}
        </button>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {roomUrl ? (
          <iframe
            src={roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{
              width: '100%',
              height: 'calc(100vh - 120px)',
              border: 'none',
              display: 'block',
            }}
            title={`Consultation vidéo avec ${otherParticipant}`}
          />
        ) : (
          <div
            style={{
              height: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              background: 'rgba(10, 10, 18, 0.9)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-cinzel-decorative)',
                fontSize: '3rem',
                color: 'rgba(46, 196, 182, 0.3)',
                animation: 'runeRotate 3s linear infinite',
              }}
              aria-hidden="true"
            >
              ᚹ
            </div>
            <p
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontStyle: 'italic',
                color: 'rgba(232, 220, 190, 0.4)',
                fontSize: '1.1rem',
              }}
            >
              La salle de consultation se prépare...
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          background: 'rgba(10, 10, 18, 0.95)',
          borderTop: '1px solid rgba(201, 168, 76, 0.1)',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
          height: '48px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontStyle: 'italic',
            fontSize: '0.82rem',
            color: 'rgba(232, 220, 190, 0.25)',
            textAlign: 'center',
          }}
        >
          Connexion sécurisée · Technologie Daily.co · Runes &amp; Magie Soins Holistiques
        </p>
      </div>

      <style>{`
        @keyframes runeRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
