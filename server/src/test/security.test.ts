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
