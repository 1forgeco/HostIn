import { Response } from "express";
import crypto from "crypto";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleRequestPass = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;

  const { purpose, destination, expectedOutTime, expectedReturnTime } = req.body;

  if (!purpose || !destination || !expectedOutTime || !expectedReturnTime) {
    return res.status(400).json({
      error: "Missing required fields (purpose, destination, expectedOutTime, expectedReturnTime)",
    });
  }

  // Validate dates
  const outTime = new Date(expectedOutTime);
  const returnTime = new Date(expectedReturnTime);

  if (isNaN(outTime.getTime()) || isNaN(returnTime.getTime())) {
    return res.status(400).json({ error: "Invalid date format for out/return times" });
  }

  if (returnTime <= outTime) {
    return res.status(400).json({ error: "expectedReturnTime must be after expectedOutTime" });
  }

  try {
    // Check if the user is a tenant in the organization
    const tenantProfile = await prisma.tenantProfile.findFirst({
      where: {
        user_id: userId,
        org_id: orgId,
        is_active: true,
      },
    });

    if (!tenantProfile) {
      return res.status(403).json({ error: "Only active tenants can request a gate pass" });
    }

    const qrCode = `GP-${crypto.randomUUID()}`;

    const gatePass = await prisma.$transaction(async (tx) => {
      const created = await tx.gatePass.create({ data: {
        org_id: orgId,
        tenant_id: userId as string,
        purpose,
        destination,
        expected_out_time: outTime,
        expected_return_time: returnTime,
        status: "pending",
        qr_code: qrCode,
      } });
      const reviewers = await tx.userOrgRole.findMany({ where: { org_id: orgId, role: { in: ["owner", "warden", "guard"] }, is_active: true }, select: { user_id: true } });
      const userIds = [...new Set(reviewers.map((item) => item.user_id))];
      if (userIds.length) await tx.notification.createMany({ data: userIds.map((reviewerId) => ({ org_id: orgId, user_id: reviewerId, title: "Gate pass awaiting review", body: `${purpose} · ${destination}`, type: "gate_pass" as const, reference_id: created.id, reference_type: "gate_pass" })) });
      return created;
    });

    return res.status(201).json({
      message: "Gate pass requested successfully",
      gatePass,
    });
  } catch (error) {
    console.error("Request gate pass error:", error);
    return res.status(500).json({ error: "An error occurred during gate pass request" });
  }
};
