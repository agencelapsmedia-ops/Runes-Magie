'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import OfferingCard from './OfferingCard';
import type { OfferingView } from '@/lib/offerings';

/**
 * Slider horizontal de services (style des cartes conservé).
 * Embla gère le glissement tactile (mobile) et le cliquer-glisser à la
 * souris (desktop). Les flèches complètent. Un suivi manuel de la distance
 * du pointeur empêche le clic sur une carte si on était en train de glisser.
 */
export default function OfferingSlider({
  title,
  offerings,
}: {
  title: string;
  offerings: OfferingView[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    // Appel initial différé (évite un setState synchrone dans l'effet).
    const raf = requestAnimationFrame(onSelect);
    return () => {
      cancelAnimationFrame(raf);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Anti-clic pendant glissement : on mesure le déplacement du pointeur.
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    startXRef.current = e.clientX;
  }, []);
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (Math.abs(e.clientX - startXRef.current) > 8) draggingRef.current = true;
  }, []);
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (draggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (offerings.length === 0) return null;

  return (
    <div className="mb-14">
      {/* Titre + flèches */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <h3 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">{title}</h3>
        <div className="flex gap-2 shrink-0">
          <SliderArrow direction="prev" onClick={() => emblaApi?.scrollPrev()} disabled={!canPrev} />
          <SliderArrow direction="next" onClick={() => emblaApi?.scrollNext()} disabled={!canNext} />
        </div>
      </div>

      {/* Viewport Embla */}
      <div
        className="overflow-hidden"
        ref={emblaRef}
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onClickCapture={handleClickCapture}
      >
        <div className="flex gap-6 cursor-grab active:cursor-grabbing">
          {offerings.map((o) => (
            <div key={o.slug} className="shrink-0 grow-0 basis-[85%] sm:basis-[46%] lg:basis-[31.5%]">
              <OfferingCard offering={o} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Précédent' : 'Suivant'}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-or-ancien/40 text-or-ancien transition-all duration-300 hover:border-or-ancien hover:bg-or-ancien/10 hover:shadow-[0_0_15px_rgba(201,168,76,0.25)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {direction === 'prev' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}
