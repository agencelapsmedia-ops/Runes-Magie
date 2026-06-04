import Image from 'next/image';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import type { OfferingView } from '@/lib/offerings';

export default function OfferingDetailView({ offering }: { offering: OfferingView }) {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative py-20 md:py-32 px-4"
        style={{
          background:
            'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 50%, var(--teal-profond) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-noir-nuit/40" />
        <div className="relative max-w-4xl mx-auto text-center">
          {offering.isFormation && (
            <span className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-turquoise-cristal/40 text-turquoise-cristal">
              Formation{offering.sessionsLabel ? ` · ${offering.sessionsLabel}` : ''}
            </span>
          )}
          {offering.imageUrl ? (
            <div className="relative mx-auto mt-8 mb-6 h-44 w-44 md:h-56 md:w-56 overflow-hidden rounded-2xl border-2 border-or-ancien/40 shadow-[0_0_40px_rgba(201,168,76,0.25)]">
              <Image
                src={offering.imageUrl}
                alt={offering.name}
                fill
                sizes="224px"
                className="object-cover"
                unoptimized={offering.imageUrl.includes('supabase.co')}
              />
            </div>
          ) : (
            <div className="text-7xl md:text-8xl text-or-ancien mt-8 mb-6 animate-glow-pulse select-none">
              {offering.emoji}
            </div>
          )}
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold text-gradient-gold mb-4">
            {offering.name}
          </h1>
          <p className="font-philosopher text-parchemin/70 mb-6">avec {offering.practitionerName}</p>
          <div className="flex items-center justify-center gap-6 text-lg">
            <span className="font-cinzel text-2xl text-or-ancien font-semibold">{offering.priceLabel}</span>
            <span className="text-parchemin-vieilli/40">&#9670;</span>
            <span className="text-parchemin-vieilli/80 font-philosopher">{offering.durationLabel}</span>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-parchemin-vieilli/90 text-lg md:text-xl leading-relaxed font-cormorant whitespace-pre-line">
              {offering.longDescription}
            </p>
          </div>

          {offering.features.length > 0 && (
            <>
              <RuneDivider />
              <div className="my-16">
                <h2 className="font-cinzel text-2xl text-or-ancien mb-8 text-center">
                  Ce que comprend ce service
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offering.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 bg-charbon-mystere/50 border border-violet-royal/20 rounded-lg p-4"
                    >
                      <span className="text-or-ancien text-lg mt-0.5 shrink-0 select-none">&#5765;</span>
                      <span className="text-parchemin-vieilli/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <RuneDivider symbols="&#10022; &#10022; &#10022;" />

          <div className="my-16 text-center">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">Prêt à réserver&nbsp;?</h2>
            <p className="text-parchemin-vieilli/70 mb-8 font-philosopher text-lg">
              Choisissez votre moment et réservez en ligne.
            </p>
            <Button href={offering.bookingHref} variant="cta" size="lg">
              Réserver
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
