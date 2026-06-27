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
            user_org_roles: { where: { is_active: true } },
          },
        },
        user_org_roles: { where: { is_active: true }, select: { role: true } },
        org_features: { orderBy: { feature_key: "asc" } },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format output to include occupancy stats
    const formattedOrgs = organizations.map((org) => {
      const activeTenantsCount = org._count?.tenant_profiles || 0;
      const roleCounts = org.user_org_roles.reduce<Record<string, number>>((counts, membership) => ({ ...counts, [membership.role]: (counts[membership.role] || 0) + 1 }), {});
      const aliases: Record<string, string> = { gate_passes: "gate_pass", visitors: "visitor_log", mess: "mess_menu", payments: "dues", complaints: "community", parents: "parent_portal" };
      const normalizedFeatures = new Map<string, boolean>();
      org.org_features.forEach((feature) => normalizedFeatures.set(aliases[feature.feature_key] ?? feature.feature_key, feature.is_enabled));
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
        roleCounts,
        memberCount: org._count.user_org_roles,
        features: Array.from(normalizedFeatures, ([key, enabled]) => ({ key, enabled })),
        monthlyPrice: org.plan.price_monthly,
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
