'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from './CartProvider';
import CartItemComponent from './CartItem';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, itemCount, total, isOpen, setIsOpen } = useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-noir-nuit/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col
          bg-charbon-mystere border-l border-violet-royal/40
          shadow-[−4px_0_30px_rgba(107,63,160,0.2)]
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-violet-royal/30">
          <h2 className="font-cinzel text-lg text-parchemin tracking-wide">
            Votre Panier
            {itemCount > 0 && (
              <span className="ml-2 text-sm text-or-ancien">
                ({itemCount})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-parchemin/60 hover:text-parchemin transition-colors cursor-pointer"
            aria-label="Fermer le panier"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              {/* Rune icon */}
              <span className="text-5xl text-violet-mystique/50 select-none" aria-hidden="true">
                &#5765;
              </span>
              <p className="font-cormorant text-lg text-parchemin/60">
                Votre panier est vide
              </p>
              <Link
                href="/boutique"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center font-cinzel uppercase tracking-[0.15em] text-sm
                  px-6 py-3 rounded-sm
                  bg-gradient-to-r from-violet-royal to-violet-profond
                  text-or-ancien border border-or-ancien/30
                  hover:shadow-[0_0_20px_rgba(201,168,76,0.4),0_0_40px_rgba(201,168,76,0.15)]
                  hover:border-or-ancien/60 transition-all duration-300"
              >
                Explorer la boutique
              </Link>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <CartItemComponent key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="border-t border-violet-royal/30 px-6 py-5 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between font-cormorant text-base">
              <span className="text-parchemin/70">Sous-total</span>
              <span className="text-or-ancien tabular-nums">{formatPrice(total)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-cinzel text-lg">
              <span className="text-parchemin">Total</span>
              <span className="text-or-clair tabular-nums">{formatPrice(total)}</span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/panier';
              }}
              className="w-full inline-flex items-center justify-center font-cinzel uppercase tracking-[0.15em] text-sm
                px-6 py-3.5 rounded-sm cursor-pointer
                bg-gradient-to-r from-magenta-rituel to-fuchsia-enchante
                text-blanc-lune border border-fuchsia-enchante/30
                hover:shadow-[0_0_25px_rgba(196,29,110,0.5),0_0_50px_rgba(196,29,110,0.2)]
                hover:border-fuchsia-enchante/60
                active:scale-[0.98] transition-all duration-300"
            >
              Passer a la caisse
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
