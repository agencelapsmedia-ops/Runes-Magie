'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestAvailabilityChange } from '@/app/admin/praticiens/modifications/actions';

interface Block {
  dayOfWeek: number;
  date?: string | null; // "YYYY-MM-DD" => ponctuel à cette date ; null/absent => hebdo récurrent
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const timeInputStyle: React.CSSProperties = {
  background: 'rgba(26, 26, 46, 0.8)',
  border: '1px solid rgba(74, 45, 122, 0.5)',
  borderRadius: '4px',
  color: 'var(--parchemin)',
  padding: '6px 10px',
  fontFamily: 'var(--font-philosopher)',
};

export default function AvailabilityEditor({ initialBlocks }: { initialBlocks: Block[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('13:00');
  const [newEnd, setNewEnd] = useState('14:00');

  // Récurrents (hebdo) regroupés par jour ; les ponctuels (avec date) sont à part.
  function blocksForDay(day: number): { block: Block; index: number }[] {
    return blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.dayOfWeek === day && !block.date);
  }

  const punctualBlocks = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => !!block.date);

  function addPunctualBlock() {
    setError(null);
    if (!newDate) {
      setError('Choisis une date pour la disponibilité ponctuelle.');
      return;
    }
    if (newStart >= newEnd) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    const dow = new Date(`${newDate}T12:00:00`).getDay();
    setBlocks((prev) => [
      ...prev,
      { dayOfWeek: dow, date: newDate, startTime: newStart, endTime: newEnd, isActive: true },
    ]);
    setNewDate('');
  }

  function formatPunctualDate(d: string): string {
    return new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function addBlockForDay(day: number) {
    setBlocks((prev) => [
      ...prev,
      { dayOfWeek: day, startTime: '10:00', endTime: '11:30', isActive: true },
    ]);
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBlock(index: number, field: 'startTime' | 'endTime', value: string) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    );
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    // Validation côté client
    for (const b of blocks) {
      if (b.startTime >= b.endTime) {
        setError(
          `Bloc ${DAY_NAMES[b.dayOfWeek]} ${b.startTime}–${b.endTime} : l'heure de fin doit être après l'heure de début.`,
        );
        return;
      }
    }

    startTransition(async () => {
      try {
        await requestAvailabilityChange({ blocks });
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
      }
    });
  }

  return (
    <div
      style={{
        background: 'rgba(26, 26, 46, 0.85)',
        border: '1px solid rgba(74, 45, 122, 0.4)',
        borderRadius: '8px',
        padding: '32px',
        display: 'grid',
        gap: '20px',
      }}
    >
      {success && (
        <div
          style={{
            background: 'rgba(46, 196, 182, 0.1)',
            border: '1px solid rgba(46, 196, 182, 0.4)',
            borderRadius: '6px',
            padding: '12px 16px',
            color: 'var(--turquoise-cristal)',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1rem',
          }}
        >
          ✓ Demande envoyée à Runes &amp; Magie pour approbation.
        </div>
      )}
      {error && (
        <div
          style={{
            background: 'rgba(196, 29, 110, 0.1)',
            border: '1px solid rgba(196, 29, 110, 0.4)',
            borderRadius: '6px',
            padding: '12px 16px',
            color: '#f87171',
            fontFamily: 'var(--font-cormorant)',
            fontSize: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Une carte par jour */}
      {DAY_NAMES.map((dayName, dayIndex) => {
        const dayBlocks = blocksForDay(dayIndex);
        return (
          <div
            key={dayIndex}
            style={{
              borderTop: '1px solid rgba(74, 45, 122, 0.3)',
              paddingTop: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.1em',
                  color: 'var(--or-ancien)',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                {dayName}
              </h3>
              <button
                type="button"
                onClick={() => addBlockForDay(dayIndex)}
                disabled={pending}
                style={{
                  background: 'rgba(46, 196, 182, 0.15)',
                  border: '1px solid rgba(46, 196, 182, 0.4)',
                  color: 'var(--turquoise-cristal)',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                }}
              >
                + Ajouter un créneau
              </button>
            </div>

            {dayBlocks.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', opacity: 0.4, margin: '0 0 0 4px', fontSize: '0.95rem' }}>
                Pas de disponibilité ce jour.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {dayBlocks.map(({ block, index }) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                      background: 'rgba(74, 45, 122, 0.1)',
                      padding: '10px 14px',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--parchemin)', opacity: 0.5, minWidth: '32px' }}>
                      De
                    </span>
                    <input
                      type="time"
                      value={block.startTime}
                      onChange={(e) => updateBlock(index, 'startTime', e.target.value)}
                      style={{
                        background: 'rgba(26, 26, 46, 0.8)',
                        border: '1px solid rgba(74, 45, 122, 0.5)',
                        borderRadius: '4px',
                        color: 'var(--parchemin)',
                        padding: '6px 10px',
                        fontFamily: 'var(--font-philosopher)',
                      }}
                    />
                    <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--parchemin)', opacity: 0.5 }}>
                      à
                    </span>
                    <input
                      type="time"
                      value={block.endTime}
                      onChange={(e) => updateBlock(index, 'endTime', e.target.value)}
                      style={{
                        background: 'rgba(26, 26, 46, 0.8)',
                        border: '1px solid rgba(74, 45, 122, 0.5)',
                        borderRadius: '4px',
                        color: 'var(--parchemin)',
                        padding: '6px 10px',
                        fontFamily: 'var(--font-philosopher)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      disabled={pending}
                      style={{
                        marginLeft: 'auto',
                        background: 'transparent',
                        border: '1px solid rgba(196, 29, 110, 0.4)',
                        color: '#f87171',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-cinzel)',
                      }}
                      aria-label="Supprimer ce créneau"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Disponibilités ponctuelles (date précise) */}
      <div style={{ borderTop: '1px solid rgba(74, 45, 122, 0.3)', paddingTop: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.95rem', letterSpacing: '0.1em', color: 'var(--or-ancien)', textTransform: 'uppercase', margin: '0 0 4px' }}>
          Disponibilités ponctuelles (date précise)
        </h3>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin)', opacity: 0.55, fontSize: '0.95rem', margin: '0 0 14px' }}>
          Pour un service donné à une date précise (ex. une formation), en dehors de ta semaine type.
        </p>

        {punctualBlocks.length > 0 && (
          <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
            {punctualBlocks.map(({ block, index }) => (
              <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.25)', padding: '10px 14px', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.8rem', color: 'var(--or-clair)', minWidth: '190px', textTransform: 'capitalize' }}>
                  {block.date ? formatPunctualDate(block.date) : ''}
                </span>
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--parchemin)', opacity: 0.5 }}>De</span>
                <input type="time" value={block.startTime} onChange={(e) => updateBlock(index, 'startTime', e.target.value)} style={timeInputStyle} />
                <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--parchemin)', opacity: 0.5 }}>à</span>
                <input type="time" value={block.endTime} onChange={(e) => updateBlock(index, 'endTime', e.target.value)} style={timeInputStyle} />
                <button type="button" onClick={() => removeBlock(index)} disabled={pending} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid rgba(196, 29, 110, 0.4)', color: '#f87171', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-cinzel)' }} aria-label="Supprimer cette date">
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(74, 45, 122, 0.1)', padding: '12px 14px', borderRadius: '4px' }}>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={timeInputStyle} />
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--parchemin)', opacity: 0.5 }}>De</span>
          <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} style={timeInputStyle} />
          <span style={{ fontFamily: 'var(--font-cinzel)', fontSize: '0.7rem', color: 'var(--parchemin)', opacity: 0.5 }}>à</span>
          <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} style={timeInputStyle} />
          <button type="button" onClick={addPunctualBlock} disabled={pending} style={{ background: 'rgba(46, 196, 182, 0.15)', border: '1px solid rgba(46, 196, 182, 0.4)', color: 'var(--turquoise-cristal)', padding: '6px 14px', borderRadius: '4px', fontFamily: 'var(--font-cinzel)', fontSize: '0.75rem', letterSpacing: '0.05em', cursor: 'pointer' }}>
            + Ajouter cette date
          </button>
        </div>
      </div>

      {/* Submit */}
      <div style={{ borderTop: '1px solid rgba(74, 45, 122, 0.4)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(to right, var(--violet-royal), var(--violet-profond))',
            border: '1px solid var(--or-ancien)',
            color: 'var(--or-ancien)',
            fontFamily: 'var(--font-cinzel)',
            fontSize: '0.85rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            borderRadius: '4px',
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Envoi en cours...' : 'Soumettre pour approbation'}
        </button>
      </div>
    </div>
  );
}
