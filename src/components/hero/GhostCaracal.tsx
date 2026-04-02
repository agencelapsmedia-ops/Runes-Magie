'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const RUNE_PARTICLES = [
  { char: 'ᚠ', x: 10,  y: -55,  delay: 0.1  },
  { char: 'ᚨ', x: 60,  y: -85,  delay: 0.25 },
  { char: 'ᛏ', x: 120, y: -45,  delay: 0.4  },
  { char: 'ᚷ', x: 30,  y: -105, delay: 0.15 },
  { char: 'ᛟ', x: 80,  y: -125, delay: 0.55 },
  { char: 'ᚱ', x: -15, y: -75,  delay: 0.3  },
  { char: 'ᛉ', x: 150, y: -65,  delay: 0.45 },
  { char: 'ᚹ', x: 50,  y: -140, delay: 0.2  },
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
    const t = setTimeout(() => setIsPlaying(false), 3500);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!isPlaying) return null;

  return (
    <>
      {/* Inject CSS animation globally */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes caracalRun {
          0%   { transform: translateX(-350px); opacity: 0; }
          8%   { opacity: 0.85; }
          88%  { opacity: 0.7; }
          100% { transform: translateX(110vw); opacity: 0; }
        }
        @keyframes runeRise {
          0%   { transform: translateY(0px) scale(0.5); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateY(-130px) scale(1.1); opacity: 0; }
        }
        @keyframes dustUp {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-90px) scale(0.1); opacity: 0; }
        }
        .caracal-ghost-body {
          animation: caracalRun 3.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .rune-particle-anim {
          animation: runeRise 2s ease-out forwards;
        }
        .dust-anim {
          animation: dustUp 1.4s ease-out infinite;
        }
      ` }} />

      {/* Fixed overlay couvrant tout l'écran */}
      <div
        key={key}
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: '16%',
          left: 0,
          width: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        <div className="caracal-ghost-body" style={{ display: 'inline-block', position: 'relative' }}>

          {/* Image du caracal avec filtre doré fantôme */}
          <Image
            src="/images/logo/logo-3d-gold.png"
            alt=""
            width={280}
            height={280}
            unoptimized
            style={{
              width: '260px',
              height: 'auto',
              filter: `
                sepia(1) saturate(5) hue-rotate(5deg) brightness(2)
                drop-shadow(0 0 15px rgba(201,168,76,1))
                drop-shadow(0 0 35px rgba(201,168,76,0.7))
                drop-shadow(0 0 60px rgba(255,200,50,0.4))
              `,
              opacity: 0.85,
            }}
          />

          {/* Traînée lumineuse */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '-100px',
            width: '100px',
            height: '55%',
            background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.08), rgba(201,168,76,0.25))',
            filter: 'blur(14px)',
            borderRadius: '50%',
          }} />

          {/* Poussière d'or */}
          {[...Array(10)].map((_, i) => (
            <span
              key={i}
              className="dust-anim"
              style={{
                position: 'absolute',
                bottom: `${5 + (i % 3) * 8}px`,
                left: `${-10 + i * 18}px`,
                width: `${4 + (i % 3) * 3}px`,
                height: `${4 + (i % 3) * 3}px`,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,220,80,1) 0%, rgba(201,168,76,0.5) 70%, transparent 100%)',
                boxShadow: '0 0 8px rgba(201,168,76,0.9)',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}

          {/* Runes flottantes */}
          {RUNE_PARTICLES.map((rune, i) => (
            <span
              key={i}
              className="rune-particle-anim"
              style={{
                position: 'absolute',
                left: `${rune.x}px`,
                top: `${rune.y}px`,
                fontSize: '1.5rem',
                color: 'rgba(201,168,76,0.95)',
                textShadow: '0 0 10px rgba(201,168,76,1), 0 0 25px rgba(255,220,80,0.8), 0 0 45px rgba(201,168,76,0.5)',
                animationDelay: `${rune.delay}s`,
                fontFamily: 'serif',
                pointerEvents: 'none',
              }}
            >
              {rune.char}
            </span>
          ))}

        </div>
      </div>
    </>
  );
}
