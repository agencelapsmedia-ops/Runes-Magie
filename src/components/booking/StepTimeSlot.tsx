'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Slot {
  time: string; // "HH:mm"
  available: boolean;
}

interface Props {
  serviceId: string;
  date: string;
  selectedTime: string;
  onSelect: (time: string) => void;
  onBack: () => void;
}

export default function StepTimeSlot({
  serviceId,
  date,
  selectedTime,
  onSelect,
  onBack,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/public/slots?serviceId=${serviceId}&date=${date}&timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        );
        if (!res.ok) throw new Error('Impossible de charger les creneaux');
        const json: Slot[] = await res.json();
        if (!cancelled) setSlots(json);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : 'Erreur inconnue',
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  /* Formatted date for display */
  const displayDate = (() => {
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return date;
    }
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="h-8 w-8 animate-glow-pulse rounded-full bg-violet-royal" />
        <p className="font-philosopher text-gris-fumee">
          Chargement des creneaux...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-20 text-center font-philosopher text-magenta-rituel">
        {error}
      </p>
    );
  }

  return (
    <div>
      <h2 className="text-gradient-gold mb-2 text-center font-cinzel-decorative text-2xl md:text-3xl">
        Choisissez un horaire
      </h2>
      <p className="mb-8 text-center font-philosopher text-sm capitalize text-gris-fumee">
        {displayDate}
      </p>

      {slots.length === 0 ? (
        <p className="py-10 text-center font-philosopher text-gris-fumee">
          Aucun creneau disponible pour cette date.
        </p>
      ) : (
        <div className="mx-auto grid max-w-md grid-cols-3 gap-3 sm:grid-cols-4">
          {slots.map((slot, i) => {
            const isSelected = selectedTime === slot.time;
            const isAvailable = slot.available;

            return (
              <motion.button
                key={slot.time}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelect(slot.time)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className={`
                  relative rounded-lg px-3 py-3 font-philosopher text-sm
                  transition-all duration-200
                  ${
                    isSelected
                      ? 'border-2 border-or-ancien bg-violet-profond font-bold text-or-ancien shadow-[0_0_18px_rgba(201,168,76,0.35)]'
                      : isAvailable
                        ? 'border border-violet-mystique/40 bg-charbon-mystere/50 text-parchemin hover:border-violet-royal/70 hover:bg-violet-profond/30'
                        : 'cursor-not-allowed border border-gris-fumee/15 bg-charbon-mystere/20 text-gris-fumee/30 line-through'
                  }
                `}
              >
                {slot.time}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Back button */}
      <div className="mt-8 flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="font-philosopher text-sm text-gris-fumee transition-colors hover:text-or-ancien"
        >
          &larr; Retour
        </button>
      </div>
    </div>
  );
}
