import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const handleResolveLogin = async (req: Request, res: Response) => {
  const email = String(req.body.email ?? req.body.username ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const platformUser = await prisma.platformUser.findFirst({ where: { email, is_active: true } });
    if (platformUser && await bcrypt.compare(password, platformUser.password_hash)) {
      await prisma.platformUser.update({ where: { id: platformUser.id }, data: { last_login_at: new Date() } });
      const accessToken = jwt.sign({ userId: platformUser.id, email, isPlatformUser: true }, JWT_SECRET, { expiresIn: "24h" });
      return res.json({ accountType: "platform", accessToken, destination: "/1forge/platform", session: { accessToken, orgId: "platform", userName: platformUser.full_name, email, workspace: "1forge", role: "platform" } });
    }

    const user = await prisma.user.findFirst({ where: { email, is_active: true } });
    if (!user || !await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: "Invalid email or password" });

    const memberships = await prisma.userOrgRole.findMany({ where: { user_id: user.id, is_active: true }, include: { organization: { include: { plan: true } } }, orderBy: [{ is_primary: "desc" }, { created_at: "asc" }] });
    if (!memberships.length) return res.status(403).json({ error: "This account is not assigned to a workspace" });
    const membership = memberships[0];
    const organization = membership.organization;
    if (!organization.is_active || ["paused", "canceled", "expired"].includes(organization.plan_status)) return res.status(403).json({ error: "This workspace subscription is not active. Contact your property administrator." });

    const accountSlug = membership.account_slug || slugify(user.full_name);
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } }),
      prisma.refreshToken.create({ data: { user_id: user.id, token: refreshToken, device: req.headers["user-agent"] || "unknown", ip_address: req.ip || "unknown", expires_at: expiresAt } }),
      ...(!membership.account_slug ? [prisma.userOrgRole.update({ where: { id: membership.id }, data: { account_slug: accountSlug, is_primary: true } })] : []),
    ]);
    const destination = `/${organization.slug}/${membership.role}/${accountSlug}`;
    return res.json({ accountType: "workspace", accessToken, refreshToken, destination, session: { accessToken, orgId: organization.id, userName: user.full_name, email: user.email, workspace: organization.slug, role: membership.role, accountSlug } });
  } catch (error) {
    console.error("Resolve login error:", error);
    return res.status(500).json({ error: "Unable to sign in" });
  }
};
