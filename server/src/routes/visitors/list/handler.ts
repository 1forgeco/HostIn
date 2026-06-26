import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { VisitStatus } from "../../../../generated/prisma/client";

export const handleListVisitors = async (req: AuthorizedRequest, res: Response) => {
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
    whereClause.status = status as VisitStatus;
  }

  try {
    const visitors = await prisma.visitor.findMany({
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
        approved_by_user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        expected_visit_time: "desc",
      },
    });

    return res.status(200).json({ visitors });
  } catch (error) {
    console.error("List visitors error:", error);
    return res.status(500).json({ error: "An error occurred fetching visitor logs" });
  }
};
