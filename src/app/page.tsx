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
import OfferingGrid from '@/components/services/OfferingGrid';
import { getHomeSliders } from '@/lib/service-categories';

// Rendu toujours « live » (comme /seances et /ecole) : la page d'accueil
// reflète immédiatement la base de données — images, prix et liens des
// services restent à jour sans attendre un redéploiement.
export const dynamic = 'force-dynamic';

// NOTE : la section « Les Runes Vikings » (aperçu du Futhark) a été retirée de
// l'accueil et conservée en réserve dans
// src/components/home/RunesPreviewSection.tsx pour réutilisation future.

// Les sliders de l'accueil sont pilotés par les catégories de services cochées
// « afficher sur l'accueil » (gérées dans Gestion site web → Catégories de services).

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true, inStock: true },
    orderBy: { category: 'asc' },
    take: 8,
  });
  const sliderGroups = await getHomeSliders();
  return (
    <>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative -mt-18 lg:-mt-20">
        <HeroCarousel />
        <MistEffect />
      </section>

      {/* ═══════════════════ SERVICES ═══════════════════ */}
      <RuneDivider symbols="ᚨ ᛊ ᚹ" />

      {/* Conteneur élargi spécifiquement pour cette section : permet 4 cartes
          larges par rangée sans rétrécir les cartes. */}
      <section className="px-4 py-16 md:py-24 max-w-[1600px] mx-auto">
        <SectionTitle
          title="Nos Services Mystiques"
          subtitle="Guidance, soins et enseignements pour illuminer votre chemin"
        />

        <div className="mt-12">
          {sliderGroups.map((group) => (
            <OfferingGrid key={group.id} title={group.title} offerings={group.offerings} />
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
                src="/images/logo/logo-3d-gold.webp"
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
              sorcellerie depuis plus de vingt ans. Son chemin spirituel l&rsquo;a
              men&eacute;e &agrave; cr&eacute;er Runes &amp; Magie, un espace
              sacr&eacute; d&eacute;di&eacute; &agrave; l&rsquo;&eacute;veil
              mystique et &agrave; la gu&eacute;rison de l&rsquo;&acirc;me.
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

      <RuneDivider />
    </>
  );
}
