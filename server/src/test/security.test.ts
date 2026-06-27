import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../index";
import { prisma } from "../lib/prisma";

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
  it("routes a tenant account without role selection and isolates platform APIs", async () => {
    const login = await request(app).post("/api/auth/resolve-login").send({ email: "tenant@city-complex.hostin.local", password: "city-complex@123" });
    expect(login.status).toBe(200);
    expect(login.body.destination).toMatch(/^\/city-complex\/tenant\//);

    const platformAttempt = await request(app).get("/api/platform/organizations").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(platformAttempt.status).toBe(403);

    const foreignOrgAttempt = await request(app).get("/api/gate-passes").set("Authorization", `Bearer ${login.body.accessToken}`).set("x-org-id", "00000000-0000-0000-0000-000000000000");
    expect([403, 404]).toContain(foreignOrgAttempt.status);
  });

  it("routes 1Forge accounts to the isolated platform portal", async () => {
    const login = await request(app).post("/api/auth/resolve-login").send({ email: "admin@1forge.com", password: "PlatformAdminPassword123" });
    expect(login.status).toBe(200);
    expect(login.body.destination).toBe("/1forge/platform");
    const organizations = await request(app).get("/api/platform/organizations").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(organizations.status).toBe(200);
  });
});
