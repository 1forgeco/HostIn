import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export const handleLinkParent = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { tenantId, parentEmail, parentPhone, parentName, relation } = req.body;

  if (!tenantId || !parentEmail || !parentPhone || !parentName || !relation) {
    return res.status(400).json({
      error: "Missing required fields (tenantId, parentEmail, parentPhone, parentName, relation)",
    });
  }

  try {
    // 1. Verify tenant exists and is a tenant in the current organization
    const tenantRole = await prisma.userOrgRole.findFirst({
      where: {
        user_id: tenantId,
        org_id: orgId,
        role: "tenant",
        is_active: true,
      },
    });

    if (!tenantRole) {
      return res.status(400).json({
        error: "Selected user is not an active tenant in this organization",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 2. Find or create the parent User account
      let parentUser = await tx.user.findFirst({
        where: {
          OR: [
            { email: parentEmail },
            { phone: parentPhone },
          ],
        },
      });

      if (!parentUser) {
        // Create skeleton User record for the parent
        const passwordHash = await bcrypt.hash("ParentPassword123", 10);
        parentUser = await tx.user.create({
          data: {
            email: parentEmail,
            phone: parentPhone,
            full_name: parentName,
            password_hash: passwordHash,
            is_active: true,
          },
        });
      }

      // 3. Ensure the parent has the "parent" role in the organization
      let parentOrgRole = await tx.userOrgRole.findUnique({
        where: {
          user_id_org_id_role: {
            user_id: parentUser.id,
            org_id: orgId,
            role: "parent",
          },
        },
      });

      if (!parentOrgRole) {
        parentOrgRole = await tx.userOrgRole.create({
          data: {
            user_id: parentUser.id,
            org_id: orgId,
            role: "parent",
            is_active: true,
          },
        });
      } else if (!parentOrgRole.is_active) {
        // Re-activate if it was deactivated
        parentOrgRole = await tx.userOrgRole.update({
          where: { id: parentOrgRole.id },
          data: { is_active: true },
        });
      }

      // 4. Create or update ParentProfile link
      const profile = await tx.parentProfile.upsert({
        where: {
          user_id_tenant_id_org_id: {
            user_id: parentUser.id,
            tenant_id: tenantId,
            org_id: orgId,
          },
        },
        create: {
          user_id: parentUser.id,
          tenant_id: tenantId,
          org_id: orgId,
          relation,
          can_see_roommate_contact: false,
          can_see_parent_contact: false,
        },
        update: {
          relation, // Update relation if profile already exists
        },
      });

      return {
        parent: parentUser,
        profile,
      };
    });

    return res.status(200).json({
      message: "Parent linked successfully",
      parent: result.parent,
      profile: result.profile,
    });
  } catch (error) {
    console.error("Link parent error:", error);
    return res.status(500).json({ error: "An error occurred while linking the parent" });
  }
};
