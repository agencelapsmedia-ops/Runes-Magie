import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { generateOrderNumber } from "@/lib/order-utils";
import { sendOrderConfirmationEmail, sendOrderAdminNotification } from "@/lib/order-email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  checkoutType: "stripe" | "email";
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  shippingAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerInfo, deliveryMethod = "pickup" } = body as {
      items: CheckoutItem[];
      customerInfo?: CustomerInfo;
      deliveryMethod?: "pickup" | "shipping";
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Le panier est vide" }, { status: 400 });
    }

    // Verify prices against database
    const productIds = items.map((i) => i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const verifiedItems = items.map((item) => {
      const dbProduct = dbProducts.find((p) => p.id === item.id);
      return {
        ...item,
        price: dbProduct ? dbProduct.price : item.price,
        checkoutType: dbProduct ? (dbProduct.checkoutType as "stripe" | "email") : (item.checkoutType || "stripe"),
      };
    });

    const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderNumber = await generateOrderNumber();
    const hasEmailItems = verifiedItems.some((i) => i.checkoutType === "email");

    if (hasEmailItems) {
      // ── EMAIL ORDER FLOW ──
      if (!customerInfo?.name || !customerInfo?.email) {
        return NextResponse.json({ error: "Nom et courriel requis" }, { status: 400 });
      }

      const order = await prisma.order.create({
        data: {
          orderNumber,
          type: "email",
          status: "new",
          deliveryMethod,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone || null,
          customerMessage: customerInfo.message || null,
          shippingAddress: customerInfo.shippingAddress || null,
          subtotal,
          total: subtotal,
          items: {
            create: verifiedItems.map((item) => ({
              productId: item.id,
              productName: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || null,
            })),
          },
        },
        include: { items: true },
      });

      const emailData = {
        orderNumber: order.orderNumber, type: order.type,
        customerName: order.customerName, customerEmail: order.customerEmail,
        customerPhone: order.customerPhone, customerMessage: order.customerMessage,
        deliveryMethod: order.deliveryMethod, shippingAddress: order.shippingAddress,
        subtotal: order.subtotal, shippingCost: order.shippingCost, total: order.total,
        items: order.items.map((i) => ({ productName: i.productName, price: i.price, quantity: i.quantity, image: i.image })),
      };

      await Promise.all([sendOrderConfirmationEmail(emailData), sendOrderAdminNotification(emailData)]);

      return NextResponse.json({ success: true, type: "email", orderNumber: order.orderNumber });
    } else {
      // ── STRIPE CHECKOUT FLOW ──
      const customerName = customerInfo?.name || "Client";
      const customerEmail = customerInfo?.email || "";

      // Create order in DB first
      const order = await prisma.order.create({
        data: {
          orderNumber,
          type: "stripe",
          status: "new",
          deliveryMethod,
          customerName,
          customerEmail,
          customerPhone: customerInfo?.phone || null,
          shippingAddress: customerInfo?.shippingAddress || null,
          subtotal,
          total: subtotal,
          items: {
            create: verifiedItems.map((item) => ({
              productId: item.id,
              productName: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || null,
            })),
          },
        },
      });

      // Create Stripe session
      const successUrl = "https://www.runesetmagie.ca/panier?success=true&order=" + order.orderNumber;
      const cancelUrl = "https://www.runesetmagie.ca/panier?canceled=true";

      const sessionConfig: Record<string, unknown> = {
        line_items: verifiedItems.map((item) => ({
          price_data: {
            currency: "cad",
            product_data: { name: item.name },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      };

      if (customerEmail) {
        sessionConfig.customer_email = customerEmail;
      }

      const session = await stripe.checkout.sessions.create(
        sessionConfig as Stripe.Checkout.SessionCreateParams
      );

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return NextResponse.json({ success: true, type: "stripe", url: session.url });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Checkout error:", message);
    return NextResponse.json({ error: "Erreur: " + message }, { status: 500 });
  }
}
