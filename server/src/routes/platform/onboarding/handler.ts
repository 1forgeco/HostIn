import { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { OrgRole, RoomType } from "../../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { syncCurrentRentDue } from "../../../lib/rentBilling";
import { PlatformAuthenticatedRequest } from "../../../middleware/platformAuth";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const roleAliases: Record<string, OrgRole> = {
  owner: "owner",
  warden: "warden",
  guard: "guard",
  security: "guard",
  tenant: "tenant",
  parent: "parent",
  staff: "staff",
  mess_manager: "staff",
  maintenance: "staff",
  accountant: "staff",
};

const createSchema = z.object({
  name: z.string().trim().min(2).max(255),
  ownerName: z.string().trim().min(2).max(255),
  ownerPhone: z.string().trim().min(7).max(20),
  ownerEmail: z.string().trim().email().optional().or(z.literal("")),
  cityState: z.string().trim().min(2).max(255),
  address: z.string().trim().max(2000).optional(),
  slug: z.string().trim().min(2).max(120).transform(slugify),
  clientType: z.string().trim().min(2).max(50),
  branchCount: z.coerce.number().int().min(1).max(100).default(1),
  planId: z.string().uuid(),
  startDate: z.string().optional(),
  billingCycle: z.enum(["monthly", "quarterly", "annual"]).default("monthly"),
});

const stepSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

const jsonObject = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const jsonArray = (value: unknown): Record<string, any>[] => Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as Record<string, any>[] : [];

export const handleCreateOnboarding = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid client details", details: parsed.error.flatten().fieldErrors });
  const input = parsed.data;
  try {
    const existing = await prisma.organization.findUnique({ where: { slug: input.slug } });
    if (existing) return res.status(409).json({ error: "This workspace slug is already in use" });
    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan) return res.status(400).json({ error: "Selected plan does not exist" });
    const organization = await prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        owner_name: input.ownerName,
        contact_phone: input.ownerPhone,
        contact_email: input.ownerEmail || null,
        city_state: input.cityState,
        address: input.address || null,
        client_type: input.clientType,
        branch_count: input.branchCount,
        billing_cycle: input.billingCycle,
        start_date: input.startDate ? new Date(input.startDate) : null,
        plan_id: input.planId,
        plan_status: "trialing",
        total_capacity: 0,
        is_active: false,
        workspace_status: "draft",
        onboarding: { create: { current_step: 1, status: "draft" } },
      },
      include: { onboarding: true, plan: true },
    });
    await prisma.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "create_onboarding", entity_type: "organization", entity_id: organization.id, details: { slug: organization.slug } } });
    return res.status(201).json({ organization });
  } catch (error) {
    console.error("Create onboarding error:", error);
    return res.status(500).json({ error: "Unable to create client onboarding" });
  }
};

export const handleGetOnboarding = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const organization = await prisma.organization.findUnique({
    where: { id: req.params.id as string },
    include: { onboarding: true, plan: true },
  });
  if (!organization) return res.status(404).json({ error: "Onboarding workspace not found" });
  return res.json({ organization });
};

export const handleSaveOnboardingStep = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const step = Number(req.params.step);
  const parsed = stepSchema.safeParse(req.body);
  if (!Number.isInteger(step) || step < 2 || step > 9 || !parsed.success) return res.status(400).json({ error: "A valid onboarding step and data object are required" });
  const fields = ["", "", "structure_data", "rooms_data", "people_data", "roles_data", "accounts_data", "features_data", "branding_data", "review_data"] as const;
  const organization = await prisma.organization.findUnique({ where: { id: req.params.id as string }, select: { id: true, workspace_status: true } });
  if (!organization) return res.status(404).json({ error: "Onboarding workspace not found" });
  if (["active", "canceled"].includes(organization.workspace_status)) return res.status(409).json({ error: "This onboarding can no longer be edited" });
  const onboarding = await prisma.clientOnboarding.upsert({
    where: { org_id: organization.id },
    create: { org_id: organization.id, current_step: step, status: "setup_incomplete", [fields[step]]: parsed.data.data },
    update: { current_step: Math.min(9, step + 1), status: step === 9 ? "ready" : "setup_incomplete", [fields[step]]: parsed.data.data },
  });
  await prisma.organization.update({ where: { id: organization.id }, data: { workspace_status: step === 9 ? "ready" : "setup_incomplete" } });
  return res.json({ onboarding });
};

export const handleActivateOnboarding = async (req: PlatformAuthenticatedRequest, res: Response) => {
  const orgId = req.params.id as string;
  const organization = await prisma.organization.findUnique({ where: { id: orgId }, include: { onboarding: true, plan: true } });
  if (!organization?.onboarding) return res.status(404).json({ error: "Onboarding workspace not found" });
  if (organization.workspace_status === "active") return res.status(409).json({ error: "Workspace is already active" });

  const roomsData = jsonObject(organization.onboarding.rooms_data);
  const peopleData = jsonObject(organization.onboarding.people_data);
  const rolesData = jsonObject(organization.onboarding.roles_data);
  const accountsData = jsonObject(organization.onboarding.accounts_data);
  const featuresData = jsonObject(organization.onboarding.features_data);
  const brandingData = jsonObject(organization.onboarding.branding_data);
  const floors = jsonArray(roomsData.floors);
  const rooms = jsonArray(roomsData.rooms);
  const people: Record<string, any>[] = jsonArray(peopleData.people).map((person, index) => ({ ...person, roles: Array.isArray(rolesData.assignments?.[index]?.roles) ? rolesData.assignments[index].roles : person.roles }));
  if (!people.some((person) => Array.isArray(person.roles) && person.roles.some((role: string) => roleAliases[role] === "owner") && person.createAccount !== false)) {
    return res.status(400).json({ error: "At least one owner account is required before activation" });
  }
  if (!floors.length || !rooms.length) return res.status(400).json({ error: "Add at least one floor and room before activation" });

  try {
    const credentials: { name: string; loginId: string; temporaryPassword: string; roles: string[] }[] = [];
    await prisma.$transaction(async (tx) => {
      const floorMap = new Map<number, string>();
      for (const floor of floors) {
        const floorNumber = Number(floor.floorNumber);
        const saved = await tx.floor.upsert({
          where: { org_id_floor_number: { org_id: orgId, floor_number: floorNumber } },
          create: { org_id: orgId, floor_number: floorNumber, floor_name: String(floor.floorName || `Floor ${floorNumber}`) },
          update: { floor_name: String(floor.floorName || `Floor ${floorNumber}`) },
        });
        floorMap.set(floorNumber, saved.id);
      }
      const roomMap = new Map<string, string>();
      let totalCapacity = 0;
      for (const room of rooms) {
        const floorId = floorMap.get(Number(room.floorNumber));
        if (!floorId) throw new Error(`Floor ${room.floorNumber} is missing`);
        const roomType = Object.values(RoomType).includes(room.roomType as RoomType) ? room.roomType as RoomType : "triple";
        const capacity = Math.max(1, Number(room.capacity) || 1);
        totalCapacity += capacity;
        const saved = await tx.room.upsert({
          where: { org_id_room_number: { org_id: orgId, room_number: String(room.roomNumber) } },
          create: { org_id: orgId, floor_id: floorId, room_number: String(room.roomNumber), room_type: roomType, capacity, monthly_rent: Number(room.monthlyRent) || 0, current_occupancy: 0, status: "available", is_active: true },
          update: { floor_id: floorId, room_type: roomType, capacity, monthly_rent: Number(room.monthlyRent) || 0, is_active: true },
        });
        roomMap.set(saved.room_number, saved.id);
      }

      const personUsers = new Map<number, string>();
      const usedAccountSlugs = new Set<string>();
      for (let index = 0; index < people.length; index += 1) {
        const person = people[index];
        const roleNames = Array.isArray(person.roles) ? person.roles.map(String) : [String(person.role || "tenant")];
        const roles = Array.from(new Set(roleNames.map((role: string) => roleAliases[role]).filter(Boolean))) as OrgRole[];
        const savedPerson = await tx.person.create({ data: { org_id: orgId, full_name: String(person.fullName), phone: String(person.phone), email: person.email || null, person_type: String(person.personType || roleNames[0] || "tenant"), branch: person.branch || null, room_number: person.roomNumber || null, emergency_contact_name: person.emergencyContactName || null, emergency_contact_phone: person.emergencyContactPhone || null, parent_name: person.parentName || null, parent_phone: person.parentPhone || null, joining_date: person.joiningDate ? new Date(person.joiningDate) : null, metadata: { source: person.source || "wizard" } } });
        if (person.createAccount === false || !roles.length) continue;
        const baseName = slugify(String(person.fullName)) || "user";
        const baseLogin = `${baseName}${index ? `-${index + 1}` : ""}.${organization.slug}@hostin.app`;
        const loginId = person.loginId || person.email || baseLogin;
        const temporaryPassword = person.temporaryPassword || `${String(person.fullName).split(" ")[0].replace(/[^a-z]/gi, "").slice(0, 8) || "Hostin"}@${crypto.randomInt(1000, 9999)}`;
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);
        const existing = await tx.user.findFirst({ where: { OR: [{ email: loginId }, { phone: String(person.phone) }] } });
        const user = existing
          ? await tx.user.update({ where: { id: existing.id }, data: { full_name: String(person.fullName), password_hash: passwordHash, is_active: true, account_status: "active", force_password_change: true, real_email: person.email || existing.real_email, ...(existing.person_id ? {} : { person_id: savedPerson.id }) } })
          : await tx.user.create({ data: { email: loginId, phone: String(person.phone), full_name: String(person.fullName), password_hash: passwordHash, is_active: true, account_status: "active", force_password_change: true, real_email: person.email || null, person_id: savedPerson.id } });
        personUsers.set(index, user.id);
        for (let roleIndex = 0; roleIndex < roles.length; roleIndex += 1) {
          const role = roles[roleIndex];
          const baseSlug = `${slugify(String(person.fullName)) || role}${roleIndex ? `-${role}` : ""}`;
          let accountSlug = baseSlug;
          let suffix = 2;
          while (usedAccountSlugs.has(accountSlug)) accountSlug = `${baseSlug}-${suffix++}`;
          usedAccountSlugs.add(accountSlug);
          await tx.userOrgRole.upsert({ where: { user_id_org_id_role: { user_id: user.id, org_id: orgId, role } }, create: { user_id: user.id, org_id: orgId, role, account_slug: accountSlug, is_primary: roleIndex === 0, is_active: true }, update: { account_slug: accountSlug, is_active: true, is_primary: roleIndex === 0 } });
        }
        credentials.push({ name: String(person.fullName), loginId, temporaryPassword, roles });
      }

      for (const [index, userId] of personUsers) {
        const person = people[index];
        const roleNames = Array.isArray(person.roles) ? person.roles.map(String) : [String(person.role || "tenant")];
        if (roleNames.some((role: string) => roleAliases[role] === "tenant") && person.roomNumber && roomMap.has(String(person.roomNumber))) {
          const roomId = roomMap.get(String(person.roomNumber)) as string;
          await tx.tenantProfile.upsert({ where: { user_id_org_id: { user_id: userId, org_id: orgId } }, create: { user_id: userId, org_id: orgId, room_id: roomId, admission_date: person.joiningDate ? new Date(person.joiningDate) : new Date(), emergency_contact_name: person.emergencyContactName || person.parentName || "Not provided", emergency_contact_phone: person.emergencyContactPhone || person.parentPhone || String(person.phone), status: "active", is_active: true }, update: { room_id: roomId, status: "active", is_active: true } });
          await tx.roomAssignmentHistory.create({ data: { org_id: orgId, room_id: roomId, tenant_id: userId } });
        }
      }

      const dashboards = jsonObject(featuresData.roleDashboards);
      for (const role of Object.values(OrgRole)) {
        await tx.roleDashboard.upsert({ where: { org_id_role: { org_id: orgId, role } }, create: { org_id: orgId, role, status: dashboards[role] === false ? "inactive" : "active" }, update: { status: dashboards[role] === false ? "inactive" : "active" } });
      }
      const ownerUser = await tx.userOrgRole.findFirst({ where: { org_id: orgId, role: "owner", is_active: true } });
      if (!ownerUser) throw new Error("Owner account was not created");
      const activeTenantProfiles = await tx.tenantProfile.findMany({ where: { org_id: orgId, is_active: true }, include: { room: true } });
      for (const profile of activeTenantProfiles) await syncCurrentRentDue(tx, { orgId, tenantId: profile.user_id, room: profile.room, actorUserId: ownerUser.user_id });
      const featureFlags = jsonObject(featuresData.features);
      for (const [featureKey, enabled] of Object.entries(featureFlags)) {
        await tx.orgFeature.upsert({ where: { org_id_feature_key: { org_id: orgId, feature_key: featureKey } }, create: { org_id: orgId, feature_key: featureKey, is_enabled: Boolean(enabled), updated_by: ownerUser.user_id }, update: { is_enabled: Boolean(enabled), updated_by: ownerUser.user_id } });
      }
      const rolePermissions = jsonArray(featuresData.rolePermissions);
      for (const permission of rolePermissions) {
        const role = roleAliases[String(permission.role)];
        if (!role || !permission.featureKey) continue;
        await tx.roleFeaturePermission.upsert({ where: { org_id_role_feature_key: { org_id: orgId, role, feature_key: String(permission.featureKey) } }, create: { org_id: orgId, role, feature_key: String(permission.featureKey), is_allowed: permission.allowed !== false, permissions: permission.permissions || undefined }, update: { is_allowed: permission.allowed !== false, permissions: permission.permissions || undefined } });
      }
      await tx.organization.update({ where: { id: orgId }, data: { total_capacity: totalCapacity, theme_color: brandingData.themeColor || organization.theme_color, billing_cycle: brandingData.billingCycle || organization.billing_cycle, plan_id: brandingData.planId || organization.plan_id, is_active: true, workspace_status: "active", plan_status: "active" } });
      await tx.clientOnboarding.update({ where: { org_id: orgId }, data: { status: "active", current_step: 9, accounts_data: { ...accountsData, generatedCount: credentials.length }, review_data: { activatedAt: new Date().toISOString(), activatedBy: req.platformUser?.id } } });
      await tx.platformAuditLog.create({ data: { platform_user_id: req.platformUser?.id as string, action: "activate_client", entity_type: "organization", entity_id: orgId, details: { accounts: credentials.length, rooms: rooms.length, capacity: totalCapacity } } });
    }, { timeout: 30000 });
    return res.json({ message: "Client workspace activated", destination: `/1forge/platform/${organization.slug}`, credentials });
  } catch (error) {
    console.error("Activate onboarding error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to activate client workspace" });
  }
};
