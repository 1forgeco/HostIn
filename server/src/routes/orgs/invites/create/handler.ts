import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../../../../middleware/auth";
import { prisma } from "../../../../lib/prisma";
import { OrgRole } from "../../../../../generated/prisma/client";

export const handleCreateInvite = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { orgId, emailOrPhone, role } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!orgId || !emailOrPhone || !role) {
    return res.status(400).json({ error: "Missing required fields (orgId, emailOrPhone, role)" });
  }

  // Validate role
  const validRoles = Object.values(OrgRole);
  if (!validRoles.includes(role as OrgRole)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
  }

  try {
    // Check if the requesting user has a role in the organization
    const requesterRole = await prisma.userOrgRole.findFirst({
      where: {
        user_id: userId,
        org_id: orgId,
        is_active: true,
      },
    });

    if (!requesterRole) {
      return res.status(403).json({ error: "You do not have access to this organization" });
    }

    // Only 'owner' or 'warden' can invite
    if (requesterRole.role !== "owner" && requesterRole.role !== "warden") {
      return res.status(403).json({ error: "Only owners and wardens can invite new members" });
    }

    // Wardens cannot invite owners
    if (requesterRole.role === "warden" && role === "owner") {
      return res.status(403).json({ error: "Wardens cannot invite owner accounts" });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

    // Create onboarding invite
    const invite = await prisma.onboardingInvite.create({
      data: {
        org_id: orgId,
        invited_by: userId,
        email_phone: emailOrPhone,
        role: role as OrgRole,
        token: token,
        expires_at: expiresAt,
        status: "pending",
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Onboarding invite created successfully",
      invite: {
        id: invite.id,
        orgId: invite.org_id,
        orgName: invite.organization.name,
        emailOrPhone: invite.email_phone,
        role: invite.role,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expires_at,
      },
    });
  } catch (error) {
    console.error("Create onboarding invite error:", error);
    return res.status(500).json({ error: "An error occurred creating onboarding invite" });
  }
};
