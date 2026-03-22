"use client";

import { useEffect, useState } from "react";

const RUNE_CHARS = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";

interface RuneParticle {
  id: number;
  char: string;
  left: number;       // percent
  delay: number;      // seconds
  duration: number;   // seconds
  size: number;       // rem
  opacity: number;
}

interface FloatingRunesProps {
  count?: number;
  className?: string;
}

export default function FloatingRunes({
  count = 20,
  className,
}: FloatingRunesProps) {
  const [runes, setRunes] = useState<RuneParticle[]>([]);

  useEffect(() => {
    const particles: RuneParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      char: RUNE_CHARS[Math.floor(Math.random() * RUNE_CHARS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 25,
      size: 0.8 + Math.random() * 1.4,
      opacity: 0.08 + Math.random() * 0.22,
    }));
    setRunes(particles);
  }, [count]);

  if (runes.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className ?? ""}`}
      aria-hidden="true"
    >
      {runes.map((rune) => (
        <span
          key={rune.id}
          className="absolute bottom-0 text-or-ancien"
          style={{
            left: `${rune.left}%`,
            fontSize: `${rune.size}rem`,
            animationName: "float-up",
            animationDuration: `${rune.duration}s`,
            animationDelay: `${rune.delay}s`,
            animationIterationCount: "infinite",
            animationTimingFunction: "linear",
            "--rune-opacity": rune.opacity,
          } as React.CSSProperties}
        >
          {rune.char}
        </span>
      ))}
    </div>
  );
}
