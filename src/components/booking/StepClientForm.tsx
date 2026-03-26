'use client';

import { useState, type FormEvent } from 'react';
import type { BookingData, BookingResult } from './BookingWizard';

interface Props {
  data: BookingData;
  onUpdate: (patch: Partial<BookingData>) => void;
  onBack: () => void;
  onConfirm: (result: BookingResult) => void;
}

export default function StepClientForm({
  data,
  onUpdate,
  onBack,
  onConfirm,
}: Props) {
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* Format date for display */
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

  const canSubmit =
    data.clientName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail) &&
    policyAccepted &&
    !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: data.service!.id,
          date: data.date,
          time: data.time,
          clientName: data.clientName.trim(),
          clientEmail: data.clientEmail.trim(),
          clientPhone: data.clientPhone.trim() || undefined,
          notes: data.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? 'La reservation a echoue. Veuillez reessayer.',
        );
      }

      const result: BookingResult = await res.json();
      onConfirm(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Erreur inconnue',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* ---- Form ---- */}
      <form
        onSubmit={handleSubmit}
        className="order-2 space-y-5 lg:order-1 lg:col-span-3"
      >
        <h2 className="text-gradient-gold mb-6 font-cinzel-decorative text-2xl md:text-3xl">
          Vos coordonnees
        </h2>

        {/* Name */}
        <div>
          <label
            htmlFor="bk-name"
            className="mb-1 block font-philosopher text-sm text-parchemin"
          >
            Nom complet <span className="text-magenta-rituel">*</span>
          </label>
          <input
            id="bk-name"
            type="text"
            required
            minLength={2}
            value={data.clientName}
            onChange={(e) => onUpdate({ clientName: e.target.value })}
            className="w-full rounded-lg border border-violet-mystique/30 bg-charbon-mystere/50 px-4 py-2.5 font-philosopher text-parchemin placeholder:text-gris-fumee/40 focus:border-or-ancien/50 focus:outline-none focus:ring-1 focus:ring-or-ancien/30"
            placeholder="Votre nom"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="bk-email"
            className="mb-1 block font-philosopher text-sm text-parchemin"
          >
            Email <span className="text-magenta-rituel">*</span>
          </label>
          <input
            id="bk-email"
            type="email"
            required
            value={data.clientEmail}
            onChange={(e) => onUpdate({ clientEmail: e.target.value })}
            className="w-full rounded-lg border border-violet-mystique/30 bg-charbon-mystere/50 px-4 py-2.5 font-philosopher text-parchemin placeholder:text-gris-fumee/40 focus:border-or-ancien/50 focus:outline-none focus:ring-1 focus:ring-or-ancien/30"
            placeholder="votre@email.com"
          />
        </div>

        {/* Phone (optional) */}
        <div>
          <label
            htmlFor="bk-phone"
            className="mb-1 block font-philosopher text-sm text-gris-fumee"
          >
            Telephone <span className="text-gris-fumee/50">(optionnel)</span>
          </label>
          <input
            id="bk-phone"
            type="tel"
            value={data.clientPhone}
            onChange={(e) => onUpdate({ clientPhone: e.target.value })}
            className="w-full rounded-lg border border-violet-mystique/30 bg-charbon-mystere/50 px-4 py-2.5 font-philosopher text-parchemin placeholder:text-gris-fumee/40 focus:border-or-ancien/50 focus:outline-none focus:ring-1 focus:ring-or-ancien/30"
            placeholder="06 12 34 56 78"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label
            htmlFor="bk-notes"
            className="mb-1 block font-philosopher text-sm text-gris-fumee"
          >
            Notes <span className="text-gris-fumee/50">(optionnel)</span>
          </label>
          <textarea
            id="bk-notes"
            rows={3}
            value={data.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full resize-none rounded-lg border border-violet-mystique/30 bg-charbon-mystere/50 px-4 py-2.5 font-philosopher text-parchemin placeholder:text-gris-fumee/40 focus:border-or-ancien/50 focus:outline-none focus:ring-1 focus:ring-or-ancien/30"
            placeholder="Informations complementaires..."
          />
        </div>

        {/* Policy checkbox */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={(e) => setPolicyAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 accent-violet-royal"
          />
          <span className="font-philosopher text-xs leading-relaxed text-gris-fumee">
            J&apos;accepte les conditions d&apos;annulation et la politique de
            confidentialite. Un email de confirmation me sera envoye.
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="rounded-lg border border-magenta-rituel/30 bg-magenta-rituel/10 px-4 py-2 font-philosopher text-sm text-magenta-rituel">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="font-philosopher text-sm text-gris-fumee transition-colors hover:text-or-ancien"
          >
            &larr; Retour
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              rounded-lg px-8 py-3 font-cinzel text-sm font-bold
              transition-all duration-300
              ${
                canSubmit
                  ? 'border-glow-violet bg-violet-profond text-or-ancien shadow-[0_0_20px_rgba(107,63,160,0.3)] hover:shadow-[0_0_30px_rgba(107,63,160,0.5)]'
                  : 'cursor-not-allowed bg-charbon-mystere/40 text-gris-fumee/40'
              }
            `}
          >
            {submitting ? 'Envoi en cours...' : 'Confirmer la reservation'}
          </button>
        </div>
      </form>

      {/* ---- Recap sidebar ---- */}
      <aside className="order-1 lg:order-2 lg:col-span-2">
        <div className="rounded-xl border border-violet-mystique/25 bg-charbon-mystere/40 p-5">
          <h3 className="mb-4 font-cinzel text-sm font-semibold uppercase tracking-wider text-or-ancien">
            Recapitulatif
          </h3>

          <dl className="space-y-3 font-philosopher text-sm">
            {/* Service */}
            <div>
              <dt className="text-gris-fumee/60">Service</dt>
              <dd className="text-parchemin">
                {data.service?.emoji} {data.service?.name}
              </dd>
            </div>

            {/* Date */}
            <div>
              <dt className="text-gris-fumee/60">Date</dt>
              <dd className="capitalize text-parchemin">{displayDate}</dd>
            </div>

            {/* Time */}
            <div>
              <dt className="text-gris-fumee/60">Horaire</dt>
              <dd className="text-parchemin">{data.time}</dd>
            </div>

            {/* Duration */}
            <div>
              <dt className="text-gris-fumee/60">Duree</dt>
              <dd className="text-parchemin">
                {data.service?.durationMinutes} minutes
              </dd>
            </div>

            {/* Price */}
            {data.service?.price !== null &&
              data.service?.price !== undefined && (
                <div className="border-t border-violet-mystique/20 pt-3">
                  <dt className="text-gris-fumee/60">Prix</dt>
                  <dd className="text-gradient-gold font-cinzel text-lg font-bold">
                    {data.service.price}&nbsp;$
                  </dd>
                </div>
              )}
          </dl>
        </div>
      </aside>
    </div>
  );
}
