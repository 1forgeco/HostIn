import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { invalidateRuntimeCache } from "../../../lib/runtimeCache";

export const handleUpdateParentPrivacy = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const loggedInUserId = req.user?.userId;
  const { parentProfileId, canSeeRoommateContact, canSeeParentContact } = req.body;

  if (!parentProfileId) {
    return res.status(400).json({ error: "Missing required parameter: parentProfileId" });
  }

  try {
    // Find the parent profile
    const profile = await prisma.parentProfile.findFirst({
      where: {
        id: parentProfileId,
        org_id: orgId,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Parent profile not found" });
    }

    // Access control: tenants can only edit their own profile settings
    if (req.userOrgRole === "tenant" && profile.tenant_id !== loggedInUserId) {
      return res.status(403).json({ error: "Access denied. You cannot modify settings for this parent link." });
    }

    // Prepare update data
    const updateData: any = {};
    if (canSeeRoommateContact !== undefined) updateData.can_see_roommate_contact = !!canSeeRoommateContact;
    if (canSeeParentContact !== undefined) updateData.can_see_parent_contact = !!canSeeParentContact;

    const updatedProfile = await prisma.parentProfile.update({
      where: {
        id: parentProfileId,
      },
      data: updateData,
    });
    invalidateRuntimeCache(orgId);

    return res.status(200).json({
      message: "Parent contact sharing settings updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update parent privacy error:", error);
    return res.status(500).json({ error: "An error occurred while updating parent settings" });
  }
};
