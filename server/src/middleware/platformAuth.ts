import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_key";

export interface PlatformAuthenticatedRequest extends Request {
  platformUser?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export const authenticatePlatformJWT = async (
  req: PlatformAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      if (!decoded || !decoded.isPlatformUser) {
        return res.status(403).json({ error: "Access denied. Platform superadmin permissions required." });
      }

      try {
        const platformUser = await prisma.platformUser.findFirst({
          where: {
            id: decoded.userId,
            is_active: true,
          },
        });

        if (!platformUser) {
          return res.status(403).json({ error: "Platform account is inactive or not found" });
        }

        req.platformUser = {
          id: platformUser.id,
          email: platformUser.email,
          fullName: platformUser.full_name,
        };

        next();
      } catch (error) {
        console.error("Platform authorization middleware error:", error);
        return res.status(500).json({ error: "Internal server error during authorization check" });
      }
    });
  } else {
    res.status(401).json({ error: "Authorization token required" });
  }
};
