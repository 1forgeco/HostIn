import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListPayments = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { tenantId, dueId } = req.query;
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

  if (dueId) {
    whereClause.due_id = dueId as string;
  }

  try {
    const payments = await prisma.payment.findMany({
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
        due: {
          select: {
            due_type: true,
            amount: true,
            due_date: true,
          },
        },
        paid_by_user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip,
    });

    return res.status(200).json({ payments, pagination: paginationMeta(page, limit, payments.length) });
  } catch (error) {
    console.error("List payments error:", error);
    return res.status(500).json({ error: "An error occurred fetching payments list" });
  }
};
