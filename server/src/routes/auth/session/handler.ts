import { Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";

const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: env.NODE_ENV === "production", path: "/api/auth", maxAge: 7 * 24 * 60 * 60 * 1000 };

export const handleRefresh = async (req: Request, res: Response) => {
  const rawToken = req.cookies?.hostin_refresh || req.body.refreshToken;
  if (!rawToken) return res.status(401).json({ error: "Refresh token is required" });
  const stored = await prisma.refreshToken.findFirst({ where: { token: rawToken, expires_at: { gt: new Date() }, user: { is_active: true } }, include: { user: true } });
  if (!stored) return res.status(401).json({ error: "Refresh token is invalid or expired" });
  const nextToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.$transaction([prisma.refreshToken.delete({ where: { id: stored.id } }), prisma.refreshToken.create({ data: { user_id: stored.user_id, token: nextToken, device: req.headers["user-agent"] || "unknown", ip_address: req.ip || "unknown", expires_at: expiresAt } })]);
  const accessToken = jwt.sign({ userId: stored.user.id, email: stored.user.email }, env.JWT_SECRET, { expiresIn: "1d" });
  res.cookie("hostin_refresh", nextToken, cookieOptions);
  return res.json({ accessToken });
};

export const handleLogout = async (req: Request, res: Response) => {
  const rawToken = req.cookies?.hostin_refresh || req.body.refreshToken;
  if (rawToken) await prisma.refreshToken.deleteMany({ where: { token: rawToken } });
  res.clearCookie("hostin_refresh", { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/api/auth" });
  return res.status(204).send();
};
