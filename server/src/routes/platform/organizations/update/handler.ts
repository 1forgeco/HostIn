import { Response } from "express";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";
import { prisma } from "../../../../lib/prisma";
import { PlanStatus } from "../../../../../generated/prisma/client";
import { notifyRoles } from "../../../../lib/notifications";

export const handleUpdateOrganization = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const { planId, planStatus, planExpiresAt, isActive, totalCapacity, themeColor } = req.body;

  try {
    // 1. Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // 2. Validate update fields
    const updateData: any = {};

    if (planId !== undefined) {
      const planExists = await prisma.plan.findUnique({
        where: { id: planId },
      });
      if (!planExists) {
        return res.status(400).json({ error: "Selected plan does not exist" });
      }
      updateData.plan_id = planId;
    }

    if (planStatus !== undefined) {
      const validStatuses = Object.values(PlanStatus);
      if (!validStatuses.includes(planStatus as PlanStatus)) {
        return res.status(400).json({
          error: `Invalid planStatus. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
      updateData.plan_status = planStatus as PlanStatus;
    }

    if (planExpiresAt !== undefined) {
      updateData.plan_expires_at = planExpiresAt ? new Date(planExpiresAt) : null;
      if (updateData.plan_expires_at && isNaN(updateData.plan_expires_at.getTime())) {
        return res.status(400).json({ error: "Invalid date format for planExpiresAt" });
      }
    }

    if (isActive !== undefined) {
      updateData.is_active = !!isActive;
      updateData.workspace_status = isActive ? "active" : "suspended";
    }
    if (themeColor !== undefined) {
      if (themeColor !== null && !/^#[0-9a-fA-F]{6}$/.test(themeColor)) return res.status(400).json({ error: "themeColor must be a six-digit hex colour" });
      updateData.theme_color = themeColor;
    }
    if (totalCapacity !== undefined) {
      const capacityInt = parseInt(totalCapacity, 10);
      if (isNaN(capacityInt) || capacityInt < 0) {
        return res.status(400).json({ error: "totalCapacity must be a non-negative integer" });
      }
      updateData.total_capacity = capacityInt;
    }

    // 3. Perform update
    const updatedOrg = await prisma.organization.update({
      where: {
        id: orgId,
      },
      data: updateData,
      include: {
        plan: true,
      },
    });

    await prisma.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "update_subscription", entity_type: "organization", entity_id: orgId, details: updateData } });
    await notifyRoles(prisma, ["owner"], { orgId, title: "Workspace settings updated", body: "1Forge updated your workspace subscription, status, capacity, or branding settings.", type: "other", referenceId: orgId, referenceType: "organization" });

    return res.status(200).json({
      message: "Organization subscription updated successfully",
      organization: updatedOrg,
    });
  } catch (error) {
    console.error("Update organization error:", error);
    return res.status(500).json({ error: "An error occurred while updating organization settings" });
  }
};
