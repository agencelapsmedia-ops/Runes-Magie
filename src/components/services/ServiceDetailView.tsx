import { formatPrice } from '@/lib/utils';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import type { Service } from '@/data/services';

export default function ServiceDetailView({ service }: { service: Service }) {
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
          <div className="text-7xl md:text-8xl text-or-ancien mb-8 animate-glow-pulse select-none">
            {service.icon}
          </div>
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold text-gradient-gold mb-6">
            {service.name}
          </h1>
          <div className="flex items-center justify-center gap-6 text-lg">
            <span className="font-cinzel text-2xl text-or-ancien font-semibold">
              {typeof service.price === 'number' ? formatPrice(service.price) : service.price}
            </span>
            <span className="text-parchemin-vieilli/40">&#9670;</span>
            <span className="text-parchemin-vieilli/80 font-philosopher">{service.duration}</span>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-16">
            <p className="text-parchemin-vieilli/90 text-lg md:text-xl leading-relaxed font-cormorant">
              {service.longDescription}
            </p>
          </div>

          <RuneDivider />

          <div className="my-16">
            <h2 className="font-cinzel text-2xl text-or-ancien mb-8 text-center">
              Ce que comprend ce service
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.features.map((feature, index) => (
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

          <RuneDivider symbols="&#10022; &#10022; &#10022;" />

          <div className="my-16 text-center">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">
              Prêt à commencer votre voyage&nbsp;?
            </h2>
            <p className="text-parchemin-vieilli/70 mb-8 font-philosopher text-lg">
              Réservez votre séance et laissez la magie opérer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button href="/reserver" variant="cta" size="lg">
                Réserver
              </Button>
              <a
                href="tel:+15143487705"
                className="inline-flex items-center gap-3 text-or-ancien hover:text-or-clair transition-colors font-cinzel text-sm tracking-wider"
              >
                <span className="text-lg">&#9742;</span>
                (514) 348-7705
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
