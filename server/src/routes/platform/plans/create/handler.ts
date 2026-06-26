import { Response } from "express";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";
import { prisma } from "../../../../lib/prisma";
import { PlanTier } from "../../../../../generated/prisma/client";

export const handleCreateOrUpdatePlan = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const { name, tier, maxTenants, priceMonthly, features, isActive } = req.body;

  if (!name || !tier || maxTenants === undefined || priceMonthly === undefined) {
    return res.status(400).json({
      error: "Missing required fields (name, tier, maxTenants, priceMonthly)",
    });
  }

  // Validate tier enum
  const validTiers = Object.values(PlanTier);
  if (!validTiers.includes(tier as PlanTier)) {
    return res.status(400).json({
      error: `Invalid tier. Must be one of: ${validTiers.join(", ")}`,
    });
  }

  try {
    const plan = await prisma.plan.upsert({
      where: { name },
      create: {
        name,
        tier: tier as PlanTier,
        max_tenants: parseInt(maxTenants, 10),
        price_monthly: parseFloat(priceMonthly),
        features: features || {},
        is_active: isActive !== undefined ? !!isActive : true,
      },
      update: {
        tier: tier as PlanTier,
        max_tenants: parseInt(maxTenants, 10),
        price_monthly: parseFloat(priceMonthly),
        features: features || {},
        is_active: isActive !== undefined ? !!isActive : true,
      },
    });

    return res.status(200).json({
      message: "Subscription plan saved successfully",
      plan,
    });
  } catch (error) {
    console.error("Create or update plan error:", error);
    return res.status(500).json({ error: "An error occurred while saving the subscription plan" });
  }
};
