'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Button from '../ui/Button';
import GhostCaracal from './GhostCaracal';

export default function HeroCarousel() {
  const [ghostTrigger, setGhostTrigger] = useState(0);

  const spawnGhost = useCallback(() => {
    setGhostTrigger((n) => n + 1);
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden select-none">
      {/* ---- Background image ---- */}
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: "url('/images/hero/hero-7.png')",
          backgroundPosition: 'center center',
        }}
      />

      {/* ---- Dark gradient overlay ---- */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,18,0.35) 0%, rgba(10,10,18,0.10) 35%, rgba(10,10,18,0.50) 70%, rgba(10,10,18,0.92) 100%)',
        }}
      />

      {/* ══════ DESKTOP : logo absolu gauche + contenu centré ══════ */}
      <div className="hidden lg:block">
        {/* Logo — cliquable pour déclencher le fantôme */}
        <button
          onClick={spawnGhost}
          className="absolute z-20 animate-float-logo cursor-pointer bg-transparent border-0 p-0"
          style={{ left: '3%', top: '38%', transform: 'translateY(-50%)' }}
          aria-label="Invoquer le caracal magique"
          type="button"
        >
          <Image
            src="/images/logo/logo-3d-gold.png"
            alt="Logo Runes & Magie"
            width={560}
            height={560}
            className="w-[480px] xl:w-[560px] h-auto object-contain drop-shadow-[0_0_60px_rgba(201,168,76,0.55)] hover:drop-shadow-[0_0_80px_rgba(201,168,76,0.85)] transition-all duration-300"
            priority
          />
        </button>

        {/* Contenu — centré sur toute la largeur */}
        <div className="absolute z-20 inset-0 flex flex-col items-center justify-center text-center">
          <p className="mb-4 text-or-ancien tracking-[12px] animate-glow-runes" style={{ fontSize: 42, lineHeight: 1 }}>
            &#5765;&#5794;&#5799;&#5800;&#5809;&#5810;
          </p>
          <h1 className="font-cinzel-decorative font-bold text-gradient-gold leading-none" style={{ fontSize: 'clamp(3rem, 5.5vw, 5rem)' }}>
            Runes &amp; Magie
          </h1>
          <p className="mt-4 font-cinzel uppercase text-turquoise-cristal tracking-[8px]" style={{ fontSize: '1.1rem' }}>
            Boutique-&Eacute;cole
          </p>
          <span
            aria-hidden="true"
            className="mt-6 mb-5 block h-px w-40"
            style={{ background: 'linear-gradient(90deg, transparent, var(--or-ancien), transparent)' }}
          />
          <p className="font-cormorant italic text-parchemin/80 max-w-lg" style={{ fontSize: '1.2rem' }}>
            Cristaux, Runes, Tarot &amp; Magie Naturelle&nbsp;&mdash; Votre Sorci&egrave;re, Noctura Anna
          </p>
          <div className="mt-8 flex gap-4">
            {/* Boutons — déclenchent le fantôme au clic */}
            <div onClick={spawnGhost}>
              <Button variant="primary" size="lg" href="/boutique">D&eacute;couvrir la Boutique</Button>
            </div>
            <div onClick={spawnGhost}>
              <Button variant="secondary" size="lg" href="/reserver">R&eacute;server un Soin</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE : colonne centrée compacte ══════ */}
      <div className="lg:hidden relative z-20 flex h-full flex-col items-center justify-center px-4 text-center gap-3">
        <button
          onClick={spawnGhost}
          className="bg-transparent border-0 p-0 cursor-pointer animate-float-logo drop-shadow-[0_0_30px_rgba(201,168,76,0.5)]"
          type="button"
          aria-label="Invoquer le caracal magique"
        >
          <Image
            src="/images/logo/logo-3d-gold.png"
            alt="Logo Runes & Magie"
            width={160}
            height={160}
            className="w-[140px] sm:w-[180px] h-auto object-contain"
            priority
          />
        </button>
        <p className="text-or-ancien tracking-[10px] animate-glow-runes" style={{ fontSize: 28, lineHeight: 1 }}>
          &#5765;&#5794;&#5799;&#5800;&#5809;&#5810;
        </p>
        <h1 className="font-cinzel-decorative font-bold text-gradient-gold leading-none" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
          Runes &amp; Magie
        </h1>
        <p className="font-cinzel uppercase text-turquoise-cristal tracking-[6px] text-sm">
          Boutique-&Eacute;cole
        </p>
        <span
          aria-hidden="true"
          className="block h-px w-32 my-2"
          style={{ background: 'linear-gradient(90deg, transparent, var(--or-ancien), transparent)' }}
        />
        <p className="font-cormorant italic text-parchemin/80 text-base max-w-xs">
          Cristaux, Runes, Tarot &amp; Magie Naturelle&nbsp;&mdash; Noctura Anna
        </p>
        <div className="mt-4 flex flex-col gap-3 w-full max-w-xs">
          <div onClick={spawnGhost}>
            <Button variant="primary" size="lg" href="/boutique">D&eacute;couvrir la Boutique</Button>
          </div>
          <div onClick={spawnGhost}>
            <Button variant="secondary" size="lg" href="/reserver">R&eacute;server un Soin</Button>
          </div>
        </div>
      </div>

      {/* ══════ CARACAL FANTÔME ══════ */}
      <GhostCaracal trigger={ghostTrigger} />

      {/* ---- Keyframes ---- */}
      <style jsx global>{`
        @keyframes glowRunes {
          0%, 100% {
            text-shadow: 0 0 8px rgba(201,168,76,0.5), 0 0 20px rgba(201,168,76,0.25);
          }
          50% {
            text-shadow: 0 0 16px rgba(201,168,76,0.8), 0 0 40px rgba(201,168,76,0.4), 0 0 60px rgba(201,168,76,0.15);
          }
        }
        .animate-glow-runes { animation: glowRunes 3s ease-in-out infinite; }

        @keyframes floatLogo {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .animate-float-logo { animation: floatLogo 5s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
