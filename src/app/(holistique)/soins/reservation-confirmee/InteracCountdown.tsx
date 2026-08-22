'use client';

/**
 * Bloc Interac de la page de confirmation : compte à rebours de 30 minutes
 * (le créneau est libéré si le virement n'est pas reçu à temps) + les
 * instructions de virement affichées directement (en plus du courriel).
 */
import { useEffect, useState } from 'react';

export default function InteracCountdown({
  deadline,
  montant,
  destinataire,
  reponse,
}: {
  deadline: string; // ISO — création du RDV + 30 min
  montant: number | null;
  destinataire: string;
  reponse: string;
}) {
  const [restant, setRestant] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRestant(Math.max(0, new Date(deadline).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const minutes = restant != null ? Math.floor(restant / 60000) : null;
  const secondes = restant != null ? Math.floor((restant % 60000) / 1000) : null;
  const expire = restant === 0;
  const urgent = restant != null && restant < 5 * 60000;

  const ligne: React.CSSProperties = {
    fontFamily: 'var(--font-cormorant)',
    color: 'rgba(232, 220, 190, 0.85)',
    fontSize: '1.05rem',
    margin: '4px 0',
  };

  return (
    <div
      style={{
        background: 'rgba(201, 168, 76, 0.1)',
        border: `1px solid ${urgent ? 'rgba(196, 29, 110, 0.6)' : 'rgba(201, 168, 76, 0.45)'}`,
        borderRadius: '6px',
        padding: '20px 18px',
        marginBottom: '24px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.95rem', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        🏦 Ta place est réservée !
      </p>

      {expire ? (
        <p style={{ fontFamily: 'var(--font-cormorant)', color: '#f87171', fontSize: '1.1rem', margin: '0 0 12px', lineHeight: 1.5 }}>
          ⏰ Le délai de 30 minutes est écoulé. Si ton virement n’a pas été envoyé,
          ta réservation sera annulée et le créneau remis en disponibilité.
        </p>
      ) : (
        <>
          <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', fontSize: '1.15rem', margin: '0 0 8px', lineHeight: 1.5 }}>
            Tu as <strong style={{ color: 'var(--or-ancien)' }}>30 minutes</strong> pour faire ton virement Interac,
            sinon le créneau sera remis en disponibilité.
          </p>
          <p
            aria-live="polite"
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '2.4rem',
              color: urgent ? '#f87171' : 'var(--turquoise-cristal)',
              margin: '6px 0 14px',
              letterSpacing: '0.1em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {minutes != null && secondes != null
              ? `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`
              : '30:00'}
          </p>
        </>
      )}

      <div
        style={{
          background: 'rgba(10, 10, 18, 0.5)',
          border: '1px solid rgba(74, 45, 122, 0.4)',
          borderRadius: '6px',
          padding: '14px 16px',
          textAlign: 'left',
        }}
      >
        <p style={{ ...ligne, color: 'var(--or-ancien)', fontFamily: 'var(--font-cinzel)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
          Instructions du virement
        </p>
        <p style={ligne}><strong>Destinataire :</strong> {destinataire}</p>
        {montant != null && montant > 0 && (
          <p style={ligne}><strong>Montant :</strong> {montant.toFixed(2)} $</p>
        )}
        <p style={ligne}><strong>Réponse secrète :</strong> {reponse}</p>
        <p style={{ ...ligne, color: 'rgba(232,220,190,0.55)', fontSize: '0.92rem' }}>
          Inscris ton nom dans la description du virement. Les mêmes instructions t’ont aussi été envoyées par courriel.
        </p>
      </div>
    </div>
  );
}
