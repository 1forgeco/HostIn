import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const checkFeatureAccess = (featureKey: string) => async (req: Request, res: Response, next: NextFunction) => {
  const orgId = req.headers["x-org-id"] as string;
  if (!orgId) return next();
  try {
    const organization = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: { select: { features: true } }, org_features: { where: { feature_key: featureKey }, take: 1 } } });
    if (!organization) return res.status(404).json({ error: "Organization not found" });
    const override = organization.org_features[0];
    const planFeatures = (organization.plan.features ?? {}) as Record<string, unknown>;
    const enabled = override ? override.is_enabled : planFeatures[featureKey] !== false;
    if (!enabled) return res.status(403).json({ error: `${featureKey} is disabled for this workspace`, code: "FEATURE_DISABLED" });
    next();
  } catch (error) {
    console.error("Feature access check error:", error);
    return res.status(500).json({ error: "Unable to verify feature access" });
  }
};
