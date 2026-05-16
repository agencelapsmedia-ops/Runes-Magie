import { Resend } from "resend";
import { ORDER_STATUSES, DELIVERY_METHODS, type OrderStatus } from "@/lib/order-utils";
import { formatPrice } from "@/lib/utils";

// Re-export pour permettre l'import depuis @/lib/order-email (pratique en routes API)
export type { OrderStatus };

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || "Runes & Magie <noreply@runesetmagie.com>";

interface OrderEmailData {
  orderNumber: string;
  type: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerMessage?: string | null;
  deliveryMethod: string;
  shippingAddress?: string | null;
  subtotal: number;
  shippingCost?: number | null;
  total: number;
  items: {
    productName: string;
    price: number;
    quantity: number;
    image?: string | null;
  }[];
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0A0A12;color:#F5F0E8;font-family:Georgia,serif;"><div style="max-width:600px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><h1 style="color:#C9A84C;font-size:28px;margin:0;letter-spacing:2px;">Runes & Magie</h1><p style="color:rgba(245,240,232,0.5);font-size:12px;margin:4px 0 0;letter-spacing:3px;">BOUTIQUE-ECOLE DE SORCELLERIE</p></div><div style="background:#1A1A2E;border:1px solid rgba(74,45,122,0.4);border-radius:8px;padding:32px;">${content}</div><div style="text-align:center;margin-top:32px;color:rgba(245,240,232,0.4);font-size:13px;"><p>Runes & Magie - Annabelle Dionne, Guide Spirituelle</p><p style="font-size:11px;">www.runesetmagie.ca</p></div></div></body></html>`;
}

function itemsTable(items: OrderEmailData["items"]): string {
  const rows = items.map(item =>
    `<tr><td style="padding:8px;border-bottom:1px solid rgba(107,63,160,0.2);color:#E8DCC8;">${item.productName}</td><td style="padding:8px;border-bottom:1px solid rgba(107,63,160,0.2);color:#E8DCC8;text-align:center;">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid rgba(107,63,160,0.2);color:#C9A84C;text-align:right;">${formatPrice(item.price)}</td></tr>`
  ).join('');
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr><th style="padding:8px;border-bottom:2px solid rgba(107,63,160,0.3);color:#C9A84C;text-align:left;font-size:12px;letter-spacing:1px;">PRODUIT</th><th style="padding:8px;border-bottom:2px solid rgba(107,63,160,0.3);color:#C9A84C;text-align:center;font-size:12px;letter-spacing:1px;">QTE</th><th style="padding:8px;border-bottom:2px solid rgba(107,63,160,0.3);color:#C9A84C;text-align:right;font-size:12px;letter-spacing:1px;">PRIX</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const deliveryLabel = DELIVERY_METHODS[data.deliveryMethod as keyof typeof DELIVERY_METHODS] || data.deliveryMethod;
  const isEmail = data.type === 'email';

  const messageBlock = isEmail
    ? `<p style="color:#F5F0E8;margin-top:16px;">Nous avons bien recu votre demande de soumission. Annabelle vous contactera tres bientot pour discuter des details et finaliser votre commande.</p><p style="color:#E8DCC8;font-style:italic;">Les etoiles veillent sur votre chemin...</p>`
    : `<p style="color:#F5F0E8;margin-top:16px;">Votre paiement a ete recu avec succes. Votre commande est en cours de preparation.</p>`;

  const html = baseTemplate(
    `<h2 style="color:#C9A84C;margin-top:0;">Chere ame, votre commande a ete recue &#10024;</h2>` +
    `<p style="color:#F5F0E8;">Bonjour ${data.customerName},</p>` +
    `<div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:6px;padding:16px;margin:16px 0;">` +
    `<p style="margin:4px 0;color:#C9A84C;font-size:18px;"><strong>Commande #${data.orderNumber}</strong></p>` +
    `<p style="margin:4px 0;color:#E8DCC8;">${deliveryLabel}</p>` +
    `</div>` +
    itemsTable(data.items) +
    `<div style="text-align:right;margin-top:8px;">` +
    `<p style="margin:4px 0;color:#E8DCC8;">Sous-total: ${formatPrice(data.subtotal)}</p>` +
    (data.shippingCost ? `<p style="margin:4px 0;color:#E8DCC8;">Livraison: ${formatPrice(data.shippingCost)}</p>` : '') +
    (data.deliveryMethod === 'shipping' && !data.shippingCost ? `<p style="margin:4px 0;color:#E8DCC8;font-style:italic;">Livraison: a confirmer</p>` : '') +
    `<p style="margin:8px 0 0;color:#C9A84C;font-size:20px;"><strong>Total: ${formatPrice(data.total)}</strong></p>` +
    `</div>` +
    messageBlock
  );

  if (!resend) {
    console.log("[Email] Order confirmation to:", data.customerEmail, "Order:", data.orderNumber);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Commande #${data.orderNumber} | Runes & Magie`,
    html,
  });
}

export async function sendOrderAdminNotification(data: OrderEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const deliveryLabel = DELIVERY_METHODS[data.deliveryMethod as keyof typeof DELIVERY_METHODS] || data.deliveryMethod;
  const typeLabel = data.type === 'stripe' ? 'Paiement Stripe' : 'Demande de soumission (APPELER LE CLIENT)';

  const html = baseTemplate(
    `<h2 style="color:#C9A84C;margin-top:0;">Nouvelle commande &#128230;</h2>` +
    `<div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:16px 0;">` +
    `<p style="margin:4px 0;color:#C9A84C;font-size:18px;"><strong>#${data.orderNumber}</strong></p>` +
    `<p style="margin:4px 0;color:#E8DCC8;"><strong>Type:</strong> ${typeLabel}</p>` +
    `<p style="margin:4px 0;color:#E8DCC8;"><strong>Client:</strong> ${data.customerName}</p>` +
    `<p style="margin:4px 0;color:#E8DCC8;"><strong>Courriel:</strong> ${data.customerEmail}</p>` +
    (data.customerPhone ? `<p style="margin:4px 0;color:#E8DCC8;"><strong>Telephone:</strong> ${data.customerPhone}</p>` : '') +
    `<p style="margin:4px 0;color:#E8DCC8;"><strong>Livraison:</strong> ${deliveryLabel}</p>` +
    (data.shippingAddress ? `<p style="margin:4px 0;color:#E8DCC8;"><strong>Adresse:</strong> ${data.shippingAddress}</p>` : '') +
    `</div>` +
    (data.customerMessage ? `<div style="background:rgba(201,168,76,0.1);border-left:3px solid #C9A84C;padding:12px 16px;margin:16px 0;"><p style="margin:0;color:#E8DCC8;font-style:italic;">"${data.customerMessage}"</p></div>` : '') +
    itemsTable(data.items) +
    `<div style="text-align:right;margin-top:8px;">` +
    `<p style="margin:8px 0 0;color:#C9A84C;font-size:20px;"><strong>Total: ${formatPrice(data.total)}</strong></p>` +
    `</div>`
  );

  if (!resend) {
    console.log("[Email] Admin order notification:", data.orderNumber);
    return;
  }

  const urgency = data.type === 'email' ? ' - APPELER LE CLIENT' : '';
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Commande #${data.orderNumber}${urgency} | Runes & Magie`,
    html,
  });
}

export async function sendOrderStatusEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  newStatus: OrderStatus,
) {
  const statusInfo = ORDER_STATUSES[newStatus];

  const statusMessages: Record<OrderStatus, string> = {
    new: "Votre commande a ete recue et est en attente de traitement.",
    contacted: "Nous vous avons contacte concernant votre commande. Consultez vos courriels ou votre telephone.",
    confirmed: "Votre commande a ete confirmee et est en cours de preparation.",
    paid: "Votre paiement a ete recu. Merci!",
    shipped: "Votre commande a ete expediee! Elle est en route vers vous.",
    completed: "Votre commande est terminee. Merci pour votre confiance!",
    cancelled: "Votre commande a ete annulee. Contactez-nous si vous avez des questions.",
  };

  const html = baseTemplate(
    `<h2 style="color:#C9A84C;margin-top:0;">Mise a jour de votre commande &#10024;</h2>` +
    `<p style="color:#F5F0E8;">Bonjour ${customerName},</p>` +
    `<div style="background:rgba(107,63,160,0.15);border:1px solid rgba(107,63,160,0.3);border-radius:6px;padding:20px;margin:16px 0;text-align:center;">` +
    `<p style="margin:0;color:#E8DCC8;font-size:14px;">Commande <strong style="color:#C9A84C;">#${orderNumber}</strong></p>` +
    `<p style="margin:12px 0 0;color:#C9A84C;font-size:24px;letter-spacing:2px;"><strong>${statusInfo.label}</strong></p>` +
    `</div>` +
    `<p style="color:#F5F0E8;">${statusMessages[newStatus]}</p>` +
    `<p style="color:#E8DCC8;font-style:italic;margin-top:24px;">Les etoiles veillent sur votre chemin...</p>`
  );

  if (!resend) {
    console.log("[Email] Status update to:", customerEmail, "Status:", newStatus);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Commande #${orderNumber} - ${statusInfo.label} | Runes & Magie`,
    html,
  });
}
