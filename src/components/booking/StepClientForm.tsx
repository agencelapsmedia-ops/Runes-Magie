'use client';

import { useState } from 'react';
import type { BookingData } from './BookingWizard';

const MONTHS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

interface Props {
  booking: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onConfirm: (token: string) => void;
  onBack: () => void;
}

export default function StepClientForm({ booking, onUpdate, onConfirm, onBack }: Props) {
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [y, m, d] = booking.date.split('-').map(Number);
  const displayDate = `${d} ${MONTHS_FR[m - 1]} ${y}`;

  const canSubmit =
    booking.clientName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.clientEmail) &&
    acceptPolicy &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: booking.service!.id,
          date: booking.date,
          time: booking.time,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          clientPhone: booking.clientPhone || undefined,
          notes: booking.notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        setSubmitting(false);
        return;
      }

      onConfirm(data.token);
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">
          Vos informations
        </h2>
        <p className="mt-3 text-parchemin-vieilli/70 font-philosopher italic">
          Derniere etape avant votre seance
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Name */}
          <div>
            <label className="block font-cinzel text-sm text-parchemin-vieilli/70 mb-2 tracking-wider">
              Nom complet *
            </label>
            <input
              type="text"
              value={booking.clientName}
              onChange={(e) => onUpdate({ clientName: e.target.value })}
              placeholder="Votre nom"
              className="w-full px-4 py-3 bg-charbon-mystere border border-violet-royal/30 rounded-sm text-parchemin font-cormorant text-lg placeholder:text-gris-fumee/40 focus:outline-none focus:border-or-ancien/50 focus:shadow-[0_0_10px_rgba(201,168,76,0.1)] transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-cinzel text-sm text-parchemin-vieilli/70 mb-2 tracking-wider">
              Courriel *
            </label>
            <input
              type="email"
              value={booking.clientEmail}
              onChange={(e) => onUpdate({ clientEmail: e.target.value })}
              placeholder="votre@courriel.com"
              className="w-full px-4 py-3 bg-charbon-mystere border border-violet-royal/30 rounded-sm text-parchemin font-cormorant text-lg placeholder:text-gris-fumee/40 focus:outline-none focus:border-or-ancien/50 focus:shadow-[0_0_10px_rgba(201,168,76,0.1)] transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-cinzel text-sm text-parchemin-vieilli/70 mb-2 tracking-wider">
              Telephone <span className="text-gris-fumee/40">(optionnel)</span>
            </label>
            <input
              type="tel"
              value={booking.clientPhone}
              onChange={(e) => onUpdate({ clientPhone: e.target.value })}
              placeholder="(514) 000-0000"
              className="w-full px-4 py-3 bg-charbon-mystere border border-violet-royal/30 rounded-sm text-parchemin font-cormorant text-lg placeholder:text-gris-fumee/40 focus:outline-none focus:border-or-ancien/50 focus:shadow-[0_0_10px_rgba(201,168,76,0.1)] transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-cinzel text-sm text-parchemin-vieilli/70 mb-2 tracking-wider">
              Message <span className="text-gris-fumee/40">(optionnel)</span>
            </label>
            <textarea
              value={booking.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Questions ou informations supplementaires..."
              rows={3}
              className="w-full px-4 py-3 bg-charbon-mystere border border-violet-royal/30 rounded-sm text-parchemin font-cormorant text-lg placeholder:text-gris-fumee/40 focus:outline-none focus:border-or-ancien/50 focus:shadow-[0_0_10px_rgba(201,168,76,0.1)] transition-all resize-none"
            />
          </div>

          {/* Policy checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptPolicy}
              onChange={(e) => setAcceptPolicy(e.target.checked)}
              className="mt-1 accent-violet-royal"
            />
            <span className="text-sm text-parchemin-vieilli/60 font-cormorant group-hover:text-parchemin-vieilli/80 transition-colors">
              J'accepte la politique d'annulation (24 heures avant la seance)
            </span>
          </label>

          {error && (
            <p className="text-magenta-rituel text-sm font-philosopher">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="font-cinzel text-sm text-parchemin-vieilli/50 hover:text-or-ancien transition-colors tracking-wider"
            >
              &larr; Retour
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 py-4 rounded-sm font-cinzel uppercase tracking-[0.15em] text-sm transition-all duration-300 border ${
                canSubmit
                  ? 'bg-gradient-to-r from-violet-royal to-violet-profond text-or-ancien border-or-ancien/30 hover:shadow-[0_0_20px_rgba(201,168,76,0.4),0_0_40px_rgba(201,168,76,0.15)] hover:border-or-ancien/60'
                  : 'bg-gris-fumee/20 text-gris-fumee/40 border-gris-fumee/10 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Envoi en cours...' : 'Confirmer ma seance *'}
            </button>
          </div>
        </div>

        {/* Recap */}
        <div className="lg:col-span-2">
          <div className="bg-charbon-mystere border border-or-ancien/20 rounded-sm p-6 sticky top-24">
            <h3 className="font-cinzel text-sm text-or-ancien tracking-wider uppercase mb-4">
              Recapitulatif
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-parchemin-vieilli/60">Service</span>
                <span className="text-parchemin font-cinzel">
                  {booking.service?.emoji} {booking.service?.name}
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
              {booking.service?.price && (
                <>
                  <div className="h-px bg-or-ancien/20" />
                  <div className="flex justify-between font-cinzel">
                    <span className="text-or-ancien/70">Prix</span>
                    <span className="text-or-ancien text-base">
                      {booking.service.price.toFixed(2).replace('.', ',')} $
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
