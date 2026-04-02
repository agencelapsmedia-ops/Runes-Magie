import { prisma } from '@/lib/db';

export const ORDER_STATUSES = {
  new: { label: 'Nouvelle', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contactee', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmee', color: 'bg-indigo-100 text-indigo-800' },
  paid: { label: 'Payee', color: 'bg-emerald-100 text-emerald-800' },
  shipped: { label: 'Expediee', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Terminee', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulee', color: 'bg-red-100 text-red-800' },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export const DELIVERY_METHODS = {
  pickup: 'Ramassage en boutique',
  shipping: 'Livraison',
} as const;

export const ORDER_TYPES = {
  stripe: 'Paiement en ligne',
  email: 'Demande de soumission',
} as const;

export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let orderNumber: string;
  let exists = true;

  while (exists) {
    const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    orderNumber = `RM-${date}-${rand}`;
    const existing = await prisma.order.findUnique({ where: { orderNumber } });
    exists = !!existing;
  }

  return orderNumber!;
}
