import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatPrice } from '@/lib/utils';
import { MembreHeader, ComingSoon } from '@/components/membre/MembrePage';

const STATUS_LABELS: Record<string, { label: string; color: string; border: string; bg: string }> = {
  new: { label: 'En traitement', color: '#d4a017', border: 'rgba(201,168,76,0.35)', bg: 'rgba(201,168,76,0.12)' },
  contacted: { label: 'Contactée', color: '#d4a017', border: 'rgba(201,168,76,0.35)', bg: 'rgba(201,168,76,0.12)' },
  confirmed: { label: 'Confirmée', color: 'var(--turquoise-cristal)', border: 'rgba(46,196,182,0.35)', bg: 'rgba(46,196,182,0.1)' },
  paid: { label: 'Payée', color: '#4ade80', border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.1)' },
  shipped: { label: 'Expédiée', color: '#c084fc', border: 'rgba(168,85,247,0.3)', bg: 'rgba(168,85,247,0.1)' },
  completed: { label: 'Terminée', color: '#4ade80', border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.1)' },
  cancelled: { label: 'Annulée', color: '#f87171', border: 'rgba(196,29,110,0.3)', bg: 'rgba(196,29,110,0.1)' },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.new;
  return (
    <span
      className="inline-block rounded-full px-3 py-1 font-cinzel text-[0.62rem] uppercase tracking-widest"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

export default async function AchatsPage() {
  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const member = sessionUserId
    ? await prisma.holisticUser.findUnique({
        where: { id: sessionUserId },
        select: { id: true, email: true },
      })
    : null;

  const orders = member
    ? await prisma.order.findMany({
        where: { OR: [{ userId: member.id }, { customerEmail: member.email }] },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <div>
      <MembreHeader
        emoji="🛒"
        title="Achats & factures"
        subtitle="Votre historique de commandes et vos factures PDF"
      />

      {orders.length === 0 ? (
        <ComingSoon message="Vous n'avez pas encore passé de commande.">
          <Link
            href="/boutique"
            className="inline-flex items-center font-cinzel text-xs uppercase tracking-widest text-turquoise-cristal transition-colors duration-200 hover:text-or-ancien"
          >
            Découvrir la boutique →
          </Link>
        </ComingSoon>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-sm border p-5 sm:p-6"
              style={{ background: 'var(--charbon-mystere)', borderColor: 'rgba(74, 45, 122, 0.3)' }}
            >
              {/* En-tête de commande */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4"
                style={{ borderColor: 'rgba(74, 45, 122, 0.2)' }}>
                <div>
                  <p className="font-cinzel text-xs uppercase tracking-widest text-parchemin">
                    Commande {order.orderNumber}
                  </p>
                  <p className="mt-1 font-cormorant text-base text-parchemin/45">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <span className="font-cinzel text-sm text-or-ancien">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Articles */}
              <ul className="mt-4 flex flex-col gap-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 font-cormorant text-base text-parchemin/70"
                  >
                    <span>
                      {item.productName}
                      {item.quantity > 1 && (
                        <span className="text-parchemin/40"> × {item.quantity}</span>
                      )}
                    </span>
                    <span className="whitespace-nowrap text-parchemin/45">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Facture */}
              {order.invoiceUrl && (
                <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(74, 45, 122, 0.2)' }}>
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-cinzel text-[0.68rem] uppercase tracking-widest text-turquoise-cristal transition-colors duration-200 hover:text-or-ancien"
                    style={{ borderColor: 'rgba(46, 196, 182, 0.35)' }}
                  >
                    <span aria-hidden>⬇</span>
                    Télécharger la facture
                    {order.invoiceNumber && (
                      <span className="text-parchemin/40">({order.invoiceNumber})</span>
                    )}
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
