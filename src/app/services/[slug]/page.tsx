import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/data/services";
import { formatPrice } from "@/lib/utils";
import SectionTitle from "@/components/ui/SectionTitle";
import RuneDivider from "@/components/ui/RuneDivider";
import Button from "@/components/ui/Button";

export async function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    return { title: "Service introuvable | Runes & Magie" };
  }

  return {
    title: `${service.name} | Runes & Magie`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  // Related services (exclude current, take max 3)
  const relatedServices = services
    .filter((s) => s.id !== service.id)
    .slice(0, 3);

  return (
    <div>
      {/* Hero Banner */}
      <section
        className="relative py-20 md:py-32 px-4"
        style={{
          background:
            "linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 50%, var(--teal-profond) 100%)",
        }}
      >
        <div className="absolute inset-0 bg-noir-nuit/40" />
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Large Rune Icon */}
          <div className="text-7xl md:text-8xl text-or-ancien mb-8 animate-glow-pulse select-none">
            {service.icon}
          </div>

          {/* Service Name */}
          <h1 className="font-cinzel-decorative text-3xl md:text-5xl font-bold text-gradient-gold mb-6">
            {service.name}
          </h1>

          {/* Price & Duration */}
          <div className="flex items-center justify-center gap-6 text-lg">
            <span className="font-cinzel text-2xl text-or-ancien font-semibold">
              {typeof service.price === "number"
                ? formatPrice(service.price)
                : service.price}
            </span>
            <span className="text-parchemin-vieilli/40">&#9670;</span>
            <span className="text-parchemin-vieilli/80 font-philosopher">
              {service.duration}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Long Description */}
          <div className="mb-16">
            <p className="text-parchemin-vieilli/90 text-lg md:text-xl leading-relaxed font-cormorant">
              {service.longDescription}
            </p>
          </div>

          <RuneDivider />

          {/* Features List */}
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
                  <span className="text-or-ancien text-lg mt-0.5 shrink-0 select-none">
                    &#5765;
                  </span>
                  <span className="text-parchemin-vieilli/80">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <RuneDivider symbols="&#10022; &#10022; &#10022;" />

          {/* CTA Section */}
          <div className="my-16 text-center">
            <h2 className="font-cinzel text-2xl text-parchemin mb-4">
              Pret a commencer votre voyage?
            </h2>
            <p className="text-parchemin-vieilli/70 mb-8 font-philosopher text-lg">
              Reservez votre seance et laissez la magie operer.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button href="/reserver" variant="cta" size="lg">
                Reserver ce Service
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

          <RuneDivider />

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <div className="mt-16">
              <h2 className="font-cinzel text-2xl text-or-ancien mb-8 text-center">
                Autres services qui pourraient vous interesser
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedServices.map((related) => (
                  <Link
                    key={related.id}
                    href={`/services/${related.slug}`}
                    className="group bg-charbon-mystere border border-violet-royal/30 rounded-lg p-6 transition-all duration-300 hover:border-violet-mystique/60 hover:shadow-[0_0_20px_rgba(107,63,160,0.12)]"
                  >
                    <div className="text-3xl text-or-ancien/70 mb-4 group-hover:text-or-ancien transition-colors select-none">
                      {related.icon}
                    </div>
                    <h3 className="font-cinzel text-lg text-parchemin mb-2 group-hover:text-or-ancien transition-colors">
                      {related.name}
                    </h3>
                    <p className="text-parchemin-vieilli/60 text-sm line-clamp-2">
                      {related.description}
                    </p>
                    <p className="mt-3 font-cinzel text-sm text-or-ancien/80">
                      {typeof related.price === "number"
                        ? formatPrice(related.price)
                        : related.price}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
