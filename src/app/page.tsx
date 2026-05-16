import Image from 'next/image';
import Link from 'next/link';
import HeroCarousel from '@/components/hero/HeroCarousel';
import MistEffect from '@/components/hero/MistEffect';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ProductCard from '@/components/boutique/ProductCard';
import Button from '@/components/ui/Button';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import { prisma } from '@/lib/db';
import { services } from '@/data/services';
import { formatPrice } from '@/lib/utils';

/* ── Elder Futhark — the three Aettir ──────────────────────── */
const aettir = [
  {
    name: "Aett de Freya",
    runes: [
      { char: 'ᚠ', name: 'Fehu' },
      { char: 'ᚢ', name: 'Uruz' },
      { char: 'ᚦ', name: 'Thurisaz' },
      { char: 'ᚨ', name: 'Ansuz' },
      { char: 'ᚱ', name: 'Raidho' },
      { char: 'ᚲ', name: 'Kenaz' },
      { char: 'ᚷ', name: 'Gebo' },
      { char: 'ᚹ', name: 'Wunjo' },
    ],
  },
  {
    name: "Aett de Heimdall",
    runes: [
      { char: 'ᚺ', name: 'Hagalaz' },
      { char: 'ᚾ', name: 'Nauthiz' },
      { char: 'ᛁ', name: 'Isa' },
      { char: 'ᛃ', name: 'Jera' },
      { char: 'ᛇ', name: 'Eihwaz' },
      { char: 'ᛈ', name: 'Perthro' },
      { char: 'ᛉ', name: 'Algiz' },
      { char: 'ᛊ', name: 'Sowilo' },
    ],
  },
  {
    name: "Aett de Tyr",
    runes: [
      { char: 'ᛏ', name: 'Tiwaz' },
      { char: 'ᛒ', name: 'Berkano' },
      { char: 'ᛖ', name: 'Ehwaz' },
      { char: 'ᛗ', name: 'Mannaz' },
      { char: 'ᛚ', name: 'Laguz' },
      { char: 'ᛜ', name: 'Ingwaz' },
      { char: 'ᛞ', name: 'Dagaz' },
      { char: 'ᛟ', name: 'Othala' },
    ],
  },
];

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true, inStock: true },
    orderBy: { category: 'asc' },
    take: 8,
  });
  return (
    <>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative -mt-18 lg:-mt-20">
        <HeroCarousel />
        <MistEffect />
      </section>

      {/* ═══════════════════ SERVICES ═══════════════════ */}
      <RuneDivider symbols="ᚨ ᛊ ᚹ" />

      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <SectionTitle
          title="Nos Services Mystiques"
          subtitle="Guidance, soins et enseignements pour illuminer votre chemin"
        />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group relative flex flex-col rounded-sm overflow-hidden
                bg-charbon-mystere border border-violet-royal/20
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_8px_30px_rgba(107,63,160,0.25),0_0_15px_rgba(201,168,76,0.1)]
                hover:border-violet-royal/40"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gris-fumee">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Rune icon overlay */}
                <span className="absolute top-3 right-3 text-3xl text-or-ancien drop-shadow-[0_0_8px_rgba(201,168,76,0.6)]">
                  {service.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 gap-3">
                <h3 className="font-cinzel text-lg text-parchemin leading-snug">
                  {service.name}
                </h3>
                <p className="text-parchemin-vieilli text-sm leading-relaxed line-clamp-3 flex-1">
                  {service.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-violet-royal/15">
                  <span className="text-or-ancien font-cinzel text-base">
                    {typeof service.price === 'number'
                      ? formatPrice(service.price)
                      : service.price}
                  </span>
                  <span className="text-parchemin-vieilli text-xs">
                    {service.duration}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURED PRODUCTS ═══════════════════ */}
      <RuneDivider symbols="ᛈ ᛉ ᛊ" />

      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <SectionTitle
          title="Produits Enchant&eacute;s"
          subtitle="Une s&eacute;lection d'objets magiques choisis pour vous"
        />

        <div className="mt-12 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/boutique/${product.slug}`}>
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image ?? '/images/placeholder.jpg'}
                category={product.category as import('@/data/products').Category}
                checkoutType={(product.checkoutType as 'stripe' | 'email') ?? 'stripe'}
              />
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="secondary" size="lg" href="/boutique">
            Voir toute la Boutique
          </Button>
        </div>
      </section>

      {/* === SOINS HOLISTIQUES === */}
      <RuneDivider symbols="ᚨ ᛟ ᚢ" />
      <section style={{ background: 'linear-gradient(135deg, var(--violet-profond) 0%, var(--charbon-mystere) 50%, var(--noir-nuit) 100%)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--or-ancien)', letterSpacing: '0.3em', fontSize: '0.8rem', marginBottom: '16px', opacity: 0.8 }}>
            ᚷ SOINS ÉNERGÉTIQUES EN LIGNE ᚷ
          </p>
          <h2 style={{ fontFamily: 'var(--font-cinzel-decorative)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', background: 'linear-gradient(135deg, var(--or-ancien), var(--or-clair))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px' }}>
            Consultations Holistiques
          </h2>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', color: 'var(--parchemin-vieilli)', fontSize: '1.2rem', lineHeight: 1.8, marginBottom: '48px', maxWidth: '650px', margin: '0 auto 48px' }}>
            Connectez-vous avec des praticiens certifiés pour des soins énergétiques, du Reiki, de la naturopathie et bien plus — en ligne, depuis chez vous.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginBottom: '48px' }}>
            {[
              { rune: 'ᚱ', label: 'Reiki', desc: 'Soin énergétique' },
              { rune: 'ᛏ', label: 'Naturopathie', desc: 'Santé naturelle' },
              { rune: 'ᛟ', label: 'Coaching Spirituel', desc: 'Éveil & transformation' },
              { rune: 'ᚨ', label: 'Cristallothérapie', desc: 'Soin par les pierres' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center', padding: '24px', background: 'rgba(46,196,182,0.05)', border: '1px solid rgba(46,196,182,0.2)', borderRadius: '12px', minWidth: '160px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px', color: 'var(--or-ancien)' }}>{item.rune}</div>
                <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--parchemin)', fontSize: '0.85rem', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--parchemin-vieilli)', fontSize: '0.9rem', fontStyle: 'italic' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/soins" style={{ display: 'inline-block', padding: '14px 36px', background: 'linear-gradient(135deg, var(--violet-royal), var(--violet-profond))', color: 'var(--or-clair)', fontFamily: 'var(--font-cinzel)', fontSize: '0.9rem', letterSpacing: '0.15em', border: '1px solid var(--or-ancien)', borderRadius: '4px', textDecoration: 'none', boxShadow: '0 0 20px rgba(201,168,76,0.2)' }}>
            Découvrir les Soins Holistiques →
          </Link>
        </div>
      </section>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <RuneDivider symbols="ᚹ ᛟ ᚱ" />

      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left — image */}
          <div className="relative max-w-md mx-auto lg:max-w-none rounded-lg overflow-hidden border-2 border-or-ancien/60 shadow-[0_0_25px_rgba(201,168,76,0.3),0_0_50px_rgba(201,168,76,0.1)]">
            <Image
              src="/images/about/noctura-anna.jpg"
              alt="Noctura Anna, votre sorcière"
              width={2312}
              height={1042}
              className="w-full h-auto brightness-110 contrast-110 saturate-110"
              priority
            />
            {/* Vignette mystique — assombrit les bords */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 35%, rgba(10,10,18,0.55) 100%)',
              }}
            />
            {/* Gradient bas pour fondu */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, rgba(10,10,18,0.7), transparent)',
              }}
            />
          </div>

          {/* Right — text */}
          <div className="flex flex-col gap-6">
            <div className="flex justify-start lg:justify-start mb-2">
              <Image
                src="/images/logo/logo-3d-gold.png"
                alt="Logo Runes & Magie"
                width={300}
                height={300}
                className="object-contain drop-shadow-[0_0_20px_rgba(201,168,76,0.5)]"
              />
            </div>
            <SectionTitle
              title="Votre Sorci&egrave;re &mdash; Noctura Anna"
              className="text-left lg:text-left"
              as="h2"
            />
            <p className="text-parchemin-vieilli leading-relaxed text-lg font-philosopher">
              Praticienne des arts ancestraux, Noctura Anna canalise la sagesse
              des runes vikings, la magie des cristaux et les traditions de
              sorcellerie depuis plus de vingt ans. Son chemin spirituel l'a
              men&eacute;e &agrave; cr&eacute;er Runes &amp; Magie, un espace
              sacr&eacute; d&eacute;di&eacute; &agrave; l'&eacute;veil
              mystique et &agrave; la gu&eacute;rison de l'&acirc;me.
            </p>
            <p className="text-parchemin-vieilli/80 leading-relaxed font-philosopher">
              &Agrave; travers ses lectures intuitives, ses soins
              &eacute;nerg&eacute;tiques et ses enseignements, elle guide
              chaque &acirc;me vers sa v&eacute;rit&eacute;
              int&eacute;rieure avec bienveillance et puissance.
            </p>
            <div className="mt-2">
              <Button variant="primary" size="lg" href="/a-propos">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <RuneDivider symbols="ᚷ ᛗ ᛊ" />

      <TestimonialsSection />

      {/* ═══════════════════ RUNES PREVIEW ═══════════════════ */}
      <RuneDivider symbols="ᚠ ᚦ ᛏ" />

      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto">
        <SectionTitle
          title="Les Runes Vikings"
          subtitle="L'alphabet sacr&eacute; de l'ancien Futhark"
        />

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {aettir.map((aett) => (
            <div
              key={aett.name}
              className="rounded-sm border border-violet-royal/20 bg-charbon-mystere p-6 text-center"
            >
              <h3 className="font-cinzel text-or-ancien text-lg mb-6">
                {aett.name}
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {aett.runes.map((rune) => (
                  <div
                    key={rune.name}
                    className="flex flex-col items-center gap-1 w-12"
                    title={rune.name}
                  >
                    <span className="text-3xl text-parchemin drop-shadow-[0_0_6px_rgba(201,168,76,0.3)]">
                      {rune.char}
                    </span>
                    <span className="text-[0.6rem] text-parchemin-vieilli/60 font-cinzel">
                      {rune.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="secondary" size="lg" href="/runes-vikings">
            Explorer les Runes
          </Button>
        </div>
      </section>

      <RuneDivider />
    </>
  );
}
