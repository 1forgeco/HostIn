import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleReadAnnouncement = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id) {
    return res.status(400).json({ error: "Missing announcement ID parameter" });
  }

  try {
    // Check if the announcement exists in this organization
    const announcement = await prisma.announcement.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found in this organization" });
    }

    // Register read receipt
    await prisma.announcementRead.upsert({
      where: {
        announcement_id_user_id: {
          announcement_id: id,
          user_id: userId as string,
        },
      },
      update: {}, // if exists, do nothing
      create: {
        announcement_id: id,
        user_id: userId as string,
      },
    });

    return res.status(200).json({
      message: "Announcement marked as read",
    });
  } catch (error) {
    console.error("Read announcement error:", error);
    return res.status(500).json({ error: "An error occurred marking the announcement as read" });
  }
};
