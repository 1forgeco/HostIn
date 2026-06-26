import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleReadNotification = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const notificationId = req.params.id as string;

  try {
    // Verify notification belongs to the user and the org
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        org_id: orgId,
        user_id: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Update status to read
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        status: "read",
        read_at: new Date(),
      },
    });

    return res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Read notification error:", error);
    return res.status(500).json({ error: "An error occurred while marking notification as read" });
  }
};
