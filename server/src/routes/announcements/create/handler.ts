import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { AnnouncementTargetType } from "../../../../generated/prisma/client";

export const handleCreateAnnouncement = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const createdBy = req.user?.userId;

  const { title, body, targetType, targetId, sendPush, sendWhatsapp } = req.body;

  if (!title || !body || !targetType) {
    return res.status(400).json({
      error: "Missing required fields (title, body, targetType)",
    });
  }

  // Validate targetType enum
  const validTargetTypes = Object.values(AnnouncementTargetType);
  if (!validTargetTypes.includes(targetType as AnnouncementTargetType)) {
    return res.status(400).json({ error: `Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}` });
  }

  if (targetType !== "all" && !targetId) {
    return res.status(400).json({ error: "targetId is required when targetType is not 'all'" });
  }

  try {
    // Create Announcement
    const announcement = await prisma.announcement.create({
      data: {
        org_id: orgId,
        created_by: createdBy as string,
        title,
        body,
        target_type: targetType as AnnouncementTargetType,
        target_id: targetId || null,
        send_push: sendPush || false,
        send_whatsapp: sendWhatsapp || false,
      },
    });

    return res.status(201).json({
      message: "Announcement published successfully",
      announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res.status(500).json({ error: "An error occurred publishing the announcement" });
  }
};
