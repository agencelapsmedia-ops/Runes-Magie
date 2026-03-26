'use client';

import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/utils';
import type { Category } from '@/data/products';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: Category;
}

const categoryLabels: Record<Category, string> = {
  cristaux: 'Pierres et Cristaux',
  runes: 'Runes',
  tarot: 'Tarot',
  'herbes-encens': 'Herbes & Encens',
  bougies: 'Bougies',
  bijoux: 'Bijoux',
  orgonites: 'Orgonites',
  'baguettes-magiques': 'Baguettes',
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

export default function ProductCard({
  id,
  name,
  price,
  image,
  category,
}: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <article
      className="group relative flex flex-col rounded-sm overflow-hidden
        bg-charbon-mystere border border-violet-royal/20
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-[0_8px_30px_rgba(107,63,160,0.25),0_0_15px_rgba(201,168,76,0.1)]
        hover:border-violet-royal/40"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gris-fumee">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-sm text-[0.65rem] font-cinzel uppercase tracking-wider ${categoryColors[category]}`}
        >
          {categoryLabels[category]}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-cinzel text-sm text-parchemin leading-snug line-clamp-2">
          {name}
        </h3>

        <p className="text-or-ancien font-cinzel text-lg mt-auto">
          {formatPrice(price)}
        </p>

        <button
          type="button"
          onClick={() => addItem({ id, name, price, image })}
          className="w-full inline-flex items-center justify-center font-cinzel uppercase tracking-[0.12em] text-xs
            px-4 py-2.5 rounded-sm cursor-pointer
            bg-gradient-to-r from-violet-royal to-violet-profond
            text-or-ancien border border-or-ancien/30
            hover:shadow-[0_0_20px_rgba(201,168,76,0.4),0_0_40px_rgba(201,168,76,0.15)]
            hover:border-or-ancien/60
            active:scale-[0.98] transition-all duration-300"
        >
          Ajouter au panier
        </button>
      </div>
    </article>
  );
}
