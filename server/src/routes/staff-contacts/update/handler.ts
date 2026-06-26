import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { StaffRoleType } from "../../../../generated/prisma/client";

export const handleUpdateStaffContact = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const contactId = req.params.id as string;
  const { name, phone, roleType, userId, isEmergency, isActive } = req.body;

  try {
    // Verify contact exists and belongs to the current organization
    const existingContact = await prisma.staffContact.findFirst({
      where: {
        id: contactId,
        org_id: orgId,
      },
    });

    if (!existingContact) {
      return res.status(404).json({ error: "Staff contact not found" });
    }

    // Build update payload
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    if (roleType !== undefined) {
      // Validate roleType enum
      const validRoleTypes = Object.values(StaffRoleType);
      if (!validRoleTypes.includes(roleType as StaffRoleType)) {
        return res.status(400).json({
          error: `Invalid roleType. Must be one of: ${validRoleTypes.join(", ")}`,
        });
      }
      updateData.role_type = roleType as StaffRoleType;
    }

    if (userId !== undefined) {
      if (userId !== null) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!userExists) {
          return res.status(400).json({ error: "Provided userId does not exist" });
        }
      }
      updateData.user_id = userId;
    }

    if (isEmergency !== undefined) updateData.is_emergency = isEmergency;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Perform update
    const updatedContact = await prisma.staffContact.update({
      where: {
        id: contactId,
      },
      data: updateData,
    });

    return res.status(200).json({
      message: "Staff contact updated successfully",
      staffContact: updatedContact,
    });
  } catch (error) {
    console.error("Update staff contact error:", error);
    return res.status(500).json({ error: "An error occurred while updating the staff contact" });
  }
};
