import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendOrderStatusEmail, type OrderStatus } from "@/lib/order-email";
import { ORDER_STATUSES } from "@/lib/order-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!status || !(status in ORDER_STATUSES)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const data: Record<string, unknown> = { status };

    // Set paidAt when marking as paid
    if (status === "paid") {
      data.paidAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data,
    });

    // Send status email to customer
    try {
      await sendOrderStatusEmail(
        order.customerEmail,
        order.customerName,
        order.orderNumber,
        status as OrderStatus,
      );
    } catch (emailError) {
      console.error("Failed to send status email:", emailError);
      // Don't fail the status update if email fails
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
