import { Response } from "express";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { OrgRole, OwnerRequestType, Prisma } from "../../../../generated/prisma/client";
import { invalidateRuntimeCache } from "../../../lib/runtimeCache";
import { applyWorkspaceCommerceChanges, normalizeFeatureKeys } from "../../../lib/ownerCommerce";
import { notifyRoles } from "../../../lib/notifications";

const requestSchema = z.object({
  type: z.nativeEnum(OwnerRequestType),
  title: z.string().trim().min(3).max(255),
  personName: z.string().trim().max(255).optional().nullable(),
  role: z.nativeEnum(OrgRole).optional().nullable(),
  propertyName: z.string().trim().max(255).optional().nullable(),
  department: z.string().trim().max(255).optional().nullable(),
  reason: z.string().trim().max(2000).optional().nullable(),
  requiredAccess: z.string().trim().max(2000).optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
});

const purchaseSchema = z.object({
  planId: z.string().uuid().optional().nullable(),
  targetCapacity: z.coerce.number().int().min(0).optional().nullable(),
  featureKeys: z.array(z.string().trim().min(1)).default([]),
  amount: z.coerce.number().min(0).default(0),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  paymentGateway: z.string().trim().max(80).default("manual"),
  gatewayOrderId: z.string().trim().max(255).optional().nullable(),
  gatewayPaymentId: z.string().trim().max(255).optional().nullable(),
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(3000),
});

const requestInclude = {
  organization: { select: { id: true, name: true } },
  requested_by_user: { select: { full_name: true } },
  events: { orderBy: { created_at: "asc" as const } },
};

export const handleListOwnerRequests = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const type = req.query.type as OwnerRequestType | undefined;

  try {
    const requests = await prisma.ownerRequest.findMany({
      where: { org_id: orgId, ...(type ? { type } : {}) },
      include: requestInclude,
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("List owner requests error:", error);
    return res.status(500).json({ error: "Unable to load owner requests" });
  }
};

export const handleCreateOwnerRequest = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId as string;
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request payload", details: parsed.error.flatten().fieldErrors });
  }

  try {
    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.ownerRequest.create({
        data: {
          org_id: orgId,
          requested_by: userId,
          type: parsed.data.type,
          title: parsed.data.title,
          person_name: parsed.data.personName || null,
          role: parsed.data.role || null,
          property_name: parsed.data.propertyName || null,
          department: parsed.data.department || null,
          reason: parsed.data.reason || null,
          required_access: parsed.data.requiredAccess || null,
          details: parsed.data.details ? (parsed.data.details as Prisma.InputJsonObject) : undefined,
        },
      });
      await tx.ownerRequestEvent.create({
        data: {
          request_id: created.id,
          org_id: orgId,
          actor_user_id: userId,
          actor_label: "Owner",
          event_type: "message",
          to_status: created.status,
          message: parsed.data.reason || parsed.data.requiredAccess || "Request submitted.",
        },
      });
      return created;
    });
    invalidateRuntimeCache(orgId);

    await prisma.auditLog.create({
      data: {
        org_id: orgId,
        user_id: userId,
        action: "owner_request_submitted",
        entity_type: "owner_request",
        entity_id: request.id,
        new_value: { type: request.type, status: request.status, title: request.title },
      },
    });

    return res.status(201).json({ request });
  } catch (error) {
    console.error("Create owner request error:", error);
    return res.status(500).json({ error: "Unable to submit owner request" });
  }
};

export const handleGetOwnerPurchaseOptions = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;

  try {
    const [organization, plans] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        include: { plan: true, org_features: true, _count: { select: { tenant_profiles: { where: { is_active: true, status: "active" } } } } },
      }),
      prisma.plan.findMany({ where: { is_active: true }, orderBy: [{ price_monthly: "desc" }, { max_tenants: "asc" }] }),
    ]);
    if (!organization) return res.status(404).json({ error: "Organization not found" });
    return res.status(200).json({
      organization: {
        id: organization.id,
        planId: organization.plan_id,
        planName: organization.plan.name,
        totalCapacity: organization.total_capacity,
        activeTenants: organization._count.tenant_profiles,
        activeFeatures: organization.org_features.filter((feature) => feature.is_enabled).map((feature) => feature.feature_key),
      },
      plans,
    });
  } catch (error) {
    console.error("Owner purchase options error:", error);
    return res.status(500).json({ error: "Unable to load purchase options" });
  }
};

export const handleCreateOwnerPurchase = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId as string;
  const parsed = purchaseSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid purchase payload", details: parsed.error.flatten().fieldErrors });
  }

  try {
    const [organization, plan] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, include: { plan: true } }),
      parsed.data.planId ? prisma.plan.findUnique({ where: { id: parsed.data.planId } }) : null,
    ]);
    if (!organization) return res.status(404).json({ error: "Organization not found" });
    if (parsed.data.planId && !plan) return res.status(400).json({ error: "Selected plan does not exist" });
    if (parsed.data.targetCapacity !== undefined && parsed.data.targetCapacity !== null && parsed.data.targetCapacity < organization.total_capacity) {
      return res.status(400).json({ error: "Bed capacity cannot be reduced through checkout. Contact 1Forge support." });
    }

    const featureKeys = normalizeFeatureKeys(parsed.data.featureKeys);
    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.ownerRequest.create({
        data: {
          org_id: orgId,
          requested_by: userId,
          type: parsed.data.planId ? "plan_upgrade" : "feature_request",
          status: "activated",
          title: "Billing purchase activated",
          reason: "Owner completed checkout for subscription changes.",
          required_access: featureKeys.join(", ") || null,
          details: {
            planId: parsed.data.planId,
            planName: plan?.name,
            targetCapacity: parsed.data.targetCapacity,
            featureKeys,
            amount: parsed.data.amount,
            billingCycle: parsed.data.billingCycle,
            paymentGateway: parsed.data.paymentGateway,
            gatewayOrderId: parsed.data.gatewayOrderId,
            gatewayPaymentId: parsed.data.gatewayPaymentId,
          },
        },
      });
      await applyWorkspaceCommerceChanges(tx, { orgId, ownerUserId: userId, planId: parsed.data.planId, targetCapacity: parsed.data.targetCapacity, featureKeys });
      await tx.ownerRequestEvent.createMany({
        data: [
          {
            request_id: created.id,
            org_id: orgId,
            actor_user_id: userId,
            actor_label: "Owner",
            event_type: "payment",
            to_status: "activated",
            message: `Payment captured for ₹${parsed.data.amount.toLocaleString("en-IN")}.`,
            metadata: { gateway: parsed.data.paymentGateway, orderId: parsed.data.gatewayOrderId, paymentId: parsed.data.gatewayPaymentId },
          },
          {
            request_id: created.id,
            org_id: orgId,
            actor_user_id: userId,
            actor_label: "System",
            event_type: "fulfillment",
            to_status: "activated",
            message: "Plan, bed capacity, and selected extensions were activated automatically.",
            metadata: { planId: parsed.data.planId, targetCapacity: parsed.data.targetCapacity, featureKeys },
          },
        ],
      });
      await tx.auditLog.create({
        data: {
          org_id: orgId,
          user_id: userId,
          action: "owner_purchase_activated",
          entity_type: "owner_request",
          entity_id: created.id,
          new_value: { planId: parsed.data.planId, targetCapacity: parsed.data.targetCapacity, featureKeys, amount: parsed.data.amount },
        },
      });
      return created;
    });

    invalidateRuntimeCache(orgId);
    await notifyRoles(prisma, ["owner"], { orgId, title: "Subscription changes activated", body: "Your plan, bed capacity, and purchased extensions are now active.", type: "other", referenceId: request.id, referenceType: "owner_request" });
    return res.status(201).json({ request });
  } catch (error) {
    console.error("Owner purchase error:", error);
    return res.status(500).json({ error: "Unable to complete purchase" });
  }
};

export const handleCreateOwnerRequestMessage = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId as string;
  const requestId = req.params.id as string;
  const parsed = messageSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Message is required" });

  try {
    const request = await prisma.ownerRequest.findFirst({ where: { id: requestId, org_id: orgId } });
    if (!request) return res.status(404).json({ error: "Request not found" });
    const event = await prisma.ownerRequestEvent.create({
      data: {
        request_id: request.id,
        org_id: orgId,
        actor_user_id: userId,
        actor_label: "Owner",
        event_type: "message",
        to_status: request.status,
        message: parsed.data.message,
      },
    });
    invalidateRuntimeCache(orgId);
    return res.status(201).json({ event });
  } catch (error) {
    console.error("Owner request message error:", error);
    return res.status(500).json({ error: "Unable to send message" });
  }
};
