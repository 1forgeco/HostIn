import { Response } from "express";
import { z } from "zod";
import { OwnerRequestStatus, Prisma } from "../../../../generated/prisma/client";
import { applyWorkspaceCommerceChanges, normalizeFeatureKeys } from "../../../lib/ownerCommerce";
import { prisma } from "../../../lib/prisma";
import { notifyRoles } from "../../../lib/notifications";
import { invalidateRuntimeCache } from "../../../lib/runtimeCache";
import { PlatformAuthenticatedRequest } from "../../../middleware/platformAuth";

const statusSchema = z.object({
  status: z.nativeEnum(OwnerRequestStatus),
  message: z.string().trim().max(3000).optional().nullable(),
  applyChanges: z.boolean().default(false),
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(3000),
});

const requestInclude = {
  organization: { select: { id: true, name: true, slug: true } },
  requested_by_user: { select: { full_name: true, email: true } },
  events: { orderBy: { created_at: "asc" as const } },
};

const detailsObject = (value: Prisma.JsonValue | null | undefined) => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

export const handleListPlatformRequests = async (_req: PlatformAuthenticatedRequest, res: Response) => {
  try {
    const requests = await prisma.ownerRequest.findMany({
      include: requestInclude,
      orderBy: { updated_at: "desc" },
      take: 200,
    });
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("List platform requests error:", error);
    return res.status(500).json({ error: "Unable to load client requests" });
  }
};

export const handleUpdatePlatformRequestStatus = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const requestId = req.params.id as string;
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request status payload", details: parsed.error.flatten().fieldErrors });

  try {
    const current = await prisma.ownerRequest.findUnique({ where: { id: requestId }, include: { requested_by_user: true } });
    if (!current) return res.status(404).json({ error: "Request not found" });

    const details = detailsObject(current.details);
    const planId = typeof details.planId === "string" ? details.planId : null;
    const targetCapacity = typeof details.targetCapacity === "number" ? details.targetCapacity : null;
    const featureKeys = Array.isArray(details.featureKeys) ? normalizeFeatureKeys(details.featureKeys.filter((key): key is string => typeof key === "string")) : [];

    const request = await prisma.$transaction(async (tx) => {
      if (parsed.data.applyChanges) {
        const ownerRole = await tx.userOrgRole.findFirst({ where: { org_id: current.org_id, role: "owner", is_active: true } });
        await applyWorkspaceCommerceChanges(tx, {
          orgId: current.org_id,
          ownerUserId: ownerRole?.user_id ?? current.requested_by,
          planId,
          targetCapacity,
          featureKeys,
        });
      }

      const updated = await tx.ownerRequest.update({
        where: { id: current.id },
        data: { status: parsed.data.status },
        include: requestInclude,
      });
      await tx.ownerRequestEvent.create({
        data: {
          request_id: current.id,
          org_id: current.org_id,
          actor_platform_user_id: req.platformUser?.id,
          actor_label: req.platformUser?.fullName ?? "1Forge Admin",
          event_type: parsed.data.applyChanges ? "fulfillment" : "status_change",
          from_status: current.status,
          to_status: parsed.data.status,
          message: parsed.data.message || (parsed.data.applyChanges ? "Admin applied requested subscription changes." : `Request marked ${parsed.data.status}.`),
          metadata: parsed.data.applyChanges ? { planId, targetCapacity, featureKeys } : undefined,
        },
      });
      await tx.platformAuditLog.create({
        data: {
          platform_user_id: req.platformUser?.id as string,
          action: parsed.data.applyChanges ? "fulfill_owner_request" : "update_owner_request_status",
          entity_type: "owner_request",
          entity_id: current.id,
          details: { status: parsed.data.status, applyChanges: parsed.data.applyChanges },
        },
      });
      return updated;
    });

    invalidateRuntimeCache(current.org_id);
    await notifyRoles(prisma, ["owner"], { orgId: current.org_id, title: "1Forge updated your request", body: parsed.data.message || `Your request is now ${parsed.data.status}.`, type: "other", referenceId: current.id, referenceType: "owner_request" });
    return res.status(200).json({ request });
  } catch (error) {
    console.error("Update platform request error:", error);
    return res.status(500).json({ error: "Unable to update client request" });
  }
};

export const handleCreatePlatformRequestMessage = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const requestId = req.params.id as string;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Message is required" });

  try {
    const request = await prisma.ownerRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: "Request not found" });
    const event = await prisma.ownerRequestEvent.create({
      data: {
        request_id: request.id,
        org_id: request.org_id,
        actor_platform_user_id: req.platformUser?.id,
        actor_label: req.platformUser?.fullName ?? "1Forge Admin",
        event_type: "message",
        to_status: request.status,
        message: parsed.data.message,
      },
    });
    invalidateRuntimeCache(request.org_id);
    await notifyRoles(prisma, ["owner"], { orgId: request.org_id, title: "New 1Forge support reply", body: parsed.data.message, type: "other", referenceId: request.id, referenceType: "owner_request" });
    return res.status(201).json({ event });
  } catch (error) {
    console.error("Platform request message error:", error);
    return res.status(500).json({ error: "Unable to send admin message" });
  }
};
