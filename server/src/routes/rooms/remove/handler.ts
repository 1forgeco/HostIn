import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyRoles, notifyTenantCircle } from "../../../lib/notifications";

export const handleRemoveTenantFromRoom = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const roomId = req.params.roomId as string;
  const tenantProfileId = req.params.tenantProfileId as string;
  const { reason } = req.body;

  if (!roomId || !tenantProfileId) {
    return res.status(400).json({ error: "Missing roomId or tenantProfileId parameter" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tenantProfile = await tx.tenantProfile.findFirst({
        where: {
          id: tenantProfileId,
          org_id: orgId,
          room_id: roomId,
          is_active: true,
        },
      });

      if (!tenantProfile) {
        throw new Error("TENANT_PROFILE_NOT_FOUND");
      }

      const room = await tx.room.findFirst({
        where: { id: roomId, org_id: orgId },
      });

      if (!room) {
        throw new Error("ROOM_NOT_FOUND");
      }

      await tx.tenantProfile.update({
        where: { id: tenantProfile.id },
        data: {
          is_active: false,
          status: "deactivated",
          deactivated_at: new Date(),
        },
      });

      await tx.userOrgRole.updateMany({
        where: {
          user_id: tenantProfile.user_id,
          org_id: orgId,
          role: "tenant",
          is_active: true,
        },
        data: { is_active: false },
      });

      await tx.roomAssignmentHistory.updateMany({
        where: {
          org_id: orgId,
          room_id: roomId,
          tenant_id: tenantProfile.user_id,
          vacated_at: null,
        },
        data: {
          vacated_at: new Date(),
          reason: reason || "removed from room",
        },
      });

      const newOccupancy = await tx.tenantProfile.count({
        where: { org_id: orgId, room_id: roomId, is_active: true },
      });

      const updatedRoom = await tx.room.update({
        where: { id: room.id },
        data: {
          current_occupancy: newOccupancy,
          status: newOccupancy === 0 ? "available" : newOccupancy < room.capacity ? "available" : "occupied",
        },
      });

      const notice = { orgId, title: "Room assignment ended", body: `The tenant was removed from room ${room.room_number}.`, type: "other" as const, referenceId: tenantProfile.user_id, referenceType: "tenant" };
      await notifyTenantCircle(tx, tenantProfile.user_id, notice, req.user?.userId);
      await notifyRoles(tx, ["owner", "warden"], notice, req.user?.userId);

      return { room: updatedRoom };
    });

    return res.status(200).json({
      message: "Tenant removed from room successfully",
      ...result,
    });
  } catch (error: any) {
    if (error.message === "TENANT_PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Active tenant profile not found in this room" });
    }
    if (error.message === "ROOM_NOT_FOUND") {
      return res.status(404).json({ error: "Room not found in this organization" });
    }

    console.error("Remove tenant from room error:", error);
    return res.status(500).json({ error: "An error occurred removing tenant from room" });
  }
};
