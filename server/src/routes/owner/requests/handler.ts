import { Response } from "express";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { OrgRole, OwnerRequestType, Prisma } from "../../../../generated/prisma/client";

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

export const handleListOwnerRequests = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const type = req.query.type as OwnerRequestType | undefined;

  try {
    const requests = await prisma.ownerRequest.findMany({
      where: { org_id: orgId, ...(type ? { type } : {}) },
      include: { requested_by_user: { select: { full_name: true } } },
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
    const request = await prisma.ownerRequest.create({
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
