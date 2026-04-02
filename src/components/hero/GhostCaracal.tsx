'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

/* Runes qui flottent autour du caracal */
const RUNE_PARTICLES = [
  { char: 'ᚠ', x: 10, y: -60, delay: 0.1 },
  { char: 'ᚨ', x: 60, y: -90, delay: 0.25 },
  { char: 'ᛏ', x: 120, y: -50, delay: 0.4 },
  { char: 'ᚷ', x: 30, y: -110, delay: 0.15 },
  { char: 'ᛟ', x: 80, y: -130, delay: 0.55 },
  { char: 'ᚱ', x: -20, y: -80, delay: 0.3 },
  { char: 'ᛉ', x: 150, y: -70, delay: 0.45 },
  { char: 'ᚹ', x: 50, y: -150, delay: 0.2 },
];

interface Props {
  trigger: number;
}

export default function GhostCaracal({ trigger }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    setIsPlaying(true);
    setKey((k) => k + 1);
    const t = setTimeout(() => setIsPlaying(false), 3200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!isPlaying) return null;

  return (
    <>
      <div
        key={key}
        className="ghost-caracal-wrap"
        aria-hidden="true"
      >
        {/* Corps du caracal fantôme */}
        <div className="ghost-caracal-body">
          <Image
            src="/images/logo/logo-3d-gold.png"
            alt=""
            width={300}
            height={300}
            className="ghost-caracal-img"
            unoptimized
          />

          {/* Particules de poussière dorée */}
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="dust-particle"
              style={{
                left: `${-20 + i * 15}px`,
                animationDelay: `${i * 0.08}s`,
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
              }}
            />
          ))}

          {/* Runes flottantes */}
          {RUNE_PARTICLES.map((rune, i) => (
            <span
              key={i}
              className="rune-float"
              style={{
                left: `${rune.x}px`,
                top: `${rune.y}px`,
                animationDelay: `${rune.delay}s`,
              }}
            >
              {rune.char}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        /* ── Conteneur qui traverse l'écran ── */
        .ghost-caracal-wrap {
          position: fixed;
          bottom: 18%;
          left: 0;
          width: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: visible;
        }

        /* ── Caracal qui court de gauche à droite ── */
        @keyframes caracalRun {
          0%   { transform: translateX(-350px) skewX(-5deg); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 0.65; }
          100% { transform: translateX(110vw) skewX(-8deg); opacity: 0; }
        }

        .ghost-caracal-body {
          position: relative;
          display: inline-block;
          animation: caracalRun 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* ── Image avec effet fantôme doré ── */
        .ghost-caracal-img {
          width: 260px !important;
          height: auto !important;
          filter:
            sepia(1)
            saturate(4)
            hue-rotate(5deg)
            brightness(1.8)
            drop-shadow(0 0 18px rgba(201,168,76,0.9))
            drop-shadow(0 0 35px rgba(201,168,76,0.5))
            drop-shadow(0 0 60px rgba(201,168,76,0.25));
          opacity: 0.82;
        }

        /* ── Poussière dorée ── */
        @keyframes dustFloat {
          0%   { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-80px) scale(0.2); opacity: 0; }
        }

        .dust-particle {
          position: absolute;
          bottom: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,220,80,1) 0%, rgba(201,168,76,0.6) 60%, transparent 100%);
          box-shadow: 0 0 8px rgba(201,168,76,0.8);
          animation: dustFloat 1.2s ease-out infinite;
        }

        /* ── Runes qui s'élèvent ── */
        @keyframes runeRise {
          0%   { transform: translateY(0) scale(0.5); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(-120px) scale(1.1); opacity: 0; }
        }

        .rune-float {
          position: absolute;
          font-size: 1.4rem;
          color: rgba(201, 168, 76, 0.95);
          text-shadow:
            0 0 8px rgba(201,168,76,1),
            0 0 20px rgba(255,220,80,0.7),
            0 0 40px rgba(201,168,76,0.4);
          animation: runeRise 1.8s ease-out forwards;
          pointer-events: none;
          font-family: serif;
        }

        /* ── Traînée lumineuse derrière le caracal ── */
        .ghost-caracal-body::after {
          content: '';
          position: absolute;
          top: 30%;
          left: -120px;
          width: 120px;
          height: 60%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(201,168,76,0.15),
            rgba(201,168,76,0.3)
          );
          filter: blur(12px);
          border-radius: 50%;
        }
      `}</style>
    </>
  );
}
