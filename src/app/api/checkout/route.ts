import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { generateOrderNumber } from "@/lib/order-utils";
import { sendOrderConfirmationEmail, sendOrderAdminNotification } from "@/lib/order-email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

    // Verify prices against database (anti-fraud)
    const productIds = items.map((i) => i.id);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const verifiedItems = items.map((item) => {
      const dbProduct = dbProducts.find((p) => p.id === item.id);
      return {
        ...item,
        price: dbProduct ? dbProduct.price : item.price,
        checkoutType: dbProduct ? (dbProduct.checkoutType as "stripe" | "email") : item.checkoutType,
      };
    });

    const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal; // Shipping costs added later by admin

    const orderNumber = await generateOrderNumber();
    const hasEmailItems = verifiedItems.some((i) => i.checkoutType === "email");

    if (hasEmailItems || customerInfo) {
      // ── EMAIL ORDER FLOW ──
      if (!customerInfo?.name || !customerInfo?.email) {
        return NextResponse.json(
          { error: "Nom et courriel requis pour ce type de commande" },
          { status: 400 }
        );
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
          total,
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

      // Send emails
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

      return NextResponse.json({
        success: true,
        type: "email",
        orderNumber: order.orderNumber,
      });
    } else {
      // ── STRIPE CHECKOUT FLOW ──
      if (!customerInfo?.name || !customerInfo?.email) {
        return NextResponse.json(
          { error: "Nom et courriel requis" },
          { status: 400 }
        );
      }

      const order = await prisma.order.create({
        data: {
          orderNumber,
          type: "stripe",
          status: "new",
          deliveryMethod,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone || null,
          shippingAddress: customerInfo.shippingAddress || null,
          subtotal,
          total,
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

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = verifiedItems.map((item) => ({
        price_data: {
          currency: "cad",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: customerInfo.email,
        success_url: `${APP_URL}/panier?success=true&order=${order.orderNumber}`,
        cancel_url: `${APP_URL}/panier?canceled=true`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return NextResponse.json({
        success: true,
        type: "stripe",
        url: session.url,
      });
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la commande" },
      { status: 500 }
    );
  }
}
