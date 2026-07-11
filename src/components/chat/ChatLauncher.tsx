'use client';

import { useState } from 'react';
import { LAUNCHER_IMG, FALLBACK_IMG } from './types';

/**
 * Bouton flottant du chat — portrait de Noctura, halo doux, bulle ⋯.
 * 84 px desktop / 68 px mobile, bas-droite, au-dessus du contenu (z-95).
 */
export default function ChatLauncher({ onOpen }: { onOpen: () => void }) {
  const [src, setSrc] = useState(LAUNCHER_IMG);

  return (
    <div className="fixed bottom-5 right-5 z-[95] group">
      {/* Tooltip au survol */}
      <span
        className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 whitespace-nowrap rounded-md border border-or-ancien/40 bg-charbon-mystere/95 px-3 py-1.5 font-cinzel text-xs uppercase tracking-[0.12em] text-or-clair opacity-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        Discuter avec Noctura
      </span>

      <button
        type="button"
        onClick={onOpen}
        aria-label="Discuter avec Noctura, la guide de Runes & Magie"
        className="relative block h-[68px] w-[68px] md:h-[84px] md:w-[84px] cursor-pointer rounded-full border-2 border-or-ancien/70 shadow-[0_0_20px_rgba(107,63,160,0.5),0_0_40px_rgba(201,168,76,0.25)] transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-ancien motion-safe:animate-glow-pulse"
      >
        <span className="absolute inset-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            onError={() => setSrc(FALLBACK_IMG)}
            className="h-full w-full scale-[1.08] object-cover"
            draggable={false}
          />
        </span>
        {/* Bulle ⋯ */}
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-or-ancien/60 bg-violet-mystique text-[0.6rem] leading-none text-or-clair shadow-[0_0_10px_rgba(107,63,160,0.8)]"
        >
          •••
        </span>
      </button>
    </div>
  );
}
