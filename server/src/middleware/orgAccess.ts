import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { OrgRole } from "../../generated/prisma/client";
import { getAccessSnapshot } from "../lib/accessSnapshot";

export interface AuthorizedRequest extends AuthenticatedRequest {
  userOrgRole?: OrgRole;
}

const featureForRequest = (url: string) => {
  const routes: [string, string][] = [
    ["/api/rooms", "rooms"], ["/api/dues", "dues"], ["/api/payments", "dues"],
    ["/api/gate-passes", "gate_pass"], ["/api/visitors", "visitor_log"],
    ["/api/announcements", "community"], ["/api/complaints", "community"],
    ["/api/community", "community"], ["/api/mess-menus", "mess_menu"],
    ["/api/mess-feedback", "mess_menu"], ["/api/documents", "documents"],
    ["/api/parents", "parent_portal"],
  ];
  return routes.find(([prefix]) => url.startsWith(prefix))?.[1];
};

export const checkOrgAccess = (allowedRoles: OrgRole[]) => {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Try to retrieve orgId from header, request params, body, or query params
    const orgId =
      (req.headers["x-org-id"] as string) ||
      req.params.orgId ||
      req.body.orgId ||
      (req.query.orgId as string);

    if (!orgId) {
      return res.status(400).json({ error: "Missing x-org-id header or orgId parameter" });
    }

    try {
      const featureKey = featureForRequest(req.originalUrl);
      const access = await getAccessSnapshot(userId, orgId);

      if (!access) {
        return res.status(403).json({ error: "Access denied. You do not belong to this organization." });
      }
      const { membership: userOrgRole, dashboard, permissions, overrides } = access;

      if (!userOrgRole.user.is_active || userOrgRole.user.account_status !== "active") {
        return res.status(403).json({ error: "This user account is not active", code: "ACCOUNT_INACTIVE" });
      }

      const subscriptionBlocked = !userOrgRole.organization.is_active || userOrgRole.organization.workspace_status !== "active" || ["paused", "canceled", "expired"].includes(userOrgRole.organization.plan_status);
      const subscriptionExpired = userOrgRole.organization.plan_expires_at && userOrgRole.organization.plan_expires_at < new Date();
      if (subscriptionBlocked || subscriptionExpired) return res.status(402).json({ error: "Workspace subscription is inactive", code: "SUBSCRIPTION_INACTIVE" });

      if (featureKey) {
        const planFeatures = (userOrgRole.organization.plan.features ?? {}) as Record<string, unknown>;
        const featureOverride = userOrgRole.organization.org_features.find((feature) => feature.feature_key === featureKey);
        const featureEnabled = featureOverride ? featureOverride.is_enabled : planFeatures[featureKey] !== false;
        if (!featureEnabled) return res.status(403).json({ error: `${featureKey} is disabled for this workspace`, code: "FEATURE_DISABLED" });
      }

      // Check if user's role is allowed
      if (!allowedRoles.includes(userOrgRole.role)) {
        return res.status(403).json({
          error: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
        });
      }

      const legacyRoleToggle = userOrgRole.organization.org_features.find((feature) => feature.feature_key === `role_${userOrgRole.role}`);
      if ((dashboard && dashboard.status !== "active") || (!dashboard && legacyRoleToggle?.is_enabled === false)) {
        return res.status(403).json({ error: `${userOrgRole.role} dashboard is inactive`, code: "ROLE_DASHBOARD_INACTIVE" });
      }

      if (featureKey) {
        const permission = permissions.find((item) => item.feature_key === featureKey);
        const override = overrides.find((item) => item.feature_key === featureKey);
        if (override?.decision === "block") return res.status(403).json({ error: `${featureKey} is blocked for this account`, code: "USER_FEATURE_BLOCKED" });
        if (permission?.is_allowed === false && override?.decision !== "allow") return res.status(403).json({ error: `${featureKey} is not allowed for the ${userOrgRole.role} role`, code: "ROLE_FEATURE_DISABLED" });
      }

      // Set/normalize headers and attach the role to the request
      req.headers["x-org-id"] = orgId;
      req.userOrgRole = userOrgRole.role;

      next();
    } catch (error) {
      console.error("Organization access check error:", error);
      return res.status(500).json({ error: "Internal server error during authorization check" });
    }
  };
};
