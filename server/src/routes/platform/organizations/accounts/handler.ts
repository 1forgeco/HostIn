import { Response } from "express";
import bcrypt from "bcryptjs";
import { OrgRole } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";
import { z } from "zod";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const accountSchema = z.object({ fullName: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email(), phone: z.string().trim().min(7).max(20), password: z.string().min(12).max(128), role: z.nativeEnum(OrgRole), accountSlug: z.string().trim().max(120).optional() });

export const handleCreateOrganizationAccount = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const parsed = accountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid account details", details: parsed.error.flatten().fieldErrors });
  const { fullName, email, phone, password, role, accountSlug } = parsed.data;
  const organization = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true, slug: true } });
  if (!organization) return res.status(404).json({ error: "Organization not found" });
  const baseSlug = slugify(accountSlug || fullName) || role;
  const duplicate = await prisma.userOrgRole.findFirst({ where: { org_id: orgId, account_slug: baseSlug } });
  if (duplicate) return res.status(409).json({ error: "This account slug is already used in the workspace" });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { OR: [{ email }, { phone }] } });
      const user = existing ? await tx.user.update({ where: { id: existing.id }, data: { full_name: fullName, password_hash: passwordHash, is_active: true } }) : await tx.user.create({ data: { full_name: fullName, email, phone, password_hash: passwordHash, is_active: true } });
      const membership = await tx.userOrgRole.upsert({ where: { user_id_org_id_role: { user_id: user.id, org_id: orgId, role: role as OrgRole } }, update: { is_active: true, is_primary: true, account_slug: baseSlug }, create: { user_id: user.id, org_id: orgId, role: role as OrgRole, account_slug: baseSlug, is_primary: true, is_active: true } });
      await tx.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "create_account", entity_type: "organization_account", entity_id: membership.id, details: { orgId, email, role, accountSlug: baseSlug } } });
      return { user, membership };
    });
    return res.status(201).json({ account: { userId: result.user.id, email: result.user.email, fullName: result.user.full_name, role: result.membership.role, accountSlug: result.membership.account_slug, destination: `/${organization.slug}/${result.membership.role}/${result.membership.account_slug}` } });
  } catch (error) {
    console.error("Platform account creation error:", error);
    return res.status(500).json({ error: "Unable to create workspace account" });
  }
};
