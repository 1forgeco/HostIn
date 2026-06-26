import { Response } from "express";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";
import { prisma } from "../../../../lib/prisma";

export const handleListOrganizations = async (req: PlatformAuthenticatedRequest, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            tenant_profiles: {
              where: {
                is_active: true,
                status: "active",
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format output to include occupancy stats
    const formattedOrgs = organizations.map((org) => {
      const activeTenantsCount = org._count?.tenant_profiles || 0;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerName: org.owner_name,
        contactEmail: org.contact_email,
        contactPhone: org.contact_phone,
        planName: org.plan.name,
        planStatus: org.plan_status,
        planExpiresAt: org.plan_expires_at,
        isActive: org.is_active,
        totalCapacity: org.total_capacity,
        activeTenantsCount,
        occupancyRate: org.total_capacity > 0 ? Math.round((activeTenantsCount / org.total_capacity) * 100) : 0,
        createdAt: org.created_at,
      };
    });

    return res.status(200).json({
      organizations: formattedOrgs,
    });
  } catch (error) {
    console.error("List organizations error:", error);
    return res.status(500).json({ error: "An error occurred while listing organizations" });
  }
};
