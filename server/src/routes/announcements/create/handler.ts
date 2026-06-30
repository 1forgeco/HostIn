import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { AnnouncementTargetType } from "../../../../generated/prisma/client";
import { notifyAllMembers, notifyTenantCircle, notifyUsers } from "../../../lib/notifications";

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
    const announcement = await prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({ data: {
        org_id: orgId,
        created_by: createdBy as string,
        title,
        body,
        target_type: targetType as AnnouncementTargetType,
        target_id: targetId || null,
        send_push: sendPush || false,
        send_whatsapp: sendWhatsapp || false,
      } });
      const notice = { orgId, title: `Announcement: ${title}`, body, type: "announcement" as const, referenceId: created.id, referenceType: "announcement" };
      if (targetType === "all") await notifyAllMembers(tx, notice, createdBy);
      else if (targetType === "tenant") await notifyTenantCircle(tx, String(targetId), notice, createdBy);
      else {
        const profiles = await tx.tenantProfile.findMany({ where: { org_id: orgId, is_active: true, ...(targetType === "room" ? { room_id: targetId } : { room: { floor_id: targetId } }) }, select: { user_id: true } });
        const parentLinks = await tx.parentProfile.findMany({ where: { org_id: orgId, tenant_id: { in: profiles.map((item) => item.user_id) } }, select: { user_id: true } });
        await notifyUsers(tx, [...profiles.map((item) => item.user_id), ...parentLinks.map((item) => item.user_id)], notice, createdBy);
      }
      return created;
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
