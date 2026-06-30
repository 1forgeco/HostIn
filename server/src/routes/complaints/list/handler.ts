import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { ComplaintCategory, ComplaintStatus, ComplaintPriority } from "../../../../generated/prisma/client";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListComplaints = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { status, category, priority } = req.query;
  const { limit, page, skip } = getPagination(req.query);

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
      take: limit,
      skip,
    });

    const interactions = await prisma.communityInteraction.findMany({
      where: { org_id: orgId, post_type: "complaints", post_id: { in: complaints.map((item) => item.id) } },
      include: { user: { select: { full_name: true } } },
      orderBy: { created_at: "asc" },
    });

    const formattedComplaints = complaints.map((complaint) => ({
      ...complaint,
      reactionCount: interactions.filter((item) => item.post_id === complaint.id && item.kind === "reaction").length,
      commentCount: interactions.filter((item) => item.post_id === complaint.id && item.kind === "comment").length,
      comments: interactions.filter((item) => item.post_id === complaint.id && item.kind === "comment").map((item) => ({ id: item.id, body: item.body, authorName: item.user.full_name })),
    }));

    return res.status(200).json({ complaints: formattedComplaints, pagination: paginationMeta(page, limit, formattedComplaints.length) });
  } catch (error) {
    console.error("List complaints error:", error);
    return res.status(500).json({ error: "An error occurred fetching complaints list" });
  }
};
