import { prisma } from "./prisma";

const CACHE_TTL_MS = 2_000;
const MAX_CACHE_ENTRIES = 500;

async function fetchAccessSnapshot(userId: string, orgId: string) {
  const membership = await prisma.userOrgRole.findFirst({
    where: { user_id: userId, org_id: orgId, is_active: true },
    include: {
      user: { select: { is_active: true, account_status: true } },
      organization: {
        select: {
          is_active: true,
          workspace_status: true,
          plan_status: true,
          plan_expires_at: true,
          plan: { select: { features: true } },
          org_features: { select: { feature_key: true, is_enabled: true } },
        },
      },
    },
  });
  if (!membership) return null;

  const [dashboard, permissions, overrides] = await Promise.all([
    prisma.roleDashboard.findUnique({ where: { org_id_role: { org_id: orgId, role: membership.role } } }),
    prisma.roleFeaturePermission.findMany({ where: { org_id: orgId, role: membership.role } }),
    prisma.accessOverride.findMany({
      where: { org_id: orgId, user_id: userId, role: membership.role, OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }] },
      orderBy: { updated_at: "desc" },
    }),
  ]);

  return { membership, dashboard, permissions, overrides };
}

export type AccessSnapshot = NonNullable<Awaited<ReturnType<typeof fetchAccessSnapshot>>>;
type CacheEntry = { expiresAt: number; promise: Promise<AccessSnapshot | null> };
const cache = new Map<string, CacheEntry>();

export function getAccessSnapshot(userId: string, orgId: string) {
  const key = `${userId}:${orgId}`;
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) return existing.promise;

  const promise = fetchAccessSnapshot(userId, orgId).catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, promise });
  if (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
  return promise;
}

export function invalidateAccessSnapshot(userId?: string, orgId?: string) {
  for (const key of cache.keys()) {
    const [cachedUserId, cachedOrgId] = key.split(":");
    if ((!userId || cachedUserId === userId) && (!orgId || cachedOrgId === orgId)) cache.delete(key);
  }
}
