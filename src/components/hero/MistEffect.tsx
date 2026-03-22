'use client';

import { useEffect, useState } from 'react';

/**
 * Full-screen mist overlay that dissipates on mount, revealing the hero beneath.
 *
 * Architecture
 * ------------
 * Five semi-transparent fog layers at different speeds and directions give a
 * realistic depth effect. On mount the entire overlay fades out over ~3.5 s
 * with horizontal drift, after which it becomes invisible and non-interactive.
 *
 * A set of faint residual wisps (opacity 0.05) keeps floating permanently so
 * the hero never looks completely "static".
 */
export default function MistEffect() {
  const [dissipated, setDissipated] = useState(false);

  useEffect(() => {
    /* Start dissipation immediately; flag completion to enable pointer-events-none */
    const id = setTimeout(() => setDissipated(true), 4000);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {/* ---- Dissipating mist ---- */}
      <div
        aria-hidden="true"
        className={[
          'absolute inset-0 z-30 overflow-hidden',
          dissipated ? 'pointer-events-none' : '',
        ].join(' ')}
        style={{
          animation: 'mistDissipate 3.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Layer 1 — dense violet core */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(45,27,78,0.85) 0%, rgba(45,27,78,0.50) 40%, transparent 80%)',
            animation: 'mistLayerDrift1 3.5s ease-out forwards',
          }}
        />

        {/* Layer 2 — teal accent, offset left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 80% at 30% 55%, rgba(26,138,125,0.35) 0%, transparent 70%)',
            animation: 'mistLayerDrift2 3.8s ease-out forwards',
          }}
        />

        {/* Layer 3 — wide violet wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 150% 120% at 60% 40%, rgba(45,27,78,0.60) 0%, transparent 65%)',
            animation: 'mistLayerDrift3 3.2s ease-out forwards',
          }}
        />

        {/* Layer 4 — teal tendrils, bottom-right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 90% at 75% 70%, rgba(26,138,125,0.25) 0%, transparent 60%)',
            animation: 'mistLayerDrift4 4s ease-out forwards',
          }}
        />

        {/* Layer 5 — very dense centre blanket */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(45,27,78,0.90) 0%, rgba(10,10,18,0.70) 50%, transparent 85%)',
            animation: 'mistLayerDrift5 3.5s ease-out forwards',
          }}
        />
      </div>

      {/* ---- Residual wisps (permanent, very faint) ---- */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 140% 80% at 20% 60%, rgba(45,27,78,0.05) 0%, transparent 70%)',
            animation: 'wispFloat1 18s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 60% at 75% 40%, rgba(26,138,125,0.04) 0%, transparent 65%)',
            animation: 'wispFloat2 22s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 120% 70% at 50% 80%, rgba(45,27,78,0.04) 0%, transparent 60%)',
            animation: 'wispFloat3 25s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* ---- Keyframes ---- */}
      <style jsx global>{`
        /* === Master dissipation === */
        @keyframes mistDissipate {
          0% {
            opacity: 1;
          }
          60% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        /* === Individual layer drifts (different directions & speeds) === */
        @keyframes mistLayerDrift1 {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-8%) scale(1.15);
          }
        }

        @keyframes mistLayerDrift2 {
          0% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(12%) translateY(-5%) scale(1.2);
          }
        }

        @keyframes mistLayerDrift3 {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(6%) scale(1.25);
          }
        }

        @keyframes mistLayerDrift4 {
          0% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-10%) translateY(8%) scale(1.1);
          }
        }

        @keyframes mistLayerDrift5 {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.08);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        /* === Residual wisps (permanent, very low opacity) === */
        @keyframes wispFloat1 {
          0% {
            transform: translateX(0) scale(1);
          }
          100% {
            transform: translateX(5%) scale(1.08);
          }
        }

        @keyframes wispFloat2 {
          0% {
            transform: translateX(0) translateY(0);
          }
          100% {
            transform: translateX(-4%) translateY(3%);
          }
        }

        @keyframes wispFloat3 {
          0% {
            transform: translateX(0) scale(1);
          }
          100% {
            transform: translateX(3%) scale(1.05);
          }
        }
      `}</style>
    </>
  );
}
