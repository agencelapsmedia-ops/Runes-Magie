'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type Category, type Product } from '@/data/products';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/utils';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/boutique/ProductCard';

const categoryLabels: Record<Category, string> = {
  cristaux: 'Cristaux',
  runes: 'Runes',
  tarot: 'Tarot',
  'herbes-encens': 'Herbes & Encens',
  bougies: 'Bougies',
  bijoux: 'Bijoux',
  orgonites: 'Orgonites',
  'baguettes-magiques': 'Baguettes Magiques',
};

const categoryColors: Record<Category, string> = {
  cristaux: 'bg-violet-mystique/80 text-blanc-lune',
  runes: 'bg-or-ancien/80 text-noir-nuit',
  tarot: 'bg-pourpre-sorciere/80 text-blanc-lune',
  'herbes-encens': 'bg-teal-magique/80 text-blanc-lune',
  bougies: 'bg-magenta-rituel/80 text-blanc-lune',
  bijoux: 'bg-or-clair/80 text-noir-nuit',
  orgonites: 'bg-turquoise-cristal/80 text-noir-nuit',
  'baguettes-magiques': 'bg-bronze-rune/80 text-blanc-lune',
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from database
  useEffect(() => {
    fetch('/api/public/products')
      .then((res) => res.json())
      .then((data: Product[]) => {
        const found = data.find((p) => p.slug === slug);
        setProduct(found || null);
        if (found) {
          setRelatedProducts(
            data.filter((p) => p.category === found.category && p.id !== found.id).slice(0, 4)
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <section className="px-4 py-12 md:py-20 max-w-7xl mx-auto text-center">
        <p className="text-5xl mb-4 animate-pulse">&#x2728;</p>
        <p className="font-cinzel text-parchemin text-lg">Chargement...</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="px-4 py-12 md:py-20 max-w-7xl mx-auto text-center">
        <p className="text-5xl mb-4">&#x2728;</p>
        <p className="font-cinzel text-parchemin text-lg">Produit introuvable</p>
        <Link href="/boutique" className="text-or-ancien hover:underline mt-4 inline-block font-philosopher">
          Retour a la boutique
        </Link>
      </section>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }
  };

  const cat = product.category as Category;

  return (
    <section className="px-4 py-12 md:py-20 max-w-7xl mx-auto">
      {/* ── Breadcrumb / Back link ─────────────────── */}
      <Link
        href="/boutique"
        className="inline-flex items-center gap-2 text-parchemin-vieilli/60 hover:text-or-ancien transition-colors duration-300 text-sm font-philosopher mb-8"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m15 19-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour &agrave; la Boutique
      </Link>

      {/* ── Product detail grid ────────────────────── */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left — images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-sm overflow-hidden border border-violet-royal/20 bg-gris-fumee">
            <Image
              src={product.images[activeImage] || product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 rounded-sm overflow-hidden border-2 transition-all duration-300 cursor-pointer
                    ${
                      activeImage === i
                        ? 'border-or-ancien shadow-[0_0_10px_rgba(201,168,76,0.3)]'
                        : 'border-violet-royal/20 opacity-60 hover:opacity-100'
                    }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - vue ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — info */}
        <div className="flex flex-col gap-5">
          {/* Category badge */}
          <span
            className={`self-start px-3 py-1 rounded-sm text-xs font-cinzel uppercase tracking-wider ${categoryColors[cat]}`}
          >
            {categoryLabels[cat]}
          </span>

          {/* Name */}
          <h1 className="font-cinzel-decorative text-3xl md:text-4xl font-bold text-gradient-gold leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-or-ancien font-cinzel text-3xl">
            {formatPrice(product.price)}
          </p>

          {/* Description */}
          <p className="text-parchemin-vieilli leading-relaxed font-philosopher text-lg whitespace-pre-line">
            {product.longDescription}
          </p>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-sm text-[0.65rem] font-cinzel uppercase tracking-wider
                    bg-violet-royal/15 text-parchemin-vieilli/70 border border-violet-royal/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stock indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                product.inStock ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-parchemin-vieilli/70 font-philosopher">
              {product.inStock ? 'En stock' : 'Rupture de stock'}
            </span>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {/* Quantity selector */}
            <div className="flex items-center border border-violet-royal/20 rounded-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2.5 text-parchemin hover:text-or-ancien transition-colors cursor-pointer"
                aria-label="Diminuer la quantit&eacute;"
              >
                &minus;
              </button>
              <span className="px-4 py-2.5 font-cinzel text-parchemin min-w-[3rem] text-center border-x border-violet-royal/20">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="px-3 py-2.5 text-parchemin hover:text-or-ancien transition-colors cursor-pointer"
                aria-label="Augmenter la quantit&eacute;"
              >
                +
              </button>
            </div>

            {/* Add to cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 inline-flex items-center justify-center font-cinzel uppercase tracking-[0.15em] text-sm
                px-8 py-3 rounded-sm cursor-pointer
                bg-gradient-to-r from-violet-royal to-violet-profond
                text-or-ancien border border-or-ancien/30
                hover:shadow-[0_0_20px_rgba(201,168,76,0.4),0_0_40px_rgba(201,168,76,0.15)]
                hover:border-or-ancien/60
                active:scale-[0.98] transition-all duration-300
                disabled:opacity-50 disabled:pointer-events-none"
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>

      {/* ── Related products ───────────────────────── */}
      {relatedProducts.length > 0 && (
        <>
          <RuneDivider className="mt-16 mb-8" />

          <SectionTitle
            title="Produits Similaires"
            subtitle={`D'autres tr\u00e9sors de la cat\u00e9gorie ${categoryLabels[cat]}`}
          />

          <div className="mt-8 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/boutique/${rp.slug}`}>
                <ProductCard
                  id={rp.id}
                  name={rp.name}
                  price={rp.price}
                  image={rp.image}
                  category={rp.category as Category}
                />
              </Link>
            ))}
          </div>
        </>
      )}

      <RuneDivider className="mt-16" />
    </section>
  );
}
