import { Response } from "express";
import crypto from "crypto";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyRoles } from "../../../lib/notifications";
import { expireUnusedGatePasses } from "../../../lib/gatePassLifecycle";

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
    await expireUnusedGatePasses(prisma, orgId, userId);
    const [tenantProfile, openPass] = await Promise.all([
      prisma.tenantProfile.findFirst({ where: { user_id: userId, org_id: orgId, is_active: true } }),
      prisma.gatePass.findFirst({ where: { org_id: orgId, tenant_id: userId, status: { in: ["pending", "approved"] } }, orderBy: { created_at: "desc" } }),
    ]);

    if (!tenantProfile) {
      return res.status(403).json({ error: "Only active tenants can request a gate pass" });
    }
    if (openPass) {
      return res.status(409).json({ error: "Complete or cancel your current gate pass before creating another.", activeGatePass: openPass });
    }

    const qrCode = `GP-${crypto.randomUUID()}`;

    const gatePass = await prisma.gatePass.create({ data: {
        org_id: orgId,
        tenant_id: userId as string,
        purpose,
        destination,
        expected_out_time: outTime,
        expected_return_time: returnTime,
        status: "pending",
        qr_code: qrCode,
      } });

    res.status(201).json({
      message: "Gate pass requested successfully",
      gatePass,
    });
    try {
      await notifyRoles(prisma, ["owner", "warden", "guard"], { orgId, title: "Gate pass awaiting review", body: `${purpose} · ${destination}`, type: "gate_pass", referenceId: gatePass.id, referenceType: "gate_pass" }, userId);
    } catch (notificationError) {
      console.error("Gate pass notification error:", notificationError);
    }
    return;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return res.status(409).json({ error: "You already have an open gate pass." });
    }
    console.error("Request gate pass error:", error);
    return res.status(500).json({ error: "An error occurred during gate pass request" });
  }
};
