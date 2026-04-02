import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allOrders, todayOrders, weekOrders, monthOrders] = await Promise.all([
      prisma.order.findMany({ select: { total: true, status: true, type: true, paidAt: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: todayStart } }, select: { total: true, status: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: weekStart } }, select: { total: true, status: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: monthStart } }, select: { total: true, status: true, paidAt: true } }),
    ]);

    const paidStatuses = ["paid", "shipped", "completed"];

    const revenueToday = todayOrders
      .filter((o) => paidStatuses.includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    const revenueWeek = weekOrders
      .filter((o) => paidStatuses.includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    const revenueMonth = monthOrders
      .filter((o) => paidStatuses.includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    const pending = allOrders.filter((o) => o.status === "new" || o.status === "contacted").length;
    const completed = allOrders.filter((o) => o.status === "completed").length;
    const totalOrders = allOrders.length;

    return NextResponse.json({
      today: { orders: todayOrders.length, revenue: revenueToday },
      week: { orders: weekOrders.length, revenue: revenueWeek },
      month: { orders: monthOrders.length, revenue: revenueMonth },
      pending,
      completed,
      totalOrders,
      conversionRate: totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
