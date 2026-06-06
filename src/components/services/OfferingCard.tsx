import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import type { OfferingView } from '@/lib/offerings';

export default function OfferingCard({ offering }: { offering: OfferingView }) {
  return (
    <div className="group flex flex-col bg-charbon-mystere border border-violet-royal/40 rounded-lg p-8 transition-all duration-500 hover:border-violet-mystique/70 hover:shadow-[0_0_30px_rgba(107,63,160,0.15)]">
      {/* Zone cliquable → page détail */}
      <Link href={offering.detailHref} className="block flex-1">
        {offering.imageUrl ? (
          <div className="relative mb-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-violet-royal/30">
              <Image
                src={offering.imageUrl}
                alt={offering.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized={offering.imageUrl.includes('supabase.co')}
              />
            </div>
            {/* Rune / emoji superposée en haut de la photo — grande et dorée */}
            {offering.emoji && offering.emoji !== '*' && (
              <span
                aria-hidden
                className="absolute top-3 left-4 text-5xl text-or-ancien select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
              >
                {offering.emoji}
              </span>
            )}
            {offering.isFormation && (
              <span className="absolute top-3 right-3 font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 bg-charbon-mystere/80 text-turquoise-cristal whitespace-nowrap backdrop-blur-sm">
                Formation{offering.sessionsLabel ? ` · ${offering.sessionsLabel}` : ''}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between mb-6">
            <div className="text-5xl text-or-ancien opacity-80 group-hover:opacity-100 transition-opacity duration-300 select-none">
              {offering.emoji}
            </div>
            {offering.isFormation && (
              <span className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 text-turquoise-cristal whitespace-nowrap">
                Formation{offering.sessionsLabel ? ` · ${offering.sessionsLabel}` : ''}
              </span>
            )}
          </div>
        )}

        <h2 className="font-cinzel text-2xl text-parchemin mb-2 group-hover:text-or-ancien transition-colors duration-300">
          {offering.name}
        </h2>
        <p className="font-philosopher text-xs text-parchemin/50 mb-4">avec {offering.practitionerName}</p>

        <p className="text-parchemin-vieilli/80 leading-relaxed mb-6 font-cormorant text-lg">
          {offering.description}
        </p>

        <div className="flex items-center gap-4 mb-4">
          <span className="font-cinzel text-xl text-or-ancien font-semibold">{offering.priceLabel}</span>
          <span className="text-parchemin-vieilli/50">|</span>
          <span className="text-parchemin-vieilli/70 text-sm">{offering.durationLabel}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {offering.modes.map((m) => (
            <span
              key={m}
              className="font-cinzel text-[0.65rem] uppercase tracking-widest px-2 py-1 rounded-full border border-violet-royal/30 text-parchemin/60"
            >
              {m === 'IN_PERSON' ? 'Présentiel' : 'Virtuel'}
            </span>
          ))}
        </div>
      </Link>

      {/* Bouton doré « Réserver » → page de réservation */}
      <Button href={offering.bookingHref} variant="or" size="md" className="mt-6 w-full">
        Réserver
      </Button>
    </div>
  );
}
