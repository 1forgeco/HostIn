import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { PassStatus } from "../../../../generated/prisma/client";
import { expireUnusedGatePasses } from "../../../lib/gatePassLifecycle";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListPasses = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { status, tenantId } = req.query;
  const { limit, page, skip } = getPagination(req.query);

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
    await expireUnusedGatePasses(prisma, orgId, userRole === "tenant" ? userId : tenantId as string | undefined);
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
      take: limit,
      skip,
    });

    return res.status(200).json({ gatePasses, pagination: paginationMeta(page, limit, gatePasses.length) });
  } catch (error) {
    console.error("List gate passes error:", error);
    return res.status(500).json({ error: "An error occurred fetching gate passes list" });
  }
};
