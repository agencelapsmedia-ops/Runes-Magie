'use client';

import { useEffect, useState } from 'react';
import type { ChatOffering } from './types';

/**
 * Carte interactive d'un soin/cours dans le chat ([CARTE:slug]) —
 * données réelles chargées depuis l'API publique légère.
 */
export default function ServiceCard({ slug }: { slug: string }) {
  const [offering, setOffering] = useState<ChatOffering | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chat/offerings/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => !cancelled && setOffering(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (failed) return null;
  if (!offering) {
    return (
      <div className="mt-2 h-24 animate-pulse rounded-lg border border-violet-royal/30 bg-charbon-mystere/60" />
    );
  }

  const modeLabel = offering.modes
    .map((m) => (m === 'IN_PERSON' ? 'Présentiel' : 'Virtuel'))
    .join(' · ');

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-or-ancien/35 bg-charbon-mystere shadow-[0_0_20px_rgba(107,63,160,0.2)] transition-shadow duration-500 hover:shadow-[0_0_28px_rgba(201,168,76,0.25)]">
      {offering.imageUrl && (
        <div className="relative h-32 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offering.imageUrl} alt={offering.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-charbon-mystere via-transparent to-transparent" />
        </div>
      )}
      <div className="p-4">
        <p className="font-cinzel text-base text-parchemin">{offering.name}</p>
        <p className="mt-1 font-cinzel text-[0.68rem] uppercase tracking-[0.1em] text-or-ancien">
          {offering.durationLabel} · {offering.priceLabel} · {modeLabel}
        </p>
        <p className="font-philosopher text-[0.72rem] italic text-parchemin-vieilli/60">
          avec {offering.practitionerName}
        </p>
        <p className="mt-2 line-clamp-2 font-cormorant text-sm leading-relaxed text-parchemin-vieilli/80">
          {offering.description}
        </p>
        <div className="mt-3 flex gap-2">
          <a
            href={offering.bookingHref}
            className="flex-1 rounded-sm bg-gradient-to-r from-or-ancien to-or-clair px-3 py-2.5 text-center font-cinzel text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-charbon-mystere transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-or-ancien"
          >
            Réserver
          </a>
          <a
            href={offering.detailHref}
            className="flex-1 rounded-sm border border-or-ancien/50 px-3 py-2.5 text-center font-cinzel text-[0.68rem] uppercase tracking-[0.1em] text-or-ancien transition-all hover:bg-or-ancien/10 focus-visible:outline-2 focus-visible:outline-or-ancien"
          >
            Découvrir
          </a>
        </div>
      </div>
    </div>
  );
}
