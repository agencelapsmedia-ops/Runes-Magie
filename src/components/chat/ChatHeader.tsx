'use client';

import { useState } from 'react';
import { LAUNCHER_IMG, FALLBACK_IMG } from './types';

/** En-tête de la fenêtre : portrait, identité, statut, réduire/fermer. */
export default function ChatHeader({ onClose }: { onClose: () => void }) {
  const [src, setSrc] = useState(LAUNCHER_IMG);

  return (
    <div className="relative flex shrink-0 items-center gap-3 border-b border-or-ancien/25 px-4 py-3">
      {/* Filigrane runique très discret */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-end pr-16 font-cinzel text-3xl tracking-[0.5em] text-or-ancien/5 select-none"
      >
        ᚱᚨᛟ
      </span>

      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-or-ancien/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          onError={() => setSrc(FALLBACK_IMG)}
          className="h-full w-full scale-[1.08] object-cover"
          draggable={false}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-cinzel-decorative text-lg leading-tight text-gradient-gold">Noctura</p>
        <p className="font-philosopher text-[0.7rem] italic text-parchemin-vieilli/60 leading-tight">
          Guide de Runes &amp; Magie
        </p>
        <p className="flex items-center gap-1.5 font-cinzel text-[0.58rem] uppercase tracking-[0.14em] text-turquoise-cristal/90">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-turquoise-cristal" />
          Disponible pour vous guider
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la conversation"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-parchemin-vieilli/60 transition-colors hover:bg-violet-royal/30 hover:text-or-clair focus-visible:outline-2 focus-visible:outline-or-ancien"
      >
        <span aria-hidden className="text-xl leading-none">×</span>
      </button>
    </div>
  );
}
