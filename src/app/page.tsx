import Image from 'next/image';
import Link from 'next/link';
import HeroCompact from '@/components/hero/HeroCompact';
import MistEffect from '@/components/hero/MistEffect';
import HomeTileGrid from '@/components/home/HomeTileGrid';
import BoutonTelechargerApp from '@/components/pwa/BoutonTelechargerApp';
import BoutiqueBand from '@/components/home/BoutiqueBand';
import { getHomeTiles } from '@/lib/home-tiles';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import ProductCard from '@/components/boutique/ProductCard';
import Button from '@/components/ui/Button';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import { prisma } from '@/lib/db';
import OfferingGrid from '@/components/services/OfferingGrid';
import { getHomeSliders } from '@/lib/service-categories';

// ISR : la page d'accueil est mise en cache et régénérée en arrière-plan au plus
// toutes les 5 minutes. On garde donc la fraîcheur (images/prix/services à jour
// sans redéploiement) MAIS on sert une page déjà rendue → FCP/LCP bien plus rapides
// qu'avec `force-dynamic` (qui refaisait 2 requêtes DB à chaque visite).
export const revalidate = 300;

// NOTE : la section « Les Runes Vikings » (aperçu du Futhark) a été retirée de
// l'accueil et conservée en réserve dans
// src/components/home/RunesPreviewSection.tsx pour réutilisation future.

// Les sliders de l'accueil sont pilotés par les catégories de services cochées
// « afficher sur l'accueil » (gérées dans Gestion site web → Catégories de services).

export default async function HomePage() {
  // Catégories masquées (isActive=false) → leurs produits sont exclus de l'accueil,
  // comme sur la boutique. Synchronisé sur la même source.
  const inactiveCategories = await prisma.category.findMany({
    where: { isActive: false },
    select: { slug: true },
  });
  const inactiveSlugs = inactiveCategories.map((c) => c.slug);

  const featuredProducts = await prisma.product.findMany({
    where: {
      featured: true,
      inStock: true,
      ...(inactiveSlugs.length ? { category: { notIn: inactiveSlugs } } : {}),
    },
    orderBy: { category: 'asc' },
    take: 8,
  });
  const sliderGroups = await getHomeSliders();
  const { cartes, bande } = await getHomeTiles();
  return (
    <>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative -mt-18 lg:-mt-20">
        <HeroCompact />
        <MistEffect />
      </section>

      {/* ═══════════════════ GRILLE « APPLICATION » ═══════════════════
          Neuf destinations lisibles d'un coup d'œil, remplaçant les deux
          boutons du hero. Contenu piloté depuis /admin/site/tuiles. */}
      <section className="relative z-10 -mt-6 pb-4 lg:-mt-10">
        {/* Bouton « Télécharger l'application » (PWA) : posé au-dessus de la
            grille plutôt que dans le hero — les tuiles remontent sur le hero
            par la marge négative ci-dessus, et un bouton dans le hero entrait
            en collision avec elles. Ici, il bouge AVEC la grille : collision
            impossible, à toutes les largeurs. Rendu nul quand le navigateur
            n'offre pas l'installation → aucun espace résiduel (les marges
            vivent sur le composant via className). */}
        <BoutonTelechargerApp className="px-4 pb-6 pt-1 lg:pb-8" />
        <HomeTileGrid tuiles={cartes} />
        {bande && <BoutiqueBand tuile={bande} />}
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
              sizes="(max-width: 1024px) 100vw, 600px"
              className="w-full h-auto brightness-110 contrast-110 saturate-110"
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
