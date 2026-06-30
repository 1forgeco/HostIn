import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { RoomStatus, RoomType } from "../../../../generated/prisma/client";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListRooms = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { floorId, status, roomType } = req.query;
  const { limit, page, skip } = getPagination(req.query, 250, 500);

  // Build filters dynamically
  const whereClause: any = {
    org_id: orgId,
    is_active: true,
  };

  if (floorId) {
    whereClause.floor_id = floorId as string;
  }

  if (status) {
    whereClause.status = status as RoomStatus;
  }

  if (roomType) {
    whereClause.room_type = roomType as RoomType;
  }

  try {
    const rooms = await prisma.room.findMany({
      where: whereClause,
      orderBy: { room_number: "asc" },
      include: {
        floor: {
          select: {
            id: true,
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
      take: limit,
      skip,
    });

    return res.status(200).json({ rooms, pagination: paginationMeta(page, limit, rooms.length) });
  } catch (error) {
    console.error("List rooms error:", error);
    return res.status(500).json({ error: "An error occurred fetching rooms list" });
  }
};
