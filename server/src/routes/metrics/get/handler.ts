import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleGetMetrics = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { startDate, endDate } = req.query;

  try {
    // 1. Calculate Live Metrics
    // Active Tenants count
    const activeTenants = await prisma.tenantProfile.count({
      where: {
        org_id: orgId,
        is_active: true,
        status: "active",
      },
    });

    // Vacant Seats count
    const rooms = await prisma.room.findMany({
      where: {
        org_id: orgId,
        is_active: true,
      },
      select: {
        capacity: true,
        current_occupancy: true,
      },
    });

    let vacantSeats = 0;
    rooms.forEach((r) => {
      const diff = r.capacity - r.current_occupancy;
      if (diff > 0) vacantSeats += diff;
    });

    // Revenue Collected (successful payments)
    const successfulPaymentsSum = await prisma.payment.aggregate({
      where: {
        org_id: orgId,
        status: "successful",
      },
      _sum: {
        amount: true,
      },
    });

    const revenueCollected = successfulPaymentsSum._sum.amount ? Number(successfulPaymentsSum._sum.amount) : 0;

    // Revenue Outstanding (unpaid/partial dues balance)
    const unpaidDues = await prisma.due.findMany({
      where: {
        org_id: orgId,
        status: {
          in: ["unpaid", "partial", "overdue"],
        },
      },
      select: {
        amount: true,
        amount_paid: true,
      },
    });

    let revenueOutstanding = 0;
    unpaidDues.forEach((d) => {
      const remaining = Number(d.amount) - Number(d.amount_paid);
      if (remaining > 0) revenueOutstanding += remaining;
    });

    // 2. Fetch Historical Metrics if requested
    const whereHistory: any = {
      org_id: orgId,
    };

    if (startDate || endDate) {
      whereHistory.metric_date = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          whereHistory.metric_date.gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          whereHistory.metric_date.lte = end;
        }
      }
    }

    const history = await prisma.platformMetric.findMany({
      where: whereHistory,
      orderBy: {
        metric_date: "asc",
      },
    });

    return res.status(200).json({
      live: {
        activeTenants,
        vacantSeats,
        revenueCollected,
        revenueOutstanding,
      },
      history,
    });
  } catch (error) {
    console.error("Get organization metrics error:", error);
    return res.status(500).json({ error: "An error occurred while compiling metrics" });
  }
};
