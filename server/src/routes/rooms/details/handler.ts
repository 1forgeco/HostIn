import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleGetRoomDetails = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const roomId = req.params.roomId as string;

  if (!roomId) {
    return res.status(400).json({ error: "Missing roomId parameter" });
  }

  try {
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        org_id: orgId,
        is_active: true,
      },
      include: {
        floor: {
          select: {
            floor_number: true,
            floor_name: true,
          },
        },
        tenant_profiles: {
          where: { is_active: true },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                profile_photo_url: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found in this organization" });
    }

    return res.status(200).json({ room });
  } catch (error) {
    console.error("Get room details error:", error);
    return res.status(500).json({ error: "An error occurred fetching room details" });
  }
};
