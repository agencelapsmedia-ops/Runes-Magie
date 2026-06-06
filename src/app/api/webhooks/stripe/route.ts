import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendOrderConfirmationEmail, sendOrderAdminNotification } from "@/lib/order-email";
import { grantEntitlementsForOrder } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      // No webhook secret configured — parse the event directly (dev mode)
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        // Récupère la facture PDF générée par Stripe (invoice_creation activé au checkout).
        let invoiceUrl: string | null = null;
        let invoiceNumber: string | null = null;
        if (session.invoice) {
          try {
            const invoiceId =
              typeof session.invoice === "string" ? session.invoice : session.invoice.id;
            const invoice = await stripe.invoices.retrieve(invoiceId);
            invoiceUrl = invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null;
            invoiceNumber = invoice.number ?? null;
          } catch (err) {
            console.error("Impossible de récupérer la facture Stripe:", err);
          }
        }

        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            stripePaymentId: session.payment_intent as string,
            paidAt: new Date(),
            ...(invoiceUrl ? { invoiceUrl } : {}),
            ...(invoiceNumber ? { invoiceNumber } : {}),
          },
          include: { items: true },
        });

        // Octroie l'accès aux cours/ebooks achetés (no-op si commande sans compte).
        try {
          const granted = await grantEntitlementsForOrder(order.id);
          if (granted > 0) {
            console.log(`Order ${order.orderNumber}: ${granted} accès membre octroyé(s)`);
          }
        } catch (err) {
          console.error("Octroi d'accès membre échoué:", err);
        }

        // Send confirmation emails
        const emailData = {
          orderNumber: order.orderNumber,
          type: order.type,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerMessage: order.customerMessage,
          deliveryMethod: order.deliveryMethod,
          shippingAddress: order.shippingAddress,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          total: order.total,
          items: order.items.map((i) => ({
            productName: i.productName,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        };

        await Promise.all([
          sendOrderConfirmationEmail(emailData),
          sendOrderAdminNotification(emailData),
        ]);

        console.log(`Order ${order.orderNumber} marked as paid`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
