import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { VisitStatus } from "../../../../generated/prisma/client";
import { notifyRoles, notifyTenantCircle } from "../../../lib/notifications";

export const handleCreateVisitor = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { tenantId, visitorName, visitorPhone, visitorRelation, visitorIdProof, purpose, expectedVisitTime } = req.body;

  if (!tenantId || !visitorName || !visitorPhone || !visitorRelation || !purpose || !expectedVisitTime) {
    return res.status(400).json({
      error: "Missing required fields (tenantId, visitorName, visitorPhone, visitorRelation, purpose, expectedVisitTime)",
    });
  }

  // Tenant restriction check
  if (userRole === "tenant" && tenantId !== userId) {
    return res.status(403).json({ error: "Access denied. Tenants can only request visitors for themselves." });
  }

  const visitTime = new Date(expectedVisitTime);
  if (isNaN(visitTime.getTime())) {
    return res.status(400).json({ error: "Invalid expectedVisitTime date format" });
  }

  try {
    // Verify target tenant belongs to the organization
    const tenantProfile = await prisma.tenantProfile.findFirst({
      where: {
        user_id: tenantId,
        org_id: orgId,
        is_active: true,
      },
    });

    if (!tenantProfile) {
      return res.status(400).json({ error: "The host tenant does not have an active profile in this organization" });
    }

    const initialStatus: VisitStatus = VisitStatus.approved;

    const visitor = await prisma.$transaction(async (tx) => {
      const created = await tx.visitor.create({ data: {
        org_id: orgId,
        tenant_id: tenantId,
        visitor_name: visitorName,
        visitor_phone: visitorPhone,
        visitor_relation: visitorRelation,
        visitor_id_proof: visitorIdProof || null,
        purpose,
        expected_visit_time: visitTime,
        status: initialStatus,
        approved_by: initialStatus === VisitStatus.approved ? userId : null,
      } });
      const notice = { orgId, title: `Visitor registered: ${visitorName}`, body: `${purpose} · ${visitTime.toLocaleString("en-IN")}`, type: "visitor" as const, referenceId: created.id, referenceType: "visitor" };
      await notifyTenantCircle(tx, tenantId, notice, userId);
      await notifyRoles(tx, ["owner", "warden", "guard"], notice, userId);
      return created;
    });

    return res.status(201).json({
      message: "Visitor record created successfully",
      visitor,
    });
  } catch (error) {
    console.error("Create visitor record error:", error);
    return res.status(500).json({ error: "An error occurred creating the visitor record" });
  }
};
