import { Response } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth";
import { prisma } from "../../../lib/prisma";

export const handleMe = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        full_name: true,
        profile_photo_url: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "User account is deactivated" });
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
          },
        },
      },
    });

    const userRoles = roles.map((r) => ({
      orgId: r.org_id,
      orgName: r.organization.name,
      orgSlug: r.organization.slug,
      role: r.role,
    }));

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        profilePhotoUrl: user.profile_photo_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      roles: userRoles,
    });
  } catch (error) {
    console.error("Fetch current user error:", error);
    return res.status(500).json({ error: "An error occurred fetching user details" });
  }
};
