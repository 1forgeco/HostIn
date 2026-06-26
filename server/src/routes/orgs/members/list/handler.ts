import { Response } from "express";
import { AuthorizedRequest } from "../../../../middleware/orgAccess";
import { prisma } from "../../../../lib/prisma";

export const handleListMembers = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.params.orgId as string;

  if (!orgId) {
    return res.status(400).json({ error: "Missing orgId parameter" });
  }

  try {
    const members = await prisma.userOrgRole.findMany({
      where: {
        org_id: orgId,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            profile_photo_url: true,
            is_active: true,
          },
        },
      },
      orderBy: {
        role: "asc",
      },
    });

    const formattedMembers = members.map((member) => ({
      userId: member.user_id,
      fullName: member.user.full_name,
      email: member.user.email,
      phone: member.user.phone,
      profilePhotoUrl: member.user.profile_photo_url,
      role: member.role,
      isRoleActive: member.is_active,
      isUserActive: member.user.is_active,
      assignedAt: member.created_at,
    }));

    return res.status(200).json({
      members: formattedMembers,
    });
  } catch (error) {
    console.error("List members error:", error);
    return res.status(500).json({ error: "An error occurred fetching members list" });
  }
};
