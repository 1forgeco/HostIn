import request from "supertest";
import jwt from "jsonwebtoken";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../index";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

describe("API protection", () => {
  afterAll(async () => prisma.$disconnect());

  it("returns liveness and secure HTTP headers", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("allows the deployed frontend to complete credentialed CORS preflight", async () => {
    const origin = "https://host-in-beta.vercel.app";
    const response = await request(app)
      .options("/api/auth/resolve-login")
      .set("Origin", origin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(origin);
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("rejects malformed unified login input before querying credentials", async () => {
    const response = await request(app).post("/api/auth/resolve-login").send({ email: "not-an-email", password: "short" });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/valid email/i);
  });

  it("requires bearer authorization for platform data", async () => {
    const response = await request(app).get("/api/platform/organizations");
    expect(response.status).toBe(401);
  });
});

describe.runIf(Boolean(process.env.RUN_DATABASE_TESTS))("Database-backed authorization", () => {
  it("reports ready only after the deployment database is reachable", async () => {
    const response = await request(app).get("/ready");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ready");
  });

  it.each([
    ["owner", "owner@city-complex.hostin.local", "/city-complex/owner/city-complex-owner"],
    ["warden", "warden@city-complex.hostin.local", "/city-complex/warden/anita-warden"],
    ["guard", "security@city-complex.hostin.local", "/city-complex/guard/ramesh-security"],
    ["staff", "staff@city-complex.hostin.local", "/city-complex/staff/joseph-staff"],
    ["tenant", "tenant@city-complex.hostin.local", "/city-complex/tenant/aarav-mehta"],
    ["parent", "parent@city-complex.hostin.local", "/city-complex/parent/meena-mehta"],
  ])("routes the seeded %s role and authorizes its workspace", async (role, email, destination) => {
    const login = await request(app)
      .post("/api/auth/resolve-login")
      .send({ email, password: "city-complex@123" });

    expect(login.status).toBe(200);
    expect(login.body.destination).toBe(destination);
    expect(login.body.session.role).toBe(role);
    expect(login.body.session.orgId).toBeTruthy();
    expect(login.body.session).toHaveProperty("themeColor");

    const rooms = await request(app)
      .get("/api/rooms")
      .set("Authorization", `Bearer ${login.body.accessToken}`)
      .set("x-org-id", login.body.session.orgId);
    expect(rooms.status).toBe(200);
    expect(Array.isArray(rooms.body.rooms)).toBe(true);
  });

  it("routes a tenant account without role selection and isolates platform APIs", async () => {
    const login = await request(app).post("/api/auth/resolve-login").send({ email: "tenant@city-complex.hostin.local", password: "city-complex@123" });
    expect(login.status).toBe(200);
    expect(login.body.destination).toMatch(/^\/city-complex\/tenant\//);

    const platformAttempt = await request(app).get("/api/platform/organizations").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(platformAttempt.status).toBe(403);

    const foreignOrgAttempt = await request(app).get("/api/gate-passes").set("Authorization", `Bearer ${login.body.accessToken}`).set("x-org-id", "00000000-0000-0000-0000-000000000000");
    expect([403, 404]).toContain(foreignOrgAttempt.status);
  });

  it("returns only linked-child data for the parent workspace", async () => {
    const login = await request(app).post("/api/auth/resolve-login").send({ email: "parent@city-complex.hostin.local", password: "city-complex@123" });
    const response = await request(app).get("/api/parents/ward").set("Authorization", `Bearer ${login.body.accessToken}`).set("x-org-id", login.body.session.orgId);
    expect(response.status).toBe(200);
    expect(response.body.wards).toHaveLength(1);
    expect(response.body.wards[0].ward.name).toBe("Aarav Mehta");
    expect(response.body.wards[0]).toHaveProperty("gatePasses");
    expect(response.body.wards[0]).toHaveProperty("payments");
    expect(response.body.wards[0]).toHaveProperty("documents");
    expect(response.body).toHaveProperty("announcements");
    expect(response.body).toHaveProperty("contacts");
    const title = `Parent safety concern ${Date.now()}`;
    let complaintId = "";
    try {
      const concern = await request(app).post("/api/complaints").set("Authorization", `Bearer ${login.body.accessToken}`).set("x-org-id", login.body.session.orgId).send({ tenantId: response.body.wards[0].ward.userId, category: "security", title, description: "Please confirm the updated entry timing.", priority: "high" });
      expect(concern.status).toBe(201);
      expect(concern.body.complaint.status).toBe("open");
      complaintId = concern.body.complaint.id;
      const reviewerNotification = await prisma.notification.findFirst({
        where: {
          org_id: login.body.session.orgId,
          reference_id: complaintId,
          user: { user_org_roles: { some: { org_id: login.body.session.orgId, role: { in: ["owner", "warden"] }, is_active: true } } },
        },
      });
      expect(reviewerNotification?.title).toMatch(/new security complaint/i);
    } finally {
      if (complaintId) {
        await prisma.notification.deleteMany({ where: { reference_id: complaintId } });
        await prisma.complaint.delete({ where: { id: complaintId } });
      }
    }
  });

  it("updates the tenant's current rent bill when a warden changes rooms", async () => {
    const startedAt = new Date();
    const organization = await prisma.organization.findUniqueOrThrow({ where: { slug: "city-complex" } });
    const tenant = await prisma.user.findUniqueOrThrow({ where: { email: "tenant@city-complex.hostin.local" } });
    const profile = await prisma.tenantProfile.findUniqueOrThrow({ where: { user_id_org_id: { user_id: tenant.id, org_id: organization.id } }, include: { room: true } });
    const targetRoom = await prisma.room.findFirstOrThrow({ where: { org_id: organization.id, id: { not: profile.room_id }, is_active: true, current_occupancy: 0 } });
    const login = await request(app).post("/api/auth/resolve-login").send({ email: "warden@city-complex.hostin.local", password: "city-complex@123" });
    const authorization = { Authorization: `Bearer ${login.body.accessToken}`, "x-org-id": organization.id };
    let moved = false;
    try {
      const assignment = await request(app).post(`/api/rooms/${targetRoom.id}/assign-tenant`).set(authorization).send({ tenantUserId: tenant.id });
      expect(assignment.status).toBe(200);
      moved = true;
      expect(Number(assignment.body.rentDue.amount)).toBe(Number(targetRoom.monthly_rent));
      expect(assignment.body.rentDue.description).toContain(targetRoom.room_number);
      const notification = await prisma.notification.findFirst({ where: { org_id: organization.id, user_id: tenant.id, title: "Room rent updated", created_at: { gte: startedAt } } });
      expect(notification?.body).toContain(targetRoom.room_number);
    } finally {
      if (moved) await request(app).post(`/api/rooms/${profile.room_id}/assign-tenant`).set(authorization).send({ tenantUserId: tenant.id });
      await prisma.roomAssignmentHistory.deleteMany({ where: { org_id: organization.id, tenant_id: tenant.id, assigned_at: { gte: startedAt } } });
      await prisma.notification.deleteMany({ where: { org_id: organization.id, title: "Room rent updated", created_at: { gte: startedAt } } });
    }
  });

  it("serves owner business dashboard data and accepts 1Forge-bound owner requests", async () => {
    const ownerRole = await prisma.userOrgRole.findFirst({
      where: { role: "owner", organization: { slug: "city-complex" }, user: { email: "owner@city-complex.hostin.local" } },
      include: { user: true },
    });
    expect(ownerRole).toBeTruthy();
    const accessToken = jwt.sign({ userId: ownerRole?.user_id, email: ownerRole?.user.email }, env.JWT_SECRET, { expiresIn: "5m" });
    const authorization = { Authorization: `Bearer ${accessToken}`, "x-org-id": ownerRole?.org_id as string };

    const dashboard = await request(app).get("/api/owner/dashboard").set(authorization);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.dashboard.summary.totalProperties).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.dashboard.credentials.some((item: { loginId: string }) => item.loginId === "owner@city-complex.hostin.local")).toBe(true);

    const title = `Night guard credential ${Date.now()}`;
    try {
      const created = await request(app).post("/api/owner/requests").set(authorization).send({
        type: "credential_creation",
        title,
        personName: "Night Guard",
        role: "guard",
        department: "Gate Security",
        reason: "New night shift guard joined",
        requiredAccess: "Guard dashboard and visitor management",
      });
      expect(created.status).toBe(201);
      expect(created.body.request.status).toBe("submitted");

      const requests = await request(app).get("/api/owner/requests").set(authorization);
      expect(requests.status).toBe(200);
      expect(requests.body.requests.some((item: { title: string }) => item.title === title)).toBe(true);
    } finally {
      await prisma.ownerRequest.deleteMany({ where: { title } });
    }
  });

  it("routes 1Forge accounts to the isolated platform portal", async () => {
    const login = await request(app).post("/api/auth/resolve-login").send({ email: "admin@1forge.com", password: "PlatformAdminPassword123" });
    expect(login.status).toBe(200);
    expect(login.body.destination).toBe("/1forge/platform");
    const organizations = await request(app).get("/api/platform/organizations").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(organizations.status).toBe(200);
    expect(organizations.body.organizations[0]).toHaveProperty("themeColor");
    expect(organizations.body.organizations[0]).toHaveProperty("cityState");
    const notifications = await request(app).get("/api/platform/notifications").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(notifications.status).toBe(200);
    expect(Array.isArray(notifications.body.notifications)).toBe(true);
  });

  it("materializes an onboarding draft and enforces its role dashboard", async () => {
    const slug = `onboarding-${Date.now()}`;
    const createdEmails: string[] = [];
    try {
      const platformLogin = await request(app).post("/api/auth/resolve-login").send({ email: "admin@1forge.com", password: "PlatformAdminPassword123" });
      expect(platformLogin.status).toBe(200);
      const authorization = { Authorization: `Bearer ${platformLogin.body.accessToken}` };
      const plans = await request(app).get("/api/platform/plans").set(authorization);
      expect(plans.status).toBe(200);
      const planId = plans.body.plans[0].id;

      const created = await request(app).post("/api/platform/onboarding").set(authorization).send({ name: "Onboarding Test PG", ownerName: "Test Owner", ownerPhone: `91${Date.now().toString().slice(-8)}`, cityState: "Test City", slug, clientType: "PG", branchCount: 1, planId, startDate: "2026-06-29", billingCycle: "monthly" });
      expect(created.status).toBe(201);
      const orgId = created.body.organization.id;
      const save = (step: number, data: Record<string, unknown>) => request(app).put(`/api/platform/onboarding/${orgId}/steps/${step}`).set(authorization).send({ data });
      expect((await save(2, { buildings: ["Main"], floorCount: 1, genderType: "boys" })).status).toBe(200);
      expect((await save(3, { floors: [{ floorNumber: 1, floorName: "Floor 1" }], rooms: [{ floorNumber: 1, roomNumber: "101", roomType: "double", capacity: 2, monthlyRent: 7000 }] })).status).toBe(200);
      const people = [
        { fullName: "Test Owner", phone: `92${Date.now().toString().slice(-8)}`, roles: ["owner"], createAccount: true },
        { fullName: "Test Tenant", phone: `93${Date.now().toString().slice(-8)}`, roles: ["tenant"], roomNumber: "101", createAccount: true },
      ];
      expect((await save(4, { people })).status).toBe(200);
      expect((await save(5, { assignments: people.map((person) => ({ roles: person.roles })) })).status).toBe(200);
      expect((await save(6, { accountCount: 2, forcePasswordChange: true })).status).toBe(200);
      expect((await save(7, { features: { rooms: true, dues: true, community: true }, roleDashboards: { owner: true, tenant: true } })).status).toBe(200);
      expect((await save(8, { themeColor: "#123456", billingCycle: "monthly", planId })).status).toBe(200);
      expect((await save(9, { acknowledged: true })).status).toBe(200);

      const activation = await request(app).post(`/api/platform/onboarding/${orgId}/activate`).set(authorization);
      expect(activation.status).toBe(200);
      expect(activation.body.credentials).toHaveLength(2);
      createdEmails.push(...activation.body.credentials.map((item: { loginId: string }) => item.loginId));

      const control = await request(app).get(`/api/platform/organizations/${orgId}/control`).set(authorization);
      expect(control.status).toBe(200);
      expect(control.body.control.people).toHaveLength(2);
      expect(control.body.control.floors[0].rooms).toHaveLength(1);

      const tenantCredential = activation.body.credentials.find((item: { roles: string[] }) => item.roles.includes("tenant"));
      const tenantAccount = control.body.control.accounts.find((item: { email: string }) => item.email === tenantCredential.loginId);
      expect(tenantAccount.force_password_change).toBe(true);
      const tenantToken = jwt.sign({ userId: tenantAccount.id, email: tenantAccount.email }, env.JWT_SECRET, { expiresIn: "5m" });

      const disabled = await request(app).put(`/api/platform/organizations/${orgId}/role-dashboards/tenant`).set(authorization).send({ status: "inactive" });
      expect(disabled.status).toBe(200);
      const blocked = await request(app).get("/api/rooms").set("Authorization", `Bearer ${tenantToken}`).set("x-org-id", orgId);
      expect(blocked.status).toBe(403);
      expect(blocked.body.code).toBe("ROLE_DASHBOARD_INACTIVE");
    } finally {
      await prisma.organization.deleteMany({ where: { slug } });
      if (createdEmails.length) await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
  });
});
