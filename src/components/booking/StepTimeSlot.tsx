'use client';

import { useEffect, useState } from 'react';
import type { TimeSlot } from '@/lib/slot-generator';

interface Props {
  serviceId: string;
  date: string;
  selected: string;
  durationMinutes: number;
  onSelect: (time: string) => void;
  onBack: () => void;
}

const MONTHS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

export default function StepTimeSlot({
  serviceId,
  date,
  selected,
  durationMinutes,
  onSelect,
  onBack,
}: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/slots?serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [serviceId, date]);

  // Format date for display
  const [y, m, d] = date.split('-').map(Number);
  const displayDate = `${d} ${MONTHS_FR[m - 1]} ${y}`;

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block text-4xl animate-glow-pulse text-or-ancien select-none">*</div>
        <p className="mt-4 text-parchemin-vieilli/60 font-philosopher italic">
          Lecture des energies disponibles...
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">
          Choisissez votre heure
        </h2>
        <p className="mt-3 text-parchemin-vieilli/70 font-philosopher italic">
          {displayDate} &mdash; Seance de {durationMinutes} minutes
        </p>
      </div>

      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-parchemin-vieilli/60 font-philosopher">
            Aucun creneau disponible pour cette date.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 font-cinzel text-sm text-or-ancien hover:text-or-clair transition-colors tracking-wider"
          >
            &larr; Choisir une autre date
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => onSelect(slot.time)}
                className={`py-3 px-2 rounded-sm font-cinzel text-sm tracking-wider transition-all duration-300 border ${
                  selected === slot.time
                    ? 'bg-violet-royal text-or-ancien border-or-ancien/50 shadow-[0_0_15px_rgba(107,63,160,0.4)]'
                    : slot.available
                      ? 'border-violet-royal/30 text-parchemin bg-charbon-mystere/50 hover:border-or-ancien/40 hover:text-or-ancien hover:shadow-[0_0_10px_rgba(201,168,76,0.15)]'
                      : 'border-gris-fumee/10 text-gris-fumee/25 line-through cursor-not-allowed bg-transparent'
                }`}
              >
                {slot.time.replace(':', 'h')}
                {selected === slot.time && (
                  <span className="ml-1 text-xs">*</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={onBack}
              className="font-cinzel text-sm text-parchemin-vieilli/50 hover:text-or-ancien transition-colors tracking-wider"
            >
              &larr; Retour
            </button>
          </div>
        </>
      )}
    </div>
  );
}
