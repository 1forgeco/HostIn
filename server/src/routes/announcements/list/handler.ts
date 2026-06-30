import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { AnnouncementTargetType } from "../../../../generated/prisma/client";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListAnnouncements = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;
  const { limit, page, skip } = getPagination(req.query, 50, 100);

  try {
    const whereClause: any = {
      org_id: orgId,
    };

    if (userRole === "tenant") {
      // Find tenant's profile to resolve their room and floor
      const tenantProfile = await prisma.tenantProfile.findFirst({
        where: {
          user_id: userId,
          org_id: orgId,
          is_active: true,
        },
        include: {
          room: true,
        },
      });

      const orConditions: any[] = [
        { target_type: AnnouncementTargetType.all },
        { target_type: AnnouncementTargetType.tenant, target_id: userId },
      ];

      if (tenantProfile) {
        // Target specific room
        orConditions.push({
          target_type: AnnouncementTargetType.room,
          target_id: tenantProfile.room_id,
        });

        // Target specific floor
        orConditions.push({
          target_type: AnnouncementTargetType.floor,
          target_id: tenantProfile.room.floor_id,
        });
      }

      whereClause.OR = orConditions;
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        created_by_user: {
          select: {
            full_name: true,
            profile_photo_url: true,
          },
        },
        reads: {
          where: {
            user_id: userId,
          },
          select: {
            read_at: true,
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
      where: { org_id: orgId, post_type: "announcements", post_id: { in: announcements.map((item) => item.id) } },
      include: { user: { select: { full_name: true } } },
      orderBy: { created_at: "asc" },
    });

    const formattedAnnouncements = announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      body: ann.body,
      targetType: ann.target_type,
      targetId: ann.target_id,
      createdAt: ann.created_at,
      publisherName: ann.created_by_user.full_name,
      publisherPhoto: ann.created_by_user.profile_photo_url,
      isRead: ann.reads.length > 0,
      readAt: ann.reads.length > 0 ? ann.reads[0].read_at : null,
      reactionCount: interactions.filter((item) => item.post_id === ann.id && item.kind === "reaction").length,
      commentCount: interactions.filter((item) => item.post_id === ann.id && item.kind === "comment").length,
      comments: interactions.filter((item) => item.post_id === ann.id && item.kind === "comment").map((item) => ({ id: item.id, body: item.body, authorName: item.user.full_name })),
    }));

    return res.status(200).json({
      announcements: formattedAnnouncements,
      pagination: paginationMeta(page, limit, formattedAnnouncements.length),
    });
  } catch (error) {
    console.error("List announcements error:", error);
    return res.status(500).json({ error: "An error occurred fetching announcements feed" });
  }
};
