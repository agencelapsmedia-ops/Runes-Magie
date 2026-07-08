'use client';

import { useState, useTransition } from 'react';
import { approveChange, rejectChange } from './actions';

interface ChangeData {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  requestedAt: string;
  reviewedAt: string | null;
  adminNote: string | null;
}

interface CurrentData {
  firstName: string;
  lastName: string;
  bio: string;
  specialties: string[];
  yearsExperience: number;
  hourlyRate: number;
  photoUrl: string | null;
  availabilities: { day: string; date?: string | null; startTime: string; endTime: string }[];
}

interface Props {
  change: ChangeData;
  practitionerName: string;
  practitionerEmail: string;
  current: CurrentData | null;
  dayNames: string[];
}

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Prénom',
  lastName: 'Nom',
  bio: 'Biographie',
  specialties: 'Spécialités',
  yearsExperience: 'Années d\'expérience',
  hourlyRate: 'Tarif horaire (calcul interne)',
  photoUrl: 'Photo',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(vide)';
  if (Array.isArray(value)) return value.join(', ') || '(aucune)';
  if (typeof value === 'number') return value.toString();
  return String(value);
}

// "YYYY-MM-DD" => "ven. 13 juin". On ancre à midi local pour éviter tout décalage de jour.
function formatPunctualDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

type AvailItem = { dayLabel: string; date?: string | null; startTime: string; endTime: string };

// Rend une liste de disponibilités en séparant la semaine type (récurrent) des
// dates ponctuelles (avec date précise). Utilisé pour les colonnes Avant et Après.
function renderAvailabilityList(items: AvailItem[], textColor: string) {
  if (!items.length) return <em>Aucun créneau</em>;
  const recurring = items.filter((i) => !i.date);
  const punctual = items.filter((i) => i.date);
  const subLabel = {
    fontFamily: 'var(--font-cinzel, serif)',
    fontSize: '0.62rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 4px',
    opacity: 0.85,
    color: textColor,
  };
  return (
    <div style={{ display: 'grid', gap: punctual.length && recurring.length ? '10px' : 0 }}>
      {recurring.length > 0 && (
        <div>
          {punctual.length > 0 && <p style={subLabel}>Semaine type</p>}
          <ul style={{ margin: 0, paddingLeft: '18px', color: textColor }}>
            {recurring.map((a, i) => (
              <li key={i}>{a.dayLabel} {a.startTime}–{a.endTime}</li>
            ))}
          </ul>
        </div>
      )}
      {punctual.length > 0 && (
        <div>
          <p style={subLabel}>📅 Dates ponctuelles</p>
          <ul style={{ margin: 0, paddingLeft: '18px', color: textColor }}>
            {punctual.map((a, i) => (
              <li key={i}>{formatPunctualDate(a.date as string)} · {a.startTime}–{a.endTime}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChangeCard({
  change,
  practitionerName,
  practitionerEmail,
  current,
  dayNames,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isPending = change.status === 'PENDING';
  const typeLabel = change.type === 'PROFILE' ? 'Profil' : 'Disponibilités';
  const requestedDate = new Date(change.requestedAt).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function handleApprove() {
    setError(null);
    if (!confirm(`Approuver cette modification de ${practitionerName} ? Les changements seront appliqués immédiatement.`)) return;
    startTransition(async () => {
      try {
        await approveChange(change.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur.');
      }
    });
  }

  function handleReject() {
    setError(null);
    if (!rejectNote.trim()) {
      setError('Indique une raison de rejet (sera visible par le praticien).');
      return;
    }
    startTransition(async () => {
      try {
        await rejectChange(change.id, rejectNote.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur.');
      }
    });
  }

  return (
    <article
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '24px',
        border: isPending ? '1px solid #FCD34D' : '1px solid #E5E7EB',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '1.05rem', color: '#1F2937', margin: '0 0 4px' }}>
            {practitionerName}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: 0 }}>
            {practitionerEmail} — Demande de modification {typeLabel.toLowerCase()}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '4px 0 0' }}>
            Soumis le {requestedDate}
          </p>
        </div>
        <span
          style={{
            padding: '4px 12px',
            background:
              change.status === 'PENDING' ? '#FEF3C7'
              : change.status === 'APPROVED' ? '#D1FAE5'
              : '#FEE2E2',
            color:
              change.status === 'PENDING' ? '#92400E'
              : change.status === 'APPROVED' ? '#065F46'
              : '#991B1B',
            border: '1px solid',
            borderColor:
              change.status === 'PENDING' ? '#FCD34D'
              : change.status === 'APPROVED' ? '#6EE7B7'
              : '#FCA5A5',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            fontFamily: 'var(--font-cinzel, serif)',
          }}
        >
          {change.status === 'PENDING' ? 'En attente' : change.status === 'APPROVED' ? 'Approuvée' : 'Rejetée'}
        </span>
      </div>

      {/* Diff Avant / Après */}
      <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        {change.type === 'PROFILE' ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {Object.entries(change.payload).map(([field, newValue]) => {
              const oldValue = current ? (current as unknown as Record<string, unknown>)[field] : undefined;
              const label = FIELD_LABELS[field] ?? field;
              return (
                <div key={field} style={{ display: 'grid', gap: '6px' }}>
                  <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.7rem', color: '#6B3FA0', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    {label}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#FEE2E2', padding: '8px 12px', borderRadius: '4px', fontSize: '0.85rem', color: '#7F1D1D', whiteSpace: 'pre-line' }}>
                      <strong style={{ fontSize: '0.65rem', display: 'block', marginBottom: '2px' }}>AVANT</strong>
                      {field === 'photoUrl' && oldValue ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={oldValue as string} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        formatValue(oldValue)
                      )}
                    </div>
                    <div style={{ background: '#D1FAE5', padding: '8px 12px', borderRadius: '4px', fontSize: '0.85rem', color: '#064E3B', whiteSpace: 'pre-line' }}>
                      <strong style={{ fontSize: '0.65rem', display: 'block', marginBottom: '2px' }}>APRÈS</strong>
                      {field === 'photoUrl' && newValue ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={newValue as string} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        formatValue(newValue)
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // AVAILABILITY
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.7rem', color: '#7F1D1D', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                Avant
              </p>
              <div style={{ background: '#FEE2E2', padding: '12px', borderRadius: '4px', fontSize: '0.85rem' }}>
                {renderAvailabilityList(
                  (current?.availabilities ?? []).map((a) => ({
                    dayLabel: a.day,
                    date: a.date ?? null,
                    startTime: a.startTime,
                    endTime: a.endTime,
                  })),
                  '#7F1D1D',
                )}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.7rem', color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                Après
              </p>
              <div style={{ background: '#D1FAE5', padding: '12px', borderRadius: '4px', fontSize: '0.85rem' }}>
                {(() => {
                  const blocks = (change.payload.blocks ?? []) as Array<{ dayOfWeek: number; date?: string | null; startTime: string; endTime: string }>;
                  return renderAvailabilityList(
                    blocks.map((b) => ({
                      dayLabel: dayNames[b.dayOfWeek],
                      date: b.date ?? null,
                      startTime: b.startTime,
                      endTime: b.endTime,
                    })),
                    '#064E3B',
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Note admin (si rejet/approbation) */}
      {!isPending && change.adminNote && (
        <div style={{ background: '#EDE9FE', border: '1px solid #C4B5FD', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.7rem', color: '#6B3FA0', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
            Note admin
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1F2937', whiteSpace: 'pre-line' }}>{change.adminNote}</p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', color: '#991B1B', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <>
          {rejectMode ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-cinzel, serif)', fontSize: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Raison du rejet (obligatoire, visible par le praticien)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontFamily: 'inherit',
                }}
                placeholder="Ex : Le tarif demandé est inférieur à la commission minimum, merci de revoir à la hausse."
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setRejectMode(false); setError(null); }}
                  disabled={pending}
                  style={{
                    padding: '8px 16px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-cinzel, serif)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={pending}
                  style={{
                    padding: '8px 16px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-cinzel, serif)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {pending ? 'Envoi…' : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRejectMode(true)}
                disabled={pending}
                style={{
                  padding: '8px 18px',
                  background: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-cinzel, serif)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Rejeter
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={pending}
                style={{
                  padding: '8px 18px',
                  background: '#D1FAE5',
                  color: '#065F46',
                  border: '1px solid #6EE7B7',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-cinzel, serif)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {pending ? 'Application…' : 'Approuver'}
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
