import { Response } from "express";
import { prisma } from "../../../lib/prisma";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { getCachedValue, setCachedValue } from "../../../lib/runtimeCache";

const moneyNumber = (value: unknown) => Number(value ?? 0);
const activeRequestStatuses = ["submitted", "under_review", "need_more_info", "approved"] as const;

export const handleGetOwnerDashboard = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const staleComplaintDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const cacheKey = `org:${orgId}:owner-dashboard:${req.user?.userId}`;

  try {
    const cached = await getCachedValue<{ dashboard: unknown }>(cacheKey);
    if (cached) return res.status(200).json(cached);
    const currentOrganization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true, group: true },
    });
    if (!currentOrganization) return res.status(404).json({ error: "Organization not found" });

    const organizations = await prisma.organization.findMany({
      where: currentOrganization.group_id ? { group_id: currentOrganization.group_id } : { id: orgId },
      include: { plan: true, org_features: true },
      orderBy: { name: "asc" },
    });
    const orgIds = organizations.map((organization) => organization.id);

    const [rooms, activeTenants, staffRoles, dues, monthlyPayments, complaints, documents, gatePasses, credentials, requests, people] =
      await Promise.all([
        prisma.room.findMany({ where: { org_id: { in: orgIds }, is_active: true }, select: { org_id: true, capacity: true, current_occupancy: true, monthly_rent: true, status: true } }),
        prisma.tenantProfile.findMany({ where: { org_id: { in: orgIds }, is_active: true, status: "active" }, select: { org_id: true, user_id: true } }),
        prisma.userOrgRole.findMany({
          where: { org_id: { in: orgIds }, is_active: true, role: { in: ["owner", "warden", "guard", "staff", "parent"] } },
          select: { org_id: true, role: true, user_id: true },
        }),
        prisma.due.findMany({ where: { org_id: { in: orgIds } }, select: { org_id: true, amount: true, amount_paid: true, due_date: true, status: true, tenant: { select: { full_name: true } } } }),
        prisma.payment.findMany({ where: { org_id: { in: orgIds }, status: "successful", paid_at: { gte: monthStart } }, select: { org_id: true, amount: true, paid_at: true } }),
        prisma.complaint.findMany({ where: { org_id: { in: orgIds } }, select: { org_id: true, title: true, status: true, priority: true, created_at: true, tenant: { select: { full_name: true } } } }),
        prisma.document.findMany({ where: { org_id: { in: orgIds } }, select: { org_id: true, tenant_id: true, file_name: true, doc_type: true, is_verified: true, created_at: true, tenant: { select: { full_name: true } } } }),
        prisma.gatePass.findMany({ where: { org_id: { in: orgIds } }, select: { org_id: true, status: true, purpose: true, expected_out_time: true, tenant: { select: { full_name: true } } }, orderBy: { created_at: "desc" }, take: 20 }),
        prisma.userOrgRole.findMany({
          where: { org_id: { in: orgIds } },
          include: { user: { select: { id: true, full_name: true, email: true, phone: true, account_status: true, force_password_change: true, last_login_at: true, created_at: true, is_active: true } }, organization: { select: { id: true, name: true } } },
          orderBy: [{ role: "asc" }, { created_at: "desc" }],
        }),
        prisma.ownerRequest.findMany({
          where: { org_id: { in: orgIds } },
          include: { organization: { select: { id: true, name: true } }, requested_by_user: { select: { full_name: true } } },
          orderBy: { created_at: "desc" },
          take: 30,
        }),
        prisma.person.findMany({ where: { org_id: { in: orgIds } }, include: { organization: { select: { name: true } }, user: { select: { id: true, email: true, account_status: true, last_login_at: true } } }, orderBy: { full_name: "asc" } }),
      ]);

    const pendingDues = dues.filter((due) => ["unpaid", "partial", "overdue"].includes(due.status));
    const overdueDues = pendingDues.filter((due) => due.due_date < now);
    const pendingRent = pendingDues.reduce((sum, due) => sum + Math.max(0, moneyNumber(due.amount) - moneyNumber(due.amount_paid)), 0);
    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + moneyNumber(payment.amount), 0);
    const openComplaints = complaints.filter((complaint) => ["open", "in_progress"].includes(complaint.status));
    const staleComplaints = openComplaints.filter((complaint) => complaint.created_at < staleComplaintDate);
    const unverifiedDocuments = documents.filter((document) => !document.is_verified);
    const pendingGatePasses = gatePasses.filter((pass) => pass.status === "pending");
    const activeRequests = requests.filter((request) => activeRequestStatuses.includes(request.status as (typeof activeRequestStatuses)[number]));
    const pendingCredentialRequests = activeRequests.filter((request) => request.type === "credential_creation");

    const propertyCards = organizations.map((organization) => {
      const propertyRooms = rooms.filter((room) => room.org_id === organization.id);
      const capacity = propertyRooms.reduce((sum, room) => sum + room.capacity, 0);
      const occupancy = propertyRooms.reduce((sum, room) => sum + room.current_occupancy, 0);
      const propertyPendingDues = pendingDues.filter((due) => due.org_id === organization.id);
      const propertyComplaints = openComplaints.filter((complaint) => complaint.org_id === organization.id);
      const propertyStaff = staffRoles.filter((role) => role.org_id === organization.id).length;
      const propertyRevenue = monthlyPayments.filter((payment) => payment.org_id === organization.id).reduce((sum, payment) => sum + moneyNumber(payment.amount), 0);
      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        cityState: organization.city_state,
        clientType: organization.client_type,
        planName: organization.plan.name,
        planStatus: organization.plan_status,
        roomCount: propertyRooms.length,
        totalBeds: capacity,
        occupiedBeds: occupancy,
        availableBeds: Math.max(0, capacity - occupancy),
        activeTenants: activeTenants.filter((tenant) => tenant.org_id === organization.id).length,
        monthlyRevenue: propertyRevenue,
        pendingRent: propertyPendingDues.reduce((sum, due) => sum + Math.max(0, moneyNumber(due.amount) - moneyNumber(due.amount_paid)), 0),
        openComplaints: propertyComplaints.length,
        staffActive: propertyStaff,
        status: propertyComplaints.length > 10 || propertyPendingDues.length > 10 ? "needs_attention" : "healthy",
      };
    });

    const roleCounts = credentials.reduce<Record<string, number>>((map, credential) => {
      map[credential.role] = (map[credential.role] ?? 0) + 1;
      return map;
    }, {});

    const dashboard = {
      owner: {
        name: req.user?.email ?? currentOrganization.owner_name,
        organizationName: currentOrganization.group?.name ?? currentOrganization.name,
        managingProperties: organizations.length,
      },
      summary: {
        totalProperties: organizations.length,
        totalTenants: activeTenants.length,
        availableBeds: propertyCards.reduce((sum, property) => sum + property.availableBeds, 0),
        totalBeds: propertyCards.reduce((sum, property) => sum + property.totalBeds, 0),
        monthlyRevenue,
        pendingRent,
        openComplaints: openComplaints.length,
        staffActive: staffRoles.length,
        pendingRequests: activeRequests.length,
        pendingCredentialRequests: pendingCredentialRequests.length,
      },
      properties: propertyCards,
      attention: [
        { key: "overdue_dues", label: "rent payments overdue", count: overdueDues.length, severity: overdueDues.length ? "high" : "normal" },
        { key: "credential_requests", label: "credential requests pending", count: pendingCredentialRequests.length, severity: pendingCredentialRequests.length ? "medium" : "normal" },
        { key: "stale_complaints", label: "complaints unresolved for 48+ hours", count: staleComplaints.length, severity: staleComplaints.length ? "high" : "normal" },
        { key: "documents", label: "documents pending verification", count: unverifiedDocuments.length, severity: unverifiedDocuments.length ? "medium" : "normal" },
        { key: "gate_passes", label: "gate passes awaiting action", count: pendingGatePasses.length, severity: pendingGatePasses.length ? "medium" : "normal" },
      ],
      credentials: credentials.map((credential) => ({
        userId: credential.user_id,
        name: credential.user.full_name,
        role: credential.role,
        loginId: credential.user.email,
        property: credential.organization.name,
        status: credential.user.force_password_change ? "password_reset_required" : credential.user.account_status,
        roleActive: credential.is_active,
        createdOn: credential.created_at,
        lastActive: credential.user.last_login_at,
      })),
      people: people.map((person) => ({
        id: person.id,
        name: person.full_name,
        role: person.person_type,
        property: person.organization.name,
        roomOrDepartment: person.room_number || person.branch || "—",
        phone: person.phone,
        accountStatus: person.user?.account_status ?? "no_account",
        documentStatus: documents.some((document) => document.tenant_id === person.user?.id && !document.is_verified) ? "pending" : "clear",
        lastActive: person.user?.last_login_at,
        status: person.status,
      })),
      documents: documents.map((document) => ({
        id: `${document.org_id}-${document.tenant_id}-${document.file_name}-${document.created_at.toISOString()}`,
        tenantName: document.tenant.full_name,
        type: document.doc_type,
        fileName: document.file_name,
        status: document.is_verified ? "verified" : "pending",
        createdAt: document.created_at,
      })),
      requests: requests.map((request) => ({
        id: request.id,
        type: request.type,
        status: request.status,
        title: request.title,
        personName: request.person_name,
        role: request.role,
        property: request.organization.name,
        requestedBy: request.requested_by_user.full_name,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        reason: request.reason,
        requiredAccess: request.required_access,
      })),
      billing: organizations.map((organization) => ({
        orgId: organization.id,
        property: organization.name,
        planName: organization.plan.name,
        planStatus: organization.plan_status,
        baseMonthly: moneyNumber(organization.plan.price_monthly),
        maxTenants: organization.plan.max_tenants,
        activeFeatures: organization.org_features.filter((feature) => feature.is_enabled).map((feature) => feature.feature_key),
        nextRenewal: organization.plan_expires_at,
        totalCapacity: organization.total_capacity,
        activeUsers: credentials.filter((credential) => credential.org_id === organization.id && credential.user.account_status === "active").length,
      })),
      recentActivity: [
        ...overdueDues.slice(0, 3).map((due) => ({ type: "due", title: `${due.tenant.full_name} has pending ${due.status} dues`, date: due.due_date })),
        ...openComplaints.slice(0, 3).map((complaint) => ({ type: "complaint", title: complaint.title, date: complaint.created_at })),
        ...requests.slice(0, 3).map((request) => ({ type: "request", title: request.title, date: request.created_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8),
      roleCounts,
    };

    const response = { dashboard };
    setCachedValue(cacheKey, response, 5_000);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Owner dashboard error:", error);
    return res.status(500).json({ error: "An error occurred while compiling owner dashboard" });
  }
};
