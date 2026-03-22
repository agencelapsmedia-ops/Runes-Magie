'use client';

import Image from 'next/image';
import { useCart, type CartItem as CartItemType } from './CartProvider';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-3 py-4 border-b border-violet-royal/30 last:border-b-0">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gris-fumee">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-cinzel text-xs text-parchemin leading-tight truncate">
          {item.name}
        </h4>
        <p className="text-or-ancien text-sm mt-0.5">
          {formatPrice(item.price)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-gris-fumee text-parchemin hover:bg-violet-royal transition-colors text-sm cursor-pointer"
            aria-label="Diminuer la quantite"
          >
            &minus;
          </button>
          <span className="text-parchemin text-sm w-6 text-center tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center rounded bg-gris-fumee text-parchemin hover:bg-violet-royal transition-colors text-sm cursor-pointer"
            aria-label="Augmenter la quantite"
          >
            +
          </button>

          {/* Line total */}
          <span className="ml-auto text-or-clair text-sm font-cinzel tabular-nums">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeItem(item.id)}
        className="self-start text-gris-fumee hover:text-magenta-rituel transition-colors ml-1 cursor-pointer"
        aria-label={`Retirer ${item.name} du panier`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
