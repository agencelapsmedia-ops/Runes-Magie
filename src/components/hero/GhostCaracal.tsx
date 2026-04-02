'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const RUNES = [
  { char: 'ᚠ', x:  10, y: -55,  delay: 0.10 },
  { char: 'ᚨ', x:  65, y: -90,  delay: 0.25 },
  { char: 'ᛏ', x: 125, y: -45,  delay: 0.40 },
  { char: 'ᚷ', x:  35, y: -110, delay: 0.15 },
  { char: 'ᛟ', x:  85, y: -130, delay: 0.55 },
  { char: 'ᚱ', x: -15, y: -75,  delay: 0.30 },
  { char: 'ᛉ', x: 155, y: -65,  delay: 0.45 },
  { char: 'ᚹ', x:  50, y: -148, delay: 0.20 },
];

export default function GhostCaracal({ trigger }: { trigger: number }) {
  const [visible, setVisible] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(false);
    // petit délai pour forcer le re-mount et relancer l'animation
    const t1 = setTimeout(() => {
      setInstanceKey((k) => k + 1);
      setVisible(true);
    }, 20);
    const t2 = setTimeout(() => setVisible(false), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      key={instanceKey}
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: '14%',
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Corps qui traverse l'écran */}
      <div className="caracal-body" style={{ position: 'relative', display: 'inline-block' }}>

        {/* Image dorée fantôme */}
        <Image
          src="/images/logo/logo-3d-gold.png"
          alt=""
          width={260}
          height={260}
          unoptimized
          style={{
            width: '260px',
            height: 'auto',
            opacity: 0.88,
            filter: [
              'sepia(1)',
              'saturate(5)',
              'hue-rotate(5deg)',
              'brightness(2)',
              'drop-shadow(0 0 14px rgba(201,168,76,1))',
              'drop-shadow(0 0 32px rgba(201,168,76,0.7))',
              'drop-shadow(0 0 60px rgba(255,200,50,0.35))',
            ].join(' '),
          }}
        />

        {/* Traînée lumineuse */}
        <div style={{
          position: 'absolute',
          top: '28%',
          left: '-110px',
          width: '110px',
          height: '55%',
          background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.1), rgba(201,168,76,0.28))',
          filter: 'blur(14px)',
          borderRadius: '50%',
        }} />

        {/* Poussière d'or */}
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="caracal-dust"
            style={{
              position: 'absolute',
              bottom: `${4 + (i % 3) * 7}px`,
              left: `${-8 + i * 19}px`,
              width:  `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,220,80,1) 0%, rgba(201,168,76,0.5) 70%, transparent 100%)',
              boxShadow: '0 0 8px rgba(201,168,76,0.9)',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}

        {/* Runes flottantes */}
        {RUNES.map((r, i) => (
          <span
            key={i}
            className="caracal-rune"
            style={{
              position: 'absolute',
              left: `${r.x}px`,
              top:  `${r.y}px`,
              fontSize: '1.5rem',
              color: 'rgba(201,168,76,0.95)',
              textShadow: '0 0 10px rgba(201,168,76,1), 0 0 25px rgba(255,220,80,0.8)',
              animationDelay: `${r.delay}s`,
              fontFamily: 'serif',
            }}
          >
            {r.char}
          </span>
        ))}
      </div>
    </div>
  );
}
