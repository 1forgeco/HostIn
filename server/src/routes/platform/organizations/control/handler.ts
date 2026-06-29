import { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { AccountStatus, AccessDecision, OrgRole, RoleDashboardStatus } from "../../../../../generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";

export const handleGetOrganizationControl = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      onboarding: true,
      people: { orderBy: { full_name: "asc" } },
      floors: { include: { rooms: { orderBy: { room_number: "asc" } } }, orderBy: { floor_number: "asc" } },
      role_dashboards: { orderBy: { role: "asc" } },
      role_feature_permissions: { orderBy: [{ role: "asc" }, { feature_key: "asc" }] },
      access_overrides: { include: { user: { select: { full_name: true, email: true } } }, orderBy: { updated_at: "desc" } },
      user_org_roles: { include: { user: { select: { id: true, full_name: true, email: true, phone: true, account_status: true, force_password_change: true, last_login_at: true, is_active: true } } }, orderBy: { created_at: "asc" } },
    },
  });
  if (!organization) return res.status(404).json({ error: "Organization not found" });
  const accounts = Array.from(new Map(organization.user_org_roles.map((membership) => [membership.user.id, { ...membership.user, roles: organization.user_org_roles.filter((item) => item.user_id === membership.user.id).map((item) => item.role) }])).values());
  return res.json({ control: { onboarding: organization.onboarding, people: organization.people, floors: organization.floors, accounts, roleDashboards: organization.role_dashboards, rolePermissions: organization.role_feature_permissions, accessOverrides: organization.access_overrides } });
};

export const handleUpdateRoleDashboard = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const role = req.params.role as OrgRole;
  const status = req.body.status as RoleDashboardStatus;
  if (!Object.values(OrgRole).includes(role) || !Object.values(RoleDashboardStatus).includes(status)) return res.status(400).json({ error: "Invalid role dashboard status" });
  const dashboard = await prisma.roleDashboard.upsert({ where: { org_id_role: { org_id: orgId, role } }, create: { org_id: orgId, role, status }, update: { status } });
  await prisma.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "update_role_dashboard", entity_type: "organization", entity_id: orgId, details: { role, status } } });
  return res.json({ dashboard });
};

export const handleUpdateRolePermission = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const role = req.params.role as OrgRole;
  const featureKey = req.params.featureKey as string;
  if (!Object.values(OrgRole).includes(role) || !featureKey) return res.status(400).json({ error: "Invalid role or feature" });
  const permission = await prisma.roleFeaturePermission.upsert({ where: { org_id_role_feature_key: { org_id: orgId, role, feature_key: featureKey } }, create: { org_id: orgId, role, feature_key: featureKey, is_allowed: req.body.isAllowed !== false, permissions: req.body.permissions }, update: { is_allowed: req.body.isAllowed !== false, permissions: req.body.permissions } });
  return res.json({ permission });
};

export const handleUpdateAccountStatus = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const userId = req.params.userId as string;
  const status = req.body.status as AccountStatus;
  if (!Object.values(AccountStatus).includes(status)) return res.status(400).json({ error: "Invalid account status" });
  const membership = await prisma.userOrgRole.findFirst({ where: { org_id: orgId, user_id: userId } });
  if (!membership) return res.status(404).json({ error: "Account not found in this workspace" });
  const user = await prisma.user.update({ where: { id: userId }, data: { account_status: status, is_active: !["archived", "left"].includes(status) } });
  await prisma.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "update_account_status", entity_type: "user", entity_id: userId, details: { orgId, status } } });
  return res.json({ account: { id: user.id, status: user.account_status } });
};

export const handleResetAccountPassword = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const userId = req.params.userId as string;
  const membership = await prisma.userOrgRole.findFirst({ where: { org_id: orgId, user_id: userId }, include: { user: true } });
  if (!membership) return res.status(404).json({ error: "Account not found in this workspace" });
  const firstName = membership.user.full_name.split(" ")[0].replace(/[^a-z]/gi, "").slice(0, 8) || "Hostin";
  const temporaryPassword = `${firstName}@${crypto.randomInt(1000, 9999)}`;
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password_hash: passwordHash, force_password_change: true, account_status: "active", is_active: true } });
  await prisma.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "reset_password", entity_type: "user", entity_id: userId, details: { orgId } } });
  return res.json({ account: { userId, loginId: membership.user.email, temporaryPassword } });
};

const overrideSchema = z.object({ userId: z.string().uuid(), role: z.nativeEnum(OrgRole), featureKey: z.string().trim().min(1).max(255), decision: z.nativeEnum(AccessDecision), reason: z.string().trim().max(1000).optional(), expiresAt: z.string().optional() });
export const handleUpsertAccessOverride = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const parsed = overrideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid access override", details: parsed.error.flatten().fieldErrors });
  const value = parsed.data;
  const membership = await prisma.userOrgRole.findFirst({ where: { org_id: orgId, user_id: value.userId, role: value.role } });
  if (!membership) return res.status(404).json({ error: "The selected user does not have this role" });
  const override = await prisma.accessOverride.upsert({ where: { org_id_user_id_role_feature_key: { org_id: orgId, user_id: value.userId, role: value.role, feature_key: value.featureKey } }, create: { org_id: orgId, user_id: value.userId, role: value.role, feature_key: value.featureKey, decision: value.decision, reason: value.reason, expires_at: value.expiresAt ? new Date(value.expiresAt) : null }, update: { decision: value.decision, reason: value.reason, expires_at: value.expiresAt ? new Date(value.expiresAt) : null } });
  return res.json({ override });
};

export const handleDeleteAccessOverride = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const result = await prisma.accessOverride.deleteMany({ where: { id: req.params.overrideId as string, org_id: orgId } });
  if (!result.count) return res.status(404).json({ error: "Access override not found" });
  return res.status(204).send();
};
