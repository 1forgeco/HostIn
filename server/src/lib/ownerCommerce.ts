import { OrgRole, Prisma } from "../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

export const addonBundles = {
  guard: ["role_guard", "gate_pass", "visitor_log"],
  mess_manager: ["role_staff", "mess_menu"],
  vault_management: ["documents"],
} as const;

export const normalizeFeatureKeys = (keys: string[] = []) =>
  Array.from(
    new Set(
      keys
        .flatMap((key) => addonBundles[key as keyof typeof addonBundles] ?? [key])
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  );

export const applyWorkspaceCommerceChanges = async (
  tx: Tx,
  {
    orgId,
    ownerUserId,
    planId,
    targetCapacity,
    featureKeys,
  }: {
    orgId: string;
    ownerUserId: string;
    planId?: string | null;
    targetCapacity?: number | null;
    featureKeys?: string[];
  },
) => {
  const updateData: Prisma.OrganizationUpdateInput = {};
  if (planId) updateData.plan = { connect: { id: planId } };
  if (targetCapacity !== undefined && targetCapacity !== null) updateData.total_capacity = targetCapacity;
  if (Object.keys(updateData).length) {
    await tx.organization.update({
      where: { id: orgId },
      data: { ...updateData, plan_status: "active", workspace_status: "active", is_active: true },
    });
  }

  const normalizedFeatures = normalizeFeatureKeys(featureKeys);
  for (const featureKey of normalizedFeatures) {
    await tx.orgFeature.upsert({
      where: { org_id_feature_key: { org_id: orgId, feature_key: featureKey } },
      create: { org_id: orgId, feature_key: featureKey, is_enabled: true, updated_by: ownerUserId },
      update: { is_enabled: true, updated_by: ownerUserId },
    });

    if (featureKey.startsWith("role_")) {
      const role = featureKey.slice(5) as OrgRole;
      if (Object.values(OrgRole).includes(role)) {
        await tx.roleDashboard.upsert({
          where: { org_id_role: { org_id: orgId, role } },
          create: { org_id: orgId, role, status: "active" },
          update: { status: "active" },
        });
      }
    }
  }

  return { featureKeys: normalizedFeatures };
};
