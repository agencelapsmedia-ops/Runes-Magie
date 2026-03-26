'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { BookingData, BookingResult } from './BookingWizard';

/* -------------------------------------------------- */
/*  Falling star                                       */
/* -------------------------------------------------- */

interface Star {
  id: number;
  x: number;      // % from left
  delay: number;   // seconds
  duration: number; // seconds
  size: number;    // px
}

function FallingStars({ count = 18 }: { count?: number }) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
      size: 2 + Math.random() * 3,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-or-clair"
          style={{
            left: `${star.x}%`,
            width: star.size,
            height: star.size,
            top: -10,
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: ['0vh', '100vh'],
            opacity: [0, 1, 1, 0],
            x: [0, (Math.random() - 0.5) * 60],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------- */
/*  ICS generator                                      */
/* -------------------------------------------------- */

function generateICS(data: BookingData): string {
  const dtStart = `${data.date.replace(/-/g, '')}T${data.time.replace(':', '')}00`;
  const endDate = new Date(`${data.date}T${data.time}:00`);
  endDate.setMinutes(endDate.getMinutes() + (data.service?.durationMinutes ?? 60));
  const dtEnd =
    endDate.getFullYear().toString() +
    String(endDate.getMonth() + 1).padStart(2, '0') +
    String(endDate.getDate()).padStart(2, '0') +
    'T' +
    String(endDate.getHours()).padStart(2, '0') +
    String(endDate.getMinutes()).padStart(2, '0') +
    '00';

  const now = new Date();
  const dtStamp =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    'T' +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0') +
    'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Runes et Magie//Booking//FR',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${data.service?.emoji ?? ''} ${data.service?.name ?? 'Seance'} - Runes et Magie`,
    `DESCRIPTION:Reservation chez Runes et Magie`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/* -------------------------------------------------- */
/*  Props                                              */
/* -------------------------------------------------- */

interface Props {
  data: BookingData;
  result: BookingResult;
}

/* -------------------------------------------------- */
/*  Component                                          */
/* -------------------------------------------------- */

export default function StepConfirmation({ data, result }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadICS = useCallback(() => {
    const ics = generateICS(data);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservation-runes-et-magie.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  }, [data]);

  /* Formatted date */
  const displayDate = (() => {
    try {
      const d = new Date(data.date + 'T00:00:00');
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return data.date;
    }
  })();

  return (
    <div className="relative">
      <FallingStars />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-lg"
      >
        {/* Success icon */}
        <div className="mb-6 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-or-ancien bg-violet-profond shadow-[0_0_30px_rgba(201,168,76,0.3)]"
          >
            <svg
              className="h-8 w-8 text-or-ancien"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        </div>

        <h2 className="text-gradient-gold mb-2 text-center font-cinzel-decorative text-2xl md:text-3xl">
          Reservation confirmee
        </h2>
        <p className="mb-8 text-center font-philosopher text-sm text-gris-fumee">
          Un email de confirmation a ete envoye a{' '}
          <span className="text-turquoise-cristal">{data.clientEmail}</span>
        </p>

        {/* Recap card */}
        <div className="rounded-xl border border-violet-mystique/25 bg-charbon-mystere/50 p-6">
          <dl className="space-y-3 font-philosopher text-sm">
            <div className="flex justify-between">
              <dt className="text-gris-fumee/60">Service</dt>
              <dd className="text-right text-parchemin">
                {data.service?.emoji} {data.service?.name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gris-fumee/60">Date</dt>
              <dd className="text-right capitalize text-parchemin">
                {displayDate}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gris-fumee/60">Horaire</dt>
              <dd className="text-right text-parchemin">{data.time}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gris-fumee/60">Duree</dt>
              <dd className="text-right text-parchemin">
                {data.service?.durationMinutes} min
              </dd>
            </div>
            {data.service?.price !== null &&
              data.service?.price !== undefined && (
                <div className="flex justify-between border-t border-violet-mystique/20 pt-3">
                  <dt className="text-gris-fumee/60">Prix</dt>
                  <dd className="text-gradient-gold text-right font-cinzel font-bold">
                    {data.service.price}&nbsp;&euro;
                  </dd>
                </div>
              )}
          </dl>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {/* Download .ics */}
          <button
            type="button"
            onClick={handleDownloadICS}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-mystique/30 bg-charbon-mystere/50 px-5 py-2.5 font-philosopher text-sm text-parchemin transition-all hover:border-or-ancien/40 hover:text-or-ancien"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {downloaded ? 'Telecharge !' : 'Ajouter au calendrier'}
          </button>

          {/* View booking */}
          <a
            href={`/reservation/${result.bookingId}?token=${result.token}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-mystique/30 bg-charbon-mystere/50 px-5 py-2.5 font-philosopher text-sm text-parchemin transition-all hover:border-turquoise-cristal/40 hover:text-turquoise-cristal"
          >
            Voir ma reservation
          </a>

          {/* Cancel link */}
          <a
            href={`/reservation/${result.bookingId}/annuler?token=${result.token}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-philosopher text-sm text-gris-fumee/60 transition-colors hover:text-magenta-rituel"
          >
            Annuler
          </a>
        </div>
      </motion.div>
    </div>
  );
}
