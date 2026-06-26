import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleListAuditLogs = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { userId, entityType } = req.query;

  try {
    const whereClause: any = {
      org_id: orgId,
    };

    if (userId) {
      whereClause.user_id = userId as string;
    }

    if (entityType) {
      whereClause.entity_type = entityType as string;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      auditLogs,
    });
  } catch (error) {
    console.error("List audit logs error:", error);
    return res.status(500).json({ error: "An error occurred while listing audit logs" });
  }
};
