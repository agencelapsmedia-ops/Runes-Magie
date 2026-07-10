'use client';

import { BOUTIQUE_PHONE, BOUTIQUE_PHONE_TEL, MESSENGER_URL } from '@/lib/constants';

/** Carte « Parler à un membre de l'équipe » : téléphone + Messenger. */
export default function HumanHandoff() {
  return (
    <div className="mt-2 rounded-lg border border-turquoise-cristal/30 bg-teal-profond/10 p-4">
      <p className="font-cinzel text-[0.7rem] uppercase tracking-[0.12em] text-turquoise-cristal">
        Parler à un membre de l&apos;équipe
      </p>
      <p className="mt-1 font-cormorant text-sm text-parchemin-vieilli/80">
        Avec grand plaisir — choisis le chemin qui te convient :
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a
          href={BOUTIQUE_PHONE_TEL}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm border border-turquoise-cristal/50 px-3 py-2.5 font-cinzel text-[0.68rem] uppercase tracking-[0.1em] text-turquoise-cristal transition-all hover:bg-turquoise-cristal/10 focus-visible:outline-2 focus-visible:outline-turquoise-cristal"
        >
          ☎ {BOUTIQUE_PHONE}
        </a>
        {MESSENGER_URL && (
          <a
            href={MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-violet-royal to-violet-profond px-3 py-2.5 font-cinzel text-[0.68rem] uppercase tracking-[0.1em] text-or-clair transition-all hover:brightness-125 focus-visible:outline-2 focus-visible:outline-or-ancien"
          >
            ✉ Messenger
          </a>
        )}
      </div>
    </div>
  );
}
