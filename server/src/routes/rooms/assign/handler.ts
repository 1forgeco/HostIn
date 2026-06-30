import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { syncCurrentRentDue } from "../../../lib/rentBilling";

export const handleAssignTenantToRoom = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const roomId = req.params.roomId as string;
  const {
    tenantUserId,
    admissionDate,
    emergencyContactName,
    emergencyContactPhone,
    collegeOrCompany,
  } = req.body;

  if (!roomId || !tenantUserId) {
    return res.status(400).json({ error: "Missing required fields (roomId, tenantUserId)" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findFirst({
        where: { id: roomId, org_id: orgId, is_active: true },
      });

      if (!room) {
        throw new Error("ROOM_NOT_FOUND");
      }

      const activeOccupancy = await tx.tenantProfile.count({
        where: { org_id: orgId, room_id: room.id, is_active: true },
      });

      const existingProfile = await tx.tenantProfile.findUnique({
        where: {
          user_id_org_id: {
            user_id: tenantUserId,
            org_id: orgId,
          },
        },
      });

      const isSameRoom = existingProfile?.is_active && existingProfile.room_id === room.id;
      if (!isSameRoom && activeOccupancy >= room.capacity) {
        throw new Error("ROOM_FULL");
      }

      const tenantUser = await tx.user.findFirst({
        where: { id: tenantUserId, is_active: true },
      });

      if (!tenantUser) {
        throw new Error("TENANT_USER_NOT_FOUND");
      }

      await tx.userOrgRole.upsert({
        where: {
          user_id_org_id_role: {
            user_id: tenantUserId,
            org_id: orgId,
            role: "tenant",
          },
        },
        update: { is_active: true },
        create: {
          user_id: tenantUserId,
          org_id: orgId,
          role: "tenant",
          is_active: true,
        },
      });

      if (existingProfile?.is_active && existingProfile.room_id !== room.id) {
        const previousRoom = await tx.room.findUnique({ where: { id: existingProfile.room_id } });
        if (previousRoom) {
          const previousOccupancy = Math.max(0, previousRoom.current_occupancy - 1);
          await tx.room.update({
            where: { id: previousRoom.id },
            data: {
              current_occupancy: previousOccupancy,
              status: previousOccupancy === 0 ? "available" : previousOccupancy < previousRoom.capacity ? "available" : "occupied",
            },
          });
        }

        await tx.roomAssignmentHistory.updateMany({
          where: {
            org_id: orgId,
            tenant_id: tenantUserId,
            room_id: existingProfile.room_id,
            vacated_at: null,
          },
          data: {
            vacated_at: new Date(),
            reason: "room change",
          },
        });
      }

      const tenantProfile = existingProfile
        ? await tx.tenantProfile.update({
            where: { id: existingProfile.id },
            data: {
              room_id: room.id,
              status: "active",
              is_active: true,
              deactivated_at: null,
              emergency_contact_name: emergencyContactName || existingProfile.emergency_contact_name,
              emergency_contact_phone: emergencyContactPhone || existingProfile.emergency_contact_phone,
              college_or_company: collegeOrCompany ?? existingProfile.college_or_company,
            },
          })
        : await tx.tenantProfile.create({
            data: {
              user_id: tenantUserId,
              org_id: orgId,
              room_id: room.id,
              admission_date: admissionDate ? new Date(admissionDate) : new Date(),
              emergency_contact_name: emergencyContactName || "Not provided",
              emergency_contact_phone: emergencyContactPhone || tenantUser.phone,
              college_or_company: collegeOrCompany || null,
              status: "active",
              is_active: true,
            },
          });

      await tx.roomAssignmentHistory.create({
        data: {
          org_id: orgId,
          room_id: room.id,
          tenant_id: tenantUserId,
          reason: isSameRoom ? "reassigned" : "assigned",
        },
      });

      const newOccupancy = await tx.tenantProfile.count({
        where: { org_id: orgId, room_id: room.id, is_active: true },
      });

      const updatedRoom = await tx.room.update({
        where: { id: room.id },
        data: {
          current_occupancy: newOccupancy,
          status: newOccupancy >= room.capacity ? "occupied" : "available",
        },
      });

      const rentDue = await syncCurrentRentDue(tx, { orgId, tenantId: tenantUserId, room: updatedRoom, actorUserId: req.user?.userId as string });

      return { tenantProfile, room: updatedRoom, rentDue };
    });

    return res.status(200).json({
      message: "Tenant assigned to room successfully",
      ...result,
    });
  } catch (error: any) {
    if (error.message === "ROOM_NOT_FOUND") {
      return res.status(404).json({ error: "Room not found in this organization" });
    }
    if (error.message === "ROOM_FULL") {
      return res.status(400).json({ error: "Room is already at full capacity" });
    }
    if (error.message === "TENANT_USER_NOT_FOUND") {
      return res.status(404).json({ error: "Tenant user not found" });
    }

    console.error("Assign tenant to room error:", error);
    return res.status(500).json({ error: "An error occurred assigning tenant to room" });
  }
};
