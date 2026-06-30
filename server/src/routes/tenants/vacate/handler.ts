import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyRoles, notifyTenantCircle } from "../../../lib/notifications";

export const handleVacateTenant = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const tenantId = req.params.tenantId as string;
  const { reason } = req.body;

  if (!tenantId) {
    return res.status(400).json({ error: "Missing tenantId parameter" });
  }

  try {
    // Find the active tenant profile
    const tenantProfile = await prisma.tenantProfile.findFirst({
      where: {
        id: tenantId,
        org_id: orgId,
        is_active: true,
      },
    });

    if (!tenantProfile) {
      return res.status(404).json({ error: "Active tenant profile not found in this organization" });
    }

    // Execute checkout updates inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Deactivate TenantProfile
      await tx.tenantProfile.update({
        where: { id: tenantProfile.id },
        data: {
          is_active: false,
          status: "deactivated",
          deactivated_at: new Date(),
        },
      });

      // 2. Fetch the room to update its occupancy
      const room = await tx.room.findUnique({
        where: { id: tenantProfile.room_id },
      });

      if (room) {
        const newOccupancy = Math.max(0, room.current_occupancy - 1);
        await tx.room.update({
          where: { id: room.id },
          data: {
            current_occupancy: newOccupancy,
            status: newOccupancy < room.capacity ? "available" : "occupied",
          },
        });
      }

      // 3. Update RoomAssignmentHistory (close active assignment)
      await tx.roomAssignmentHistory.updateMany({
        where: {
          org_id: orgId,
          room_id: tenantProfile.room_id,
          tenant_id: tenantProfile.user_id,
          vacated_at: null,
        },
        data: {
          vacated_at: new Date(),
          reason: reason || "vacated",
        },
      });

      // 4. Deactivate the UserOrgRole for this user as 'tenant' in this organization
      await tx.userOrgRole.updateMany({
        where: {
          user_id: tenantProfile.user_id,
          org_id: orgId,
          role: "tenant",
          is_active: true,
        },
        data: {
          is_active: false,
        },
      });

      const notice = { orgId, title: "Tenant checkout completed", body: `The tenant has vacated${room ? ` room ${room.room_number}` : " the property"}.`, type: "other" as const, referenceId: tenantProfile.user_id, referenceType: "tenant" };
      await notifyTenantCircle(tx, tenantProfile.user_id, notice, req.user?.userId);
      await notifyRoles(tx, ["owner", "warden"], notice, req.user?.userId);
    });

    return res.status(200).json({
      message: "Tenant checked out and room vacated successfully.",
    });
  } catch (error) {
    console.error("Vacate tenant error:", error);
    return res.status(500).json({ error: "An error occurred during tenant vacate processing" });
  }
};
