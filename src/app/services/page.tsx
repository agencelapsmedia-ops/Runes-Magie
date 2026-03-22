import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/data/services";
import { formatPrice } from "@/lib/utils";
import SectionTitle from "@/components/ui/SectionTitle";
import RuneDivider from "@/components/ui/RuneDivider";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Nos Services Mystiques | Runes & Magie",
  description:
    "Explorez nos services de lecture intuitive, tirage de tarot et runes, soins energetiques, deblocage emotionnel, cours de sorcellerie et ceremonies sacrees.",
};

export default function ServicesPage() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <SectionTitle
          title="Nos Services Mystiques"
          subtitle="Chaque soin est un rituel sacre"
          as="h1"
        />

        <RuneDivider className="my-12" />

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => (
            <article
              key={service.id}
              className="group bg-charbon-mystere border border-violet-royal/40 rounded-lg p-8 transition-all duration-500 hover:border-violet-mystique/70 hover:shadow-[0_0_30px_rgba(107,63,160,0.15)]"
            >
              {/* Rune Icon */}
              <div className="text-5xl mb-6 text-or-ancien opacity-80 group-hover:opacity-100 transition-opacity duration-300 select-none">
                {service.icon}
              </div>

              {/* Service Name */}
              <h2 className="font-cinzel text-2xl text-parchemin mb-3 group-hover:text-or-ancien transition-colors duration-300">
                {service.name}
              </h2>

              {/* Description */}
              <p className="text-parchemin-vieilli/80 leading-relaxed mb-6 font-cormorant text-lg">
                {service.description}
              </p>

              {/* Price & Duration */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-cinzel text-xl text-or-ancien font-semibold">
                  {typeof service.price === "number"
                    ? formatPrice(service.price)
                    : service.price}
                </span>
                <span className="text-parchemin-vieilli/50">|</span>
                <span className="text-parchemin-vieilli/70 text-sm">
                  {service.duration}
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-2 mb-8">
                {service.features.slice(0, 4).map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-parchemin-vieilli/70 text-sm"
                  >
                    <span className="text-turquoise-cristal mt-0.5 shrink-0">
                      &#10003;
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                href={`/services/${service.slug}`}
                variant="primary"
                size="md"
              >
                Reserver
              </Button>
            </article>
          ))}
        </div>

        <RuneDivider className="mt-16" symbols="&#5765; &#5765; &#5765;" />
      </div>
    </section>
  );
}
