import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { PassStatus } from "../../../../generated/prisma/client";

export const handleListPasses = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { status, tenantId } = req.query;

  // Build filter dynamically
  const whereClause: any = {
    org_id: orgId,
  };

  // If the user is a tenant, restrict query to their own passes
  if (userRole === "tenant") {
    whereClause.tenant_id = userId;
  } else {
    // Admins/Guards can filter by a specific tenant
    if (tenantId) {
      whereClause.tenant_id = tenantId as string;
    }
  }

  if (status) {
    whereClause.status = status as PassStatus;
  }

  try {
    const gatePasses = await prisma.gatePass.findMany({
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
        checked_by_user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({ gatePasses });
  } catch (error) {
    console.error("List gate passes error:", error);
    return res.status(500).json({ error: "An error occurred fetching gate passes list" });
  }
};
