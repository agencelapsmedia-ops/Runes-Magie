'use client';

import { useState } from 'react';
import { LAUNCHER_IMG, FALLBACK_IMG, parseCards } from './types';
import ServiceCard from './ServiceCard';
import HumanHandoff from './HumanHandoff';

/** Bulle de Noctura : fond prune translucide, fine bordure dorée, mini-portrait. */
export default function AssistantMessage({ content }: { content: string }) {
  const [src, setSrc] = useState(LAUNCHER_IMG);
  const { text, slugs, handoff } = parseCards(content);

  return (
    <div className="flex items-end gap-2 pr-8">
      <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-or-ancien/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          onError={() => setSrc(FALLBACK_IMG)}
          className="h-full w-full scale-[1.08] object-cover"
          draggable={false}
        />
      </span>
      <div className="min-w-0 flex-1">
        {text && (
          <div
            className="inline-block max-w-full whitespace-pre-line rounded-2xl rounded-bl-md border border-or-ancien/25 px-4 py-2.5 font-cormorant text-base leading-relaxed text-parchemin"
            style={{ background: 'rgba(45, 27, 78, 0.55)' }}
          >
            {text}
          </div>
        )}
        {slugs.map((slug) => (
          <ServiceCard key={slug} slug={slug} />
        ))}
        {handoff && <HumanHandoff />}
      </div>
    </div>
  );
}
