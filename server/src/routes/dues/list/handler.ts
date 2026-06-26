import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { DueStatus } from "../../../../generated/prisma/client";

export const handleListDues = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { status, tenantId } = req.query;

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
    });

    return res.status(200).json({ dues });
  } catch (error) {
    console.error("List dues error:", error);
    return res.status(500).json({ error: "An error occurred fetching dues list" });
  }
};
