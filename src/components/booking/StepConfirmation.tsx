'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { BookingData } from './BookingWizard';

const MONTHS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

interface Props {
  booking: BookingData;
  token: string;
}

function generateIcsUrl(booking: BookingData): string {
  const [y, m, d] = booking.date.split('-').map(Number);
  const [h, min] = booking.time.split(':').map(Number);
  const start = `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}${String(min).padStart(2, '0')}00`;
  const endMin = min + (booking.service?.durationMinutes || 60);
  const endH = h + Math.floor(endMin / 60);
  const endM = endMin % 60;
  const end = `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART;TZID=America/Toronto:${start}`,
    `DTEND;TZID=America/Toronto:${end}`,
    `SUMMARY:${booking.service?.emoji} ${booking.service?.name} - Runes & Magie`,
    'DESCRIPTION:Votre seance chez Runes & Magie',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

// Falling stars animation
function FallingStars() {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 2 + 1.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute text-or-ancien"
          style={{
            left: `${star.left}%`,
            top: -10,
            fontSize: `${star.size * 4}px`,
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: '100vh', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            ease: 'linear',
          }}
        >
          *
        </motion.div>
      ))}
    </div>
  );
}

export default function StepConfirmation({ booking, token }: Props) {
  const [showStars, setShowStars] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowStars(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const [y, m, d] = booking.date.split('-').map(Number);
  const displayDate = `${d} ${MONTHS_FR[m - 1]} ${y}`;

  return (
    <div className="relative text-center">
      {showStars && <FallingStars />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Success icon */}
        <div className="text-6xl text-or-ancien mb-6 select-none animate-glow-pulse">
          {booking.service?.emoji}
        </div>

        <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold mb-4">
          Seance confirmee
        </h2>

        <p className="text-parchemin-vieilli/70 font-philosopher italic mb-10">
          Les astres ont enregistre votre rendez-vous
        </p>

        {/* Recap card */}
        <div className="max-w-md mx-auto bg-charbon-mystere border border-or-ancien/20 rounded-sm p-8 text-left mb-8">
          <div className="space-y-4 text-base font-cormorant">
            <div className="flex justify-between">
              <span className="text-parchemin-vieilli/60">Service</span>
              <span className="text-parchemin font-cinzel text-sm">
                {booking.service?.name}
              </span>
            </div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between">
              <span className="text-parchemin-vieilli/60">Date</span>
              <span className="text-parchemin">{displayDate}</span>
            </div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between">
              <span className="text-parchemin-vieilli/60">Heure</span>
              <span className="text-parchemin">{booking.time.replace(':', 'h')}</span>
            </div>
            <div className="h-px bg-violet-royal/15" />
            <div className="flex justify-between">
              <span className="text-parchemin-vieilli/60">Duree</span>
              <span className="text-parchemin">{booking.service?.durationMinutes} min</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-parchemin-vieilli/60 text-sm mb-8 font-philosopher">
          Un courriel de confirmation a ete envoye a <strong className="text-parchemin">{booking.clientEmail}</strong>
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={generateIcsUrl(booking)}
            download={`runes-magie-${booking.date}.ics`}
            className="inline-flex items-center gap-2 px-6 py-3 font-cinzel text-sm tracking-wider text-or-ancien border border-or-ancien/30 rounded-sm hover:border-or-ancien/60 hover:shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-all duration-300"
          >
            Ajouter au calendrier
          </a>
          <Link
            href={`/reserver/confirmation/${token}`}
            className="inline-flex items-center gap-2 px-6 py-3 font-cinzel text-sm tracking-wider text-parchemin-vieilli/60 hover:text-or-ancien transition-colors"
          >
            Voir ou annuler
          </Link>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="font-cinzel text-sm text-parchemin-vieilli/40 hover:text-or-ancien transition-colors tracking-wider"
          >
            Retour a l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
