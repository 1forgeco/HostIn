import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../../lib/prisma";
import { env } from "../../../config/env";

const JWT_EXPIRES_IN = "1d"; // 1 day access token
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body; // username can be email or phone

  if (!username || !password) {
    return res.status(400).json({ error: "Username (email/phone) and password are required" });
  }

  try {
    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { phone: username }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "User account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Fetch user roles
    const roles = await prisma.userOrgRole.findMany({
      where: { user_id: user.id, is_active: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            theme_color: true,
          },
        },
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Generate JWT access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshRawToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshRawToken,
        device: req.headers["user-agent"] || "unknown",
        ip_address: req.ip || "unknown",
        expires_at: expiresAt,
      },
    });

    // Format roles output
    const userRoles = roles.map((r) => ({
      orgId: r.org_id,
      orgName: r.organization.name,
      orgSlug: r.organization.slug,
      role: r.role,
      themeColor: r.organization.theme_color,
    }));

    res.cookie("hostin_refresh", refreshRawToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", path: "/api/auth", maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        profilePhotoUrl: user.profile_photo_url,
      },
      roles: userRoles,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "An error occurred during login" });
  }
};
