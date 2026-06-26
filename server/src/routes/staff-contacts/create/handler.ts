import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { StaffRoleType } from "../../../../generated/prisma/client";

export const handleCreateStaffContact = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { name, phone, roleType, userId, isEmergency } = req.body;

  if (!name || !phone || !roleType) {
    return res.status(400).json({
      error: "Missing required fields (name, phone, roleType)",
    });
  }

  // Validate roleType enum
  const validRoleTypes = Object.values(StaffRoleType);
  if (!validRoleTypes.includes(roleType as StaffRoleType)) {
    return res.status(400).json({
      error: `Invalid roleType. Must be one of: ${validRoleTypes.join(", ")}`,
    });
  }

  try {
    // If userId is provided, verify the user exists
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        return res.status(400).json({ error: "Provided userId does not exist" });
      }
    }

    // Create Staff Contact
    const staffContact = await prisma.staffContact.create({
      data: {
        org_id: orgId,
        user_id: userId || null,
        name,
        phone,
        role_type: roleType as StaffRoleType,
        is_emergency: isEmergency || false,
        is_active: true,
      },
    });

    return res.status(201).json({
      message: "Staff contact created successfully",
      staffContact,
    });
  } catch (error) {
    console.error("Create staff contact error:", error);
    return res.status(500).json({ error: "An error occurred while creating staff contact" });
  }
};
