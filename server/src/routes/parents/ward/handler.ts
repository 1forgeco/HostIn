import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { getCachedValue, setCachedValue } from "../../../lib/runtimeCache";

export const handleGetWardDetails = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const parentUserId = req.user?.userId as string;
  const cacheKey = `org:${orgId}:parent-dashboard:${parentUserId}`;
  try {
    const cached = await getCachedValue<Record<string, unknown>>(cacheKey);
    if (cached) return res.json(cached);
    const [organization, parentProfiles, warden, announcements, contacts, menu] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { name: true, address: true, contact_phone: true } }),
      prisma.parentProfile.findMany({ where: { user_id: parentUserId, org_id: orgId }, include: { user: { select: { full_name: true, email: true, phone: true } }, tenant: { include: { tenant_profiles: { where: { org_id: orgId, is_active: true }, include: { room: { include: { floor: true } } } } } } } }),
      prisma.userOrgRole.findFirst({ where: { org_id: orgId, role: "warden", is_active: true }, include: { user: { select: { full_name: true, phone: true } } } }),
      prisma.announcement.findMany({ where: { org_id: orgId, target_type: "all" }, include: { created_by_user: { select: { full_name: true } }, reads: { where: { user_id: parentUserId }, select: { id: true } } }, orderBy: { created_at: "desc" }, take: 20 }),
      prisma.staffContact.findMany({ where: { org_id: orgId, is_active: true }, orderBy: [{ is_emergency: "desc" }, { role_type: "asc" }] }),
      prisma.messMenu.findFirst({ where: { org_id: orgId, is_published: true }, include: { items: true }, orderBy: { week_start_date: "desc" } }),
    ]);
    if (!parentProfiles.length) return res.status(404).json({ error: "No linked child was found for this parent" });

    const wards = [];
    for (const profile of parentProfiles) {
      const tenantProfile = profile.tenant.tenant_profiles[0];
      if (!tenantProfile) continue;
      const [dues, payments, gatePasses, visitors, documents, complaints] = await Promise.all([
        prisma.due.findMany({ where: { tenant_id: profile.tenant_id, org_id: orgId }, orderBy: { due_date: "desc" }, take: 50 }),
        prisma.payment.findMany({ where: { tenant_id: profile.tenant_id, org_id: orgId }, orderBy: { created_at: "desc" }, take: 50 }),
        prisma.gatePass.findMany({ where: { tenant_id: profile.tenant_id, org_id: orgId }, include: { approved_by_user: { select: { full_name: true } } }, orderBy: { created_at: "desc" }, take: 50 }),
        prisma.visitor.findMany({ where: { tenant_id: profile.tenant_id, org_id: orgId, status: { in: ["pending", "approved"] } }, orderBy: { expected_visit_time: "asc" } }),
        prisma.document.findMany({ where: { tenant_id: profile.tenant_id, org_id: orgId }, orderBy: { created_at: "desc" }, take: 50 }),
        prisma.complaint.findMany({ where: { tenant_id: profile.tenant_id, org_id: orgId }, include: { updates: { orderBy: { created_at: "desc" }, take: 1 } }, orderBy: { created_at: "desc" }, take: 50 }),
      ]);
      const activePass = gatePasses.find((pass) => pass.status === "approved" && pass.actual_out_time && !pass.actual_in_time);
      const pendingAmount = dues.filter((due) => due.status !== "paid" && due.status !== "waived").reduce((sum, due) => sum + Math.max(0, Number(due.amount) - Number(due.amount_paid)), 0);
      let roommates: Array<{ name: string; phone: string }> = [];
      if (profile.can_see_roommate_contact) {
        const roommateProfiles = await prisma.tenantProfile.findMany({ where: { room_id: tenantProfile.room_id, org_id: orgId, is_active: true, user_id: { not: profile.tenant_id } }, include: { user: { select: { full_name: true, phone: true } } } });
        roommates = roommateProfiles.map((item) => ({ name: item.user.full_name, phone: item.user.phone }));
      }
      wards.push({
        parentProfileId: profile.id,
        relation: profile.relation,
        parent: profile.user,
        canSeeRoommateContact: profile.can_see_roommate_contact,
        canSeeParentContact: profile.can_see_parent_contact,
        ward: { userId: profile.tenant.id, name: profile.tenant.full_name, email: profile.tenant.email, phone: profile.tenant.phone, admissionDate: tenantProfile.admission_date, status: tenantProfile.status, stayStatus: activePass ? "Outside PG" : "Inside PG", room: { id: tenantProfile.room.id, roomNumber: tenantProfile.room.room_number, roomType: tenantProfile.room.room_type, floorName: tenantProfile.room.floor.floor_name, floorNumber: tenantProfile.room.floor.floor_number, monthlyRent: tenantProfile.room.monthly_rent } },
        summary: { pendingAmount, activePass: activePass ?? null, documentsVerified: documents.length > 0 && documents.every((document) => document.is_verified) },
        dues, payments, gatePasses, visitors, documents, complaints, roommates,
      });
    }
    const response = { parent: parentProfiles[0]?.user, organization, assignedWarden: warden?.user ?? null, wards, announcements: announcements.map((item) => ({ ...item, acknowledged: item.reads.length > 0 })), contacts, menu };
    setCachedValue(cacheKey, response, 5_000);
    return res.json(response);
  } catch (error) {
    console.error("Get parent workspace error:", error);
    return res.status(500).json({ error: "An error occurred while fetching the parent workspace" });
  }
};
