import { Response } from "express";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";
import { prisma } from "../../../../lib/prisma";
import { OrgRole } from "../../../../../generated/prisma/client";
import { notifyRoles } from "../../../../lib/notifications";

export const handleToggleOrgFeatures = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const { featureKey, isEnabled } = req.body;

  if (!featureKey || isEnabled === undefined) {
    return res.status(400).json({ error: "Missing required fields (featureKey, isEnabled)" });
  }

  try {
    // 1. Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // 2. Fetch the owner of the organization to satisfy User foreign key constraint on updated_by
    const ownerRole = await prisma.userOrgRole.findFirst({
      where: {
        org_id: orgId,
        role: "owner",
        is_active: true,
      },
    });

    if (!ownerRole) {
      return res.status(400).json({
        error: "Cannot toggle features. No active owner account was found for this organization to log updates.",
      });
    }

    // 3. Upsert feature toggle
    const orgFeature = await prisma.orgFeature.upsert({
      where: {
        org_id_feature_key: {
          org_id: orgId,
          feature_key: featureKey,
        },
      },
      create: {
        org_id: orgId,
        feature_key: featureKey,
        is_enabled: !!isEnabled,
        updated_by: ownerRole.user_id,
      },
      update: {
        is_enabled: !!isEnabled,
        updated_by: ownerRole.user_id,
      },
    });

    if (featureKey.startsWith("role_")) {
      const role = featureKey.slice(5) as OrgRole;
      if (Object.values(OrgRole).includes(role)) {
        await prisma.roleDashboard.upsert({
          where: { org_id_role: { org_id: orgId, role } },
          create: { org_id: orgId, role, status: isEnabled ? "active" : "inactive" },
          update: { status: isEnabled ? "active" : "inactive" },
        });
      }
    }

    await prisma.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "toggle_feature", entity_type: "organization", entity_id: orgId, details: { featureKey, isEnabled: !!isEnabled } } });
    await notifyRoles(prisma, ["owner"], { orgId, title: "Workspace feature changed", body: `${featureKey} was ${isEnabled ? "enabled" : "disabled"} by 1Forge.`, type: "other", referenceId: orgFeature.id, referenceType: "org_feature" });

    return res.status(200).json({
      message: "Organization feature toggled successfully",
      orgFeature,
    });
  } catch (error) {
    console.error("Toggle org features error:", error);
    return res.status(500).json({ error: "An error occurred while toggling the organization feature" });
  }
};
