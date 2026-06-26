import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleListDocuments = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const loggedInUserId = req.user?.userId;
  const queryTenantId = req.query.tenantId as string;

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
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({
      documents,
    });
  } catch (error) {
    console.error("List documents error:", error);
    return res.status(500).json({ error: "An error occurred while listing documents" });
  }
};
