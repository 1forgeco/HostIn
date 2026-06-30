const MAX_ENTRIES = 1_000;
type CacheEntry = { expiresAt: number; value: Promise<unknown> };
const cache = new Map<string, CacheEntry>();

export async function cachedRead<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) return existing.value as Promise<T>;

  const value = loader().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expiresAt: now + ttlMs, value });
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  return value;
}

export async function getCachedValue<T>(key: string): Promise<T | undefined> {
  const existing = cache.get(key);
  if (!existing) return undefined;
  if (existing.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return existing.value as Promise<T>;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { expiresAt: Date.now() + ttlMs, value: Promise.resolve(value) });
}

export function invalidateRuntimeCache(orgId?: string) {
  for (const key of cache.keys()) {
    if (!orgId || key.startsWith(`org:${orgId}:`) || key.startsWith("platform:organizations") || key === "platform:notifications") cache.delete(key);
  }
}
