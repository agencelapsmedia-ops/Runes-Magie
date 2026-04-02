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

type CheckoutStep = 'cart' | 'info' | 'processing';

function PanierContent() {
  const { items, removeItem, updateQuantity, total, clearCart, hasEmailItems } = useCart();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup');
  const [customerInfo, setCustomerInfo] = useState({
    name: '', email: '', phone: '', message: '', shippingAddress: '',
  });
  const [orderResult, setOrderResult] = useState<{ type: string; orderNumber?: string } | null>(null);
  const [error, setError] = useState('');

  const success = searchParams.get('success') === 'true';
  const canceled = searchParams.get('canceled') === 'true';
  const orderNum = searchParams.get('order');

  async function handleCheckout() {
    setError('');
    if (!customerInfo.name || !customerInfo.email) {
      setError('Veuillez remplir votre nom et courriel.');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            checkoutType: item.checkoutType,
          })),
          customerInfo: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone || undefined,
            message: customerInfo.message || undefined,
            shippingAddress: deliveryMethod === 'shipping' ? customerInfo.shippingAddress : undefined,
          },
          deliveryMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors du traitement');
        setStep('info');
        setLoading(false);
        return;
      }

      if (data.type === 'stripe' && data.url) {
        window.location.href = data.url;
      } else if (data.type === 'email') {
        setOrderResult(data);
        clearCart();
        setStep('cart');
        setLoading(false);
      }
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.');
      setStep('info');
      setLoading(false);
    }
  }

  /* ── Success state (Stripe return) ── */
  if (success) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <span className="text-6xl block mb-6 select-none" style={{ color: '#C9A84C' }} aria-hidden="true">&#10024;</span>
          <SectionTitle title="Merci pour votre commande !" subtitle="Votre paiement a ete accepte avec succes" as="h1" />
          {orderNum && (
            <p className="mt-4 font-cinzel text-or-ancien text-xl">Commande #{orderNum}</p>
          )}
          <p className="mt-8 font-cormorant text-lg text-parchemin/70">
            Vous recevrez un courriel de confirmation sous peu. Que les runes vous accompagnent dans votre voyage.
          </p>
          <div className="mt-10">
            <Button href="/boutique" variant="primary">Continuer vos achats</Button>
          </div>
        </section>
      </main>
    );
  }

  /* ── Canceled state ── */
  if (canceled) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <span className="text-6xl block mb-6 select-none" style={{ color: '#C9A84C' }} aria-hidden="true">&#5848;</span>
          <SectionTitle title="Commande annulee" subtitle="Votre paiement a ete annule" as="h1" />
          <p className="mt-8 font-cormorant text-lg text-parchemin/70">
            Aucun montant n&apos;a ete preleve. Votre panier est toujours disponible.
          </p>
          <div className="mt-10">
            <Button href="/panier" variant="primary">Retourner au panier</Button>
          </div>
        </section>
      </main>
    );
  }

  /* ── Email order success ── */
  if (orderResult) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <span className="text-6xl block mb-6 select-none" style={{ color: '#C9A84C' }} aria-hidden="true">&#10024;</span>
          <SectionTitle title="Demande recue !" subtitle="Votre demande de soumission a ete envoyee" as="h1" />
          <p className="mt-4 font-cinzel text-or-ancien text-xl">Commande #{orderResult.orderNumber}</p>
          <p className="mt-8 font-cormorant text-lg text-parchemin/70">
            Noctura vous contactera tres bientot pour discuter des details et finaliser votre commande. Les etoiles veillent sur votre chemin...
          </p>
          <div className="mt-10">
            <Button href="/boutique" variant="primary">Continuer vos achats</Button>
          </div>
        </section>
      </main>
    );
  }

  /* ── Empty cart ── */
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-noir-nuit text-parchemin">
        <section className="py-24 md:py-32 max-w-3xl mx-auto px-6 text-center">
          <SectionTitle title="Votre Panier" as="h1" className="mb-12" />
          <span className="text-6xl block mb-6 select-none text-violet-mystique/50" aria-hidden="true">&#5765;</span>
          <p className="font-cormorant text-xl text-parchemin/60 mb-10">Votre panier est vide</p>
          <Button href="/boutique" variant="primary">Explorer la boutique</Button>
        </section>
      </main>
    );
  }

  /* ── Cart with items ── */
  return (
    <main className="min-h-screen bg-noir-nuit text-parchemin">
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-6">
        <SectionTitle title="Votre Panier" as="h1" className="mb-12" />

        {/* Cart table */}
        <div className="overflow-x-auto rounded-lg border border-violet-royal/30">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-violet-profond/80 border-b border-violet-royal/40">
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien">Produit</th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien text-center">Prix unitaire</th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien text-center">Quantite</th>
                <th className="px-6 py-4 font-cinzel text-sm uppercase tracking-wider text-or-ancien text-right">Total</th>
                <th className="px-4 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-charbon-mystere/60' : 'bg-violet-profond/20'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-violet-royal/20">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div>
                        <span className="font-cinzel text-sm text-parchemin">{item.name}</span>
                        {item.checkoutType === 'email' && (
                          <span className="block text-[0.65rem] text-amber-400/80 font-philosopher mt-0.5">Sur devis</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-cormorant text-lg text-parchemin/80 tabular-nums">
                    {item.checkoutType === 'email' ? <span className="text-amber-400/80 text-sm">A confirmer</span> : formatPrice(item.price)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 border border-violet-royal/30 rounded">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-parchemin/60 hover:text-parchemin hover:bg-violet-profond/40 transition-colors cursor-pointer">&minus;</button>
                      <span className="px-2 font-cinzel text-sm tabular-nums min-w-[2ch] text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-parchemin/60 hover:text-parchemin hover:bg-violet-profond/40 transition-colors cursor-pointer">+</button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-cormorant text-lg text-or-ancien tabular-nums">
                    {item.checkoutType === 'email' ? <span className="text-amber-400/80 text-sm">A confirmer</span> : formatPrice(item.price * item.quantity)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button type="button" onClick={() => removeItem(item.id)}
                      className="text-parchemin/40 hover:text-magenta-rituel transition-colors cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <RuneDivider className="my-10" />

        {/* Step: Cart totals + proceed */}
        {step === 'cart' && (
          <div className="flex flex-col items-end gap-6">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between font-cormorant text-lg">
                <span className="text-parchemin/70">Sous-total</span>
                <span className="text-or-ancien tabular-nums">{formatPrice(total)}</span>
              </div>
              {hasEmailItems && (
                <p className="text-amber-400/70 text-xs font-philosopher">* Certains produits sont sur devis — le prix final sera confirme par Noctura</p>
              )}
              <div className="flex justify-between font-cinzel text-xl border-t border-violet-royal/30 pt-3">
                <span className="text-parchemin">Total</span>
                <span className="text-or-clair tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <Button href="/boutique" variant="secondary" className="flex-1">Continuer les achats</Button>
              <button type="button" onClick={() => setStep('info')}
                className="flex-1 inline-flex items-center justify-center font-cinzel uppercase tracking-[0.15em] text-sm px-6 py-3 rounded-sm cursor-pointer bg-gradient-to-r from-magenta-rituel to-fuchsia-enchante text-blanc-lune border border-fuchsia-enchante/30 hover:shadow-[0_0_25px_rgba(196,29,110,0.5)] hover:border-fuchsia-enchante/60 active:scale-[0.98] transition-all duration-300">
                Passer a la caisse
              </button>
            </div>
          </div>
        )}

        {/* Step: Customer info form */}
        {step === 'info' && (
          <div className="max-w-lg mx-auto">
            {/* Order summary */}
            <div className="mb-8 p-4 rounded-sm border border-violet-royal/20 bg-charbon-mystere/30">
              <div className="flex justify-between font-cormorant text-lg mb-2">
                <span className="text-parchemin/70">Sous-total ({items.length} produit{items.length > 1 ? 's' : ''})</span>
                <span className="text-or-ancien tabular-nums">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between font-cinzel text-xl border-t border-violet-royal/20 pt-2">
                <span className="text-parchemin">Total</span>
                <span className="text-or-clair tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>

            <h2 className="font-cinzel-decorative text-2xl text-gradient-gold mb-6 text-center">Vos informations</h2>

            {/* Delivery method */}
            <div className="mb-6">
              <p className="text-parchemin-vieilli/60 text-xs font-philosopher uppercase tracking-wider mb-2">Mode de livraison</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeliveryMethod('pickup')}
                  className={`flex-1 px-4 py-3 rounded-sm border text-sm font-cinzel transition-all cursor-pointer ${
                    deliveryMethod === 'pickup'
                      ? 'border-or-ancien bg-or-ancien/10 text-or-ancien'
                      : 'border-violet-royal/20 text-parchemin-vieilli/60 hover:border-or-ancien/40'
                  }`}>
                  Ramassage en boutique
                  <span className="block text-xs font-philosopher mt-1 text-emerald-400/70">Gratuit</span>
                </button>
                <button type="button" onClick={() => setDeliveryMethod('shipping')}
                  className={`flex-1 px-4 py-3 rounded-sm border text-sm font-cinzel transition-all cursor-pointer ${
                    deliveryMethod === 'shipping'
                      ? 'border-or-ancien bg-or-ancien/10 text-or-ancien'
                      : 'border-violet-royal/20 text-parchemin-vieilli/60 hover:border-or-ancien/40'
                  }`}>
                  Livraison
                  <span className="block text-xs font-philosopher mt-1 text-parchemin-vieilli/50">Frais a confirmer</span>
                </button>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-philosopher text-parchemin-vieilli/70 mb-1">Nom complet *</label>
                <input type="text" required value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-charbon-mystere border border-violet-royal/20 text-parchemin placeholder:text-parchemin-vieilli/40 focus:outline-none focus:border-or-ancien/50 transition-all text-sm font-philosopher" placeholder="Votre nom" />
              </div>
              <div>
                <label className="block text-sm font-philosopher text-parchemin-vieilli/70 mb-1">Courriel *</label>
                <input type="email" required value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-charbon-mystere border border-violet-royal/20 text-parchemin placeholder:text-parchemin-vieilli/40 focus:outline-none focus:border-or-ancien/50 transition-all text-sm font-philosopher" placeholder="votre@courriel.com" />
              </div>
              <div>
                <label className="block text-sm font-philosopher text-parchemin-vieilli/70 mb-1">Telephone</label>
                <input type="tel" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-charbon-mystere border border-violet-royal/20 text-parchemin placeholder:text-parchemin-vieilli/40 focus:outline-none focus:border-or-ancien/50 transition-all text-sm font-philosopher" placeholder="(514) 555-1234" />
              </div>

              {deliveryMethod === 'shipping' && (
                <div>
                  <label className="block text-sm font-philosopher text-parchemin-vieilli/70 mb-1">Adresse de livraison</label>
                  <textarea rows={2} value={customerInfo.shippingAddress} onChange={(e) => setCustomerInfo({ ...customerInfo, shippingAddress: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-sm bg-charbon-mystere border border-violet-royal/20 text-parchemin placeholder:text-parchemin-vieilli/40 focus:outline-none focus:border-or-ancien/50 transition-all text-sm font-philosopher resize-none" placeholder="Adresse complete" />
                </div>
              )}

              {hasEmailItems && (
                <div>
                  <label className="block text-sm font-philosopher text-parchemin-vieilli/70 mb-1">Message (optionnel)</label>
                  <textarea rows={3} value={customerInfo.message} onChange={(e) => setCustomerInfo({ ...customerInfo, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-sm bg-charbon-mystere border border-violet-royal/20 text-parchemin placeholder:text-parchemin-vieilli/40 focus:outline-none focus:border-or-ancien/50 transition-all text-sm font-philosopher resize-none" placeholder="Precisions sur votre commande (taille, couleur, questions...)" />
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 text-magenta-rituel text-sm font-philosopher">{error}</p>
            )}

            {/* Info about checkout type */}
            {hasEmailItems && (
              <div className="mt-4 p-3 rounded-sm border border-amber-400/20 bg-amber-400/5">
                <p className="text-amber-400/80 text-xs font-philosopher">
                  Votre panier contient des produits dont le prix peut varier. Noctura vous contactera pour confirmer les details et finaliser votre commande.
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button type="button" onClick={() => setStep('cart')}
                className="flex-1 px-6 py-3 rounded-sm border border-violet-royal/30 text-parchemin font-cinzel text-sm uppercase tracking-wider hover:bg-violet-profond/30 transition-all cursor-pointer">
                Retour
              </button>
              <button type="button" onClick={handleCheckout} disabled={loading}
                className={`flex-1 inline-flex items-center justify-center font-cinzel uppercase tracking-[0.15em] text-sm px-6 py-3 rounded-sm cursor-pointer bg-gradient-to-r from-magenta-rituel to-fuchsia-enchante text-blanc-lune border border-fuchsia-enchante/30 hover:shadow-[0_0_25px_rgba(196,29,110,0.5)] hover:border-fuchsia-enchante/60 active:scale-[0.98] transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                {loading ? 'Traitement...' : hasEmailItems ? 'Envoyer la demande' : 'Payer maintenant'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-or-ancien/20 border-t-or-ancien rounded-full mx-auto mb-6" />
            <p className="font-cinzel text-parchemin text-lg">Traitement en cours...</p>
          </div>
        )}
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
