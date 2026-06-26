import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { ComplaintCategory, ComplaintStatus, ComplaintPriority } from "../../../../generated/prisma/client";

export const handleListComplaints = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { status, category, priority } = req.query;

  const whereClause: any = {
    org_id: orgId,
  };

  // Enforce tenant isolation
  if (userRole === "tenant") {
    whereClause.tenant_id = userId;
  }

  if (status) {
    whereClause.status = status as ComplaintStatus;
  }

  if (category) {
    whereClause.category = category as ComplaintCategory;
  }

  if (priority) {
    whereClause.priority = priority as ComplaintPriority;
  }

  try {
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            full_name: true,
          },
        },
        assigned_to_user: {
          select: {
            id: true,
            full_name: true,
          },
        },
        updates: {
          orderBy: { created_at: "desc" },
          include: {
            updated_by_user: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error("List complaints error:", error);
    return res.status(500).json({ error: "An error occurred fetching complaints list" });
  }
};
