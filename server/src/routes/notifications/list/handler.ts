import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { NotificationStatus } from "../../../../generated/prisma/client";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListNotifications = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const statusQuery = req.query.status as string;
  const { limit, page, skip } = getPagination(req.query, 50, 100);

  try {
    const whereClause: any = {
      org_id: orgId,
      user_id: userId,
    };

    if (statusQuery) {
      const validStatuses = Object.values(NotificationStatus);
      if (!validStatuses.includes(statusQuery as NotificationStatus)) {
        return res.status(400).json({
          error: `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
      whereClause.status = statusQuery as NotificationStatus;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        created_at: "desc",
      },
      take: limit,
      skip,
    });

    return res.status(200).json({
      notifications,
      pagination: paginationMeta(page, limit, notifications.length),
    });
  } catch (error) {
    console.error("List notifications error:", error);
    return res.status(500).json({ error: "An error occurred while listing notifications" });
  }
};
