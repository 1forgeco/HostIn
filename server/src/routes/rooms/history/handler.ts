import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleGetRoomHistory = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const roomId = req.params.id as string;

  try {
    // Verify room exists in organization
    const roomExists = await prisma.room.findFirst({
      where: {
        id: roomId,
        org_id: orgId,
      },
    });

    if (!roomExists) {
      return res.status(404).json({ error: "Room not found in this organization" });
    }

    // Fetch assignment history
    const history = await prisma.roomAssignmentHistory.findMany({
      where: {
        room_id: roomId,
        org_id: orgId,
      },
      orderBy: {
        assigned_at: "desc",
      },
      include: {
        tenant: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return res.status(200).json({
      roomId,
      roomNumber: roomExists.room_number,
      history,
    });
  } catch (error) {
    console.error("Get room history error:", error);
    return res.status(500).json({ error: "An error occurred while fetching room assignment history" });
  }
};
