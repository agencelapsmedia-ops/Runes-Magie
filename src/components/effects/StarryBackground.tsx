"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  left: number;        // percent
  top: number;         // percent
  size: number;        // px
  delay: number;       // seconds
  duration: number;    // seconds
  baseOpacity: number;
}

interface StarryBackgroundProps {
  count?: number;
  className?: string;
}

export default function StarryBackground({
  count = 80,
  className,
}: StarryBackgroundProps) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generated: Star[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 6,
      duration: 2 + Math.random() * 4,
      baseOpacity: 0.15 + Math.random() * 0.45,
    }));
    setStars(generated);
  }, [count]);

  if (stars.length === 0) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 ${className ?? ""}`}
      aria-hidden="true"
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.id % 5 === 0
              ? "var(--turquoise-cristal)"
              : star.id % 7 === 0
                ? "var(--or-clair)"
                : "var(--blanc-lune)",
            opacity: star.baseOpacity,
            animationName: "twinkle",
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }}
        />
      ))}
    </div>
  );
}
