'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import SectionTitle from '@/components/ui/SectionTitle';
import RuneDivider from '@/components/ui/RuneDivider';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useState, Suspense } from 'react';

function PanierContent() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently handle — user can retry
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------------
     Success state
     ---------------------------------------------------------------- */
  if (success) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <span
            className="text-6xl block mb-6 select-none"
            style={{ color: '#C9A84C' }}
            aria-hidden="true"
          >
            ᚷ
          </span>
          <SectionTitle
            title="Merci pour votre commande !"
            subtitle="Votre paiement a ete accepte avec succes"
            as="h1"
          />
          <p className="mt-8 font-cormorant text-lg text-parchemin/70">
            Vous recevrez un courriel de confirmation sous peu. Que les runes
            vous accompagnent dans votre voyage.
          </p>
          <div className="mt-10">
            <Button href="/boutique" variant="primary">
              Continuer vos achats
            </Button>
          </div>
        </section>
      </main>
    );
  }

  /* ----------------------------------------------------------------
     Canceled state
     ---------------------------------------------------------------- */
  if (canceled) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <span
            className="text-6xl block mb-6 select-none"
            style={{ color: '#C9A84C' }}
            aria-hidden="true"
          >
            ᚾ
          </span>
          <SectionTitle
            title="Commande annulee"
            subtitle="Votre paiement a ete annule"
            as="h1"
          />
          <p className="mt-8 font-cormorant text-lg text-parchemin/70">
            Aucun montant n'a ete preleve. Votre panier est toujours
            disponible.
          </p>
          <div className="mt-10">
            <Button href="/panier" variant="primary">
              Retourner au panier
            </Button>
          </div>
        </section>
      </main>
    );
  }

  /* ----------------------------------------------------------------
     Empty cart
     ---------------------------------------------------------------- */
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <SectionTitle title="Votre Panier" as="h1" className="mb-12" />

          <span
            className="text-6xl block mb-6 select-none text-violet-mystique/50"
            aria-hidden="true"
          >
            &#5765;
          </span>
          <p className="font-cormorant text-xl text-parchemin/60 mb-10">
            Votre panier est vide
          </p>
          <Button href="/boutique" variant="primary">
            Explorer la boutique
          </Button>
        </section>
      </main>
    );
  }

  /* ----------------------------------------------------------------
     Cart with items
     ---------------------------------------------------------------- */
  return (
    <main className="min-h-screen bg-noir-nuit text-parchemin">
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6">
        <SectionTitle title="Votre Panier" as="h1" className="mb-12" />

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-violet-royal/30">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-violet-profond/80 border-b border-violet-royal/40">
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien">
                  Produit
                </th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien text-center">
                  Prix unitaire
                </th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien text-center">
                  Quantite
                </th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien text-right">
                  Total
                </th>
                <th className="px-4 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className={
                    i % 2 === 0
                      ? 'bg-charbon-mystere/60'
                      : 'bg-violet-profond/20'
                  }
                >
                  {/* Product: image + name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-violet-royal/20">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <span className="font-cinzel text-sm text-parchemin">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Unit price */}
                  <td className="px-6 py-4 text-center font-cormorant text-lg text-parchemin/80 tabular-nums">
                    {formatPrice(item.price)}
                  </td>

                  {/* Quantity selector */}
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 border border-violet-royal/30 rounded">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="px-3 py-1 text-parchemin/60 hover:text-parchemin hover:bg-violet-profond/40 transition-colors cursor-pointer"
                        aria-label="Reduire la quantite"
                      >
                        &minus;
                      </button>
                      <span className="px-2 font-cinzel text-sm tabular-nums min-w-[2ch] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="px-3 py-1 text-parchemin/60 hover:text-parchemin hover:bg-violet-profond/40 transition-colors cursor-pointer"
                        aria-label="Augmenter la quantite"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Row total */}
                  <td className="px-6 py-4 text-right font-cormorant text-lg text-or-ancien tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </td>

                  {/* Remove */}
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-parchemin/40 hover:text-magenta-rituel transition-colors cursor-pointer"
                      aria-label={`Retirer ${item.name} du panier`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <RuneDivider className="my-10" />

        {/* Totals & CTAs */}
        <div className="flex flex-col items-end gap-6">
          <div className="w-full max-w-sm space-y-3">
            {/* Sous-total */}
            <div className="flex justify-between font-cormorant text-lg">
              <span className="text-parchemin/70">Sous-total</span>
              <span className="text-or-ancien tabular-nums">
                {formatPrice(total)}
              </span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-cinzel text-xl border-t border-violet-royal/30 pt-3">
              <span className="text-parchemin">Total</span>
              <span className="text-or-clair tabular-nums">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button href="/boutique" variant="secondary" className="flex-1">
              Continuer les achats
            </Button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className={`flex-1 inline-flex items-center justify-center font-cinzel uppercase tracking-[0.15em] text-sm
                px-6 py-3 rounded-sm cursor-pointer
                bg-gradient-to-r from-magenta-rituel to-fuchsia-enchante
                text-blanc-lune border border-fuchsia-enchante/30
                hover:shadow-[0_0_25px_rgba(196,29,110,0.5),0_0_50px_rgba(196,29,110,0.2)]
                hover:border-fuchsia-enchante/60
                active:scale-[0.98] transition-all duration-300
                ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {loading ? 'Traitement...' : 'Passer a la caisse'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PanierPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-or-ancien text-2xl font-cinzel">Chargement...</span></div>}>
      <PanierContent />
    </Suspense>
  );
}
