import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { DueStatus } from "../../../../generated/prisma/client";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListDues = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { status, tenantId } = req.query;
  const { limit, page, skip } = getPagination(req.query);

  const whereClause: any = {
    org_id: orgId,
  };

  // Enforce tenant isolation
  if (userRole === "tenant") {
    whereClause.tenant_id = userId;
  } else {
    if (tenantId) {
      whereClause.tenant_id = tenantId as string;
    }
  }

  if (status) {
    whereClause.status = status as DueStatus;
  }

  try {
    if (userRole === "owner" || userRole === "warden") {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${orgId}:${monthStart.toISOString()}:rent`}))`;
        const [profiles, existingRentDues] = await Promise.all([
          tx.tenantProfile.findMany({ where: { org_id: orgId, is_active: true }, select: { user_id: true, room: { select: { monthly_rent: true } } } }),
          tx.due.findMany({ where: { org_id: orgId, due_type: "rent", billing_month: { gte: monthStart, lt: monthEnd } }, select: { tenant_id: true } }),
        ]);
        const billedTenantIds = new Set(existingRentDues.map((due) => due.tenant_id));
        const missingProfiles = profiles.filter((profile) => !billedTenantIds.has(profile.user_id));
        if (missingProfiles.length) {
          const dueDate = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), Math.min(10, new Date(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0).getUTCDate())));
          await tx.due.createMany({ data: missingProfiles.map((profile) => ({ org_id: orgId, tenant_id: profile.user_id, due_type: "rent" as const, amount: profile.room.monthly_rent, amount_paid: 0, description: "Monthly room rent", due_date: dueDate, billing_month: monthStart, status: "unpaid" as const, created_by: userId as string })) });
        }
      });
    }
    const dues = await prisma.due.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        created_by_user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        due_date: "asc",
      },
      take: limit,
      skip,
    });

    return res.status(200).json({ dues, pagination: paginationMeta(page, limit, dues.length) });
  } catch (error) {
    console.error("List dues error:", error);
    return res.status(500).json({ error: "An error occurred fetching dues list" });
  }
};
