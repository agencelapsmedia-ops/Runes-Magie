'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  appointmentId: string;
  clientName: string;
  remainingAmount: number; // ce qu'il reste à charger (0 si paiement déjà complet)
  depositAmount: number; // montant déjà perçu
  totalAmount: number; // total de la séance
}

type Outcome = 'CHARGED' | 'GIFTED' | 'NO_SHOW';

export default function CompleteAppointmentButton({
  appointmentId,
  clientName,
  remainingAmount,
  depositAmount,
  totalAmount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(outcome: Outcome) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/holistique/appointments/${appointmentId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Erreur.');
          return;
        }
        const data = await res.json();
        const msg =
          outcome === 'CHARGED'
            ? data.charged > 0
              ? `✓ Solde de ${data.charged.toFixed(2)} $ facturé. Séance terminée.`
              : '✓ Séance terminée.'
            : outcome === 'GIFTED'
              ? '✓ Séance marquée comme offerte.'
              : '✓ No-show enregistré. L\'acompte est conservé.';
        setSuccess(msg);
        setTimeout(() => {
          setOpen(false);
          router.refresh();
        }, 1500);
      } catch {
        setError('Impossible de joindre le serveur.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null); setSuccess(null); }}
        style={{
          padding: '9px 20px',
          fontFamily: 'var(--font-cinzel)',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          background: 'rgba(46, 196, 182, 0.12)',
          color: 'var(--turquoise-cristal)',
          border: '1px solid rgba(46, 196, 182, 0.4)',
          borderRadius: '2px',
          cursor: 'pointer',
        }}
      >
        Terminer la séance
      </button>

      {open && (
        <div
          onClick={() => !pending && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 10, 18, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(26, 26, 46, 0.98)',
              border: '1px solid rgba(74, 45, 122, 0.5)',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-cinzel-decorative)', color: 'var(--or-clair)', fontSize: '1.3rem', margin: '0 0 8px' }}>
              Terminer la séance — {clientName}
            </h2>
            <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.7, fontSize: '0.95rem', marginBottom: '20px' }}>
              Total de la séance : <strong>{totalAmount.toFixed(2)} $</strong>{' '}
              · Acompte déjà reçu : <strong>{depositAmount.toFixed(2)} $</strong>{' '}
              · Solde dû : <strong>{remainingAmount.toFixed(2)} $</strong>
            </p>

            {success ? (
              <div style={{ background: 'rgba(46, 196, 182, 0.12)', border: '1px solid rgba(46, 196, 182, 0.4)', borderRadius: '6px', padding: '14px 18px', color: 'var(--turquoise-cristal)', fontFamily: 'var(--font-cormorant)' }}>
                {success}
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: 'rgba(196, 29, 110, 0.1)', border: '1px solid rgba(196, 29, 110, 0.4)', borderRadius: '6px', padding: '10px 14px', color: '#f87171', marginBottom: '16px', fontSize: '0.9rem', fontFamily: 'var(--font-cormorant)' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gap: '10px' }}>
                  {/* Option 1 : facturer le solde */}
                  <button
                    type="button"
                    onClick={() => submit('CHARGED')}
                    disabled={pending}
                    style={{
                      padding: '14px 18px',
                      textAlign: 'left',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '6px',
                      cursor: pending ? 'wait' : 'pointer',
                      color: 'var(--parchemin)',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-cinzel)', color: '#4ade80', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.05em' }}>
                      ✓ Client venu — Charger le solde {remainingAmount > 0 ? `(${remainingAmount.toFixed(2)} $)` : ''}
                    </p>
                    <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.65, fontSize: '0.85rem', margin: 0 }}>
                      Cas normal. La carte sauvegardée du client est prélevée du montant restant.
                    </p>
                  </button>

                  {/* Option 2 : offerte */}
                  <button
                    type="button"
                    onClick={() => submit('GIFTED')}
                    disabled={pending}
                    style={{
                      padding: '14px 18px',
                      textAlign: 'left',
                      background: 'rgba(201, 168, 76, 0.08)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      borderRadius: '6px',
                      cursor: pending ? 'wait' : 'pointer',
                      color: 'var(--parchemin)',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.05em' }}>
                      ⚠ Client venu — Séance offerte
                    </p>
                    <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.65, fontSize: '0.85rem', margin: 0 }}>
                      Aucun prélèvement supplémentaire. L&apos;acompte de {depositAmount.toFixed(2)} $ déjà reçu reste acquis.
                    </p>
                  </button>

                  {/* Option 3 : no-show */}
                  <button
                    type="button"
                    onClick={() => submit('NO_SHOW')}
                    disabled={pending}
                    style={{
                      padding: '14px 18px',
                      textAlign: 'left',
                      background: 'rgba(196, 29, 110, 0.08)',
                      border: '1px solid rgba(196, 29, 110, 0.4)',
                      borderRadius: '6px',
                      cursor: pending ? 'wait' : 'pointer',
                      color: 'var(--parchemin)',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-cinzel)', color: '#f87171', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 4px', letterSpacing: '0.05em' }}>
                      ✗ Client absent (no-show)
                    </p>
                    <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin)', opacity: 0.65, fontSize: '0.85rem', margin: 0 }}>
                      L&apos;acompte de {depositAmount.toFixed(2)} $ est conservé comme pénalité. Le solde n&apos;est pas facturé.
                    </p>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  style={{
                    marginTop: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--parchemin)',
                    opacity: 0.5,
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
