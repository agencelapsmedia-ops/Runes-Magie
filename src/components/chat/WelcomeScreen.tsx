'use client';

import { useState } from 'react';
import { WELCOME_IMG, FALLBACK_IMG } from './types';
import QuickActions from './QuickActions';

const ACTIONS = [
  { label: 'Découvrir les soins', message: "J'aimerais découvrir les soins offerts." },
  { label: 'Explorer les formations', message: "J'aimerais explorer les formations et les cours." },
  { label: 'Trouver le rituel qui me correspond', message: "Aide-moi à trouver le rituel qui me correspond." },
];

/** Écran d'accueil du Sanctuaire — avant le premier message. */
export default function WelcomeScreen({
  onPick,
  onHuman,
}: {
  onPick: (message: string) => void;
  onHuman: () => void;
}) {
  const [src, setSrc] = useState(WELCOME_IMG);

  return (
    <div className="flex flex-col items-center px-5 py-6 text-center">
      <span className="block h-40 w-40 overflow-hidden rounded-full border-2 border-or-ancien/60 shadow-[0_0_30px_rgba(107,63,160,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Noctura, guide de Runes & Magie"
          onError={() => setSrc(FALLBACK_IMG)}
          className="h-full w-full scale-[1.08] object-cover"
          draggable={false}
        />
      </span>

      <p className="mt-4 font-cinzel-decorative text-xl leading-snug text-gradient-gold">
        ✦ Bienvenue dans le Sanctuaire
      </p>
      <p className="mt-2 max-w-xs font-cormorant text-base italic leading-relaxed text-parchemin-vieilli/85">
        Je suis Noctura, gardienne des lieux. Je peux te guider vers les soins, les formations,
        les produits et les disponibilités.
      </p>
      <p className="mt-3 font-cinzel text-[0.68rem] uppercase tracking-[0.16em] text-or-ancien/80">
        Que cherches-tu aujourd&apos;hui ?
      </p>

      <div className="mt-4 flex justify-center">
        <QuickActions actions={ACTIONS} onPick={onPick} />
      </div>

      <button
        type="button"
        onClick={onHuman}
        className="mt-4 min-h-11 font-philosopher text-sm italic text-turquoise-cristal/80 underline-offset-4 transition-colors hover:text-turquoise-cristal hover:underline focus-visible:outline-2 focus-visible:outline-turquoise-cristal"
      >
        Parler à un membre de l&apos;équipe
      </button>
    </div>
  );
}
