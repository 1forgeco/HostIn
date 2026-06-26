import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key";

export const handlePlatformLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const platformUser = await prisma.platformUser.findFirst({
      where: {
        email,
        is_active: true,
      },
    });

    if (!platformUser) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, platformUser.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login
    await prisma.platformUser.update({
      where: { id: platformUser.id },
      data: { last_login_at: new Date() },
    });

    const token = jwt.sign(
      {
        userId: platformUser.id,
        email: platformUser.email,
        isPlatformUser: true,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Platform login successful",
      token,
      user: {
        id: platformUser.id,
        email: platformUser.email,
        fullName: platformUser.full_name,
      },
    });
  } catch (error) {
    console.error("Platform login error:", error);
    return res.status(500).json({ error: "An error occurred during platform login" });
  }
};
