import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListDocuments = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const loggedInUserId = req.user?.userId;
  const queryTenantId = req.query.tenantId as string;
  const tenantName = (req.query.tenantName as string | undefined)?.trim();
  const { limit, page, skip } = getPagination(req.query);

  try {
    const whereClause: any = {
      org_id: orgId,
    };

    if (req.userOrgRole === "tenant") {
      // Tenants can only view their own documents
      whereClause.tenant_id = loggedInUserId;
    } else {
      // Owners and wardens can view all or filter by tenantId
      if (queryTenantId) {
        whereClause.tenant_id = queryTenantId;
      }
      if (tenantName) {
        whereClause.tenant = { full_name: { contains: tenantName, mode: "insensitive" } };
      }
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        tenant: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip,
    });

    return res.status(200).json({
      documents,
      pagination: paginationMeta(page, limit, documents.length),
    });
  } catch (error) {
    console.error("List documents error:", error);
    return res.status(500).json({ error: "An error occurred while listing documents" });
  }
};
