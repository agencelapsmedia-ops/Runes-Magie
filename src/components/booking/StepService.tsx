'use client';

import { useEffect, useState } from 'react';
import type { BookingService } from './BookingWizard';

interface Props {
  selected: BookingService | null;
  onSelect: (service: BookingService) => void;
}

export default function StepService({ selected, onSelect }: Props) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/services')
      .then((r) => r.json())
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block text-4xl animate-glow-pulse text-or-ancien select-none">*</div>
        <p className="mt-4 text-parchemin-vieilli/60 font-philosopher italic">
          Chargement des services...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-cinzel-decorative text-2xl md:text-3xl text-gradient-gold">
          Choisissez votre seance
        </h2>
        <p className="mt-3 text-parchemin-vieilli/70 font-philosopher italic">
          Selectionnez le service qui resonne avec votre ame
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={`group relative text-left p-6 rounded-sm border transition-all duration-300 ${
              selected?.id === service.id
                ? 'border-or-ancien/60 bg-violet-royal/20'
                : 'border-violet-royal/20 bg-charbon-mystere hover:border-violet-royal/40'
            }`}
            style={{
              boxShadow:
                selected?.id === service.id
                  ? `0 0 20px ${service.colorHex}30, 0 0 40px ${service.colorHex}10`
                  : undefined,
            }}
            onMouseEnter={(e) => {
              if (selected?.id !== service.id) {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  `0 0 15px ${service.colorHex}20`;
              }
            }}
            onMouseLeave={(e) => {
              if (selected?.id !== service.id) {
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }
            }}
          >
            {/* Emoji */}
            <span className="text-3xl block mb-3 select-none">{service.emoji}</span>

            {/* Name */}
            <h3 className="font-cinzel text-lg text-parchemin group-hover:text-or-ancien transition-colors">
              {service.name}
            </h3>

            {/* Description */}
            <p className="mt-2 text-sm text-parchemin-vieilli/60 line-clamp-2 font-cormorant">
              {service.description}
            </p>

            {/* Duration + Price */}
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-parchemin-vieilli/50">
                {service.durationMinutes} min
              </span>
              {service.price && (
                <>
                  <span className="text-violet-royal/30">|</span>
                  <span className="text-or-ancien font-cinzel">
                    {service.price.toFixed(2).replace('.', ',')} $
                  </span>
                </>
              )}
            </div>

            {/* Color indicator */}
            <div
              className="absolute top-4 right-4 w-3 h-3 rounded-full opacity-60"
              style={{ backgroundColor: service.colorHex }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
