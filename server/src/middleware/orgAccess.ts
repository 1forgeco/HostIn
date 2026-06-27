import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { prisma } from "../lib/prisma";
import { OrgRole } from "../../generated/prisma/client";

export interface AuthorizedRequest extends AuthenticatedRequest {
  userOrgRole?: OrgRole;
}

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
      // Look up user role in this organization
      const userOrgRole = await prisma.userOrgRole.findFirst({
        where: {
          user_id: userId,
          org_id: orgId,
          is_active: true,
        },
        include: { organization: { select: { is_active: true, plan_status: true, plan_expires_at: true } } },
      });

      if (!userOrgRole) {
        return res.status(403).json({ error: "Access denied. You do not belong to this organization." });
      }

      const subscriptionBlocked = !userOrgRole.organization.is_active || ["paused", "canceled", "expired"].includes(userOrgRole.organization.plan_status);
      const subscriptionExpired = userOrgRole.organization.plan_expires_at && userOrgRole.organization.plan_expires_at < new Date();
      if (subscriptionBlocked || subscriptionExpired) return res.status(402).json({ error: "Workspace subscription is inactive", code: "SUBSCRIPTION_INACTIVE" });

      // Check if user's role is allowed
      if (!allowedRoles.includes(userOrgRole.role)) {
        return res.status(403).json({
          error: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`,
        });
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
