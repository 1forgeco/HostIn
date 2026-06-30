import { Response } from "express";
import { prisma } from "../../../lib/prisma";
import { PlatformAuthenticatedRequest } from "../../../middleware/platformAuth";
import { cachedRead } from "../../../lib/runtimeCache";

export async function getPlatformNotifications() {
  return cachedRead("platform:notifications", 5_000, async () => {
    const [requests, organizations] = await Promise.all([
      prisma.ownerRequest.findMany({ where: { status: { in: ["submitted", "under_review", "need_more_info"] } }, include: { organization: { select: { name: true } } }, orderBy: { created_at: "desc" }, take: 20 }),
      prisma.organization.findMany({ where: { OR: [{ workspace_status: { not: "active" } }, { is_active: false }, { plan_status: { in: ["paused", "expired"] } }] }, orderBy: { updated_at: "desc" }, take: 10 }),
    ]);
    return [
      ...requests.map((request) => ({ id: request.id, title: request.title, body: `${request.organization.name} · ${request.type.replaceAll("_", " ")}`, status: "pending", created_at: request.created_at })),
      ...organizations.map((organization) => ({ id: organization.id, title: `${organization.name} needs attention`, body: `Workspace: ${organization.workspace_status} · Plan: ${organization.plan_status}`, status: "pending", created_at: organization.updated_at })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
}

export async function handlePlatformNotifications(_req: PlatformAuthenticatedRequest, res: Response) {
  try {
    return res.json({ notifications: await getPlatformNotifications() });
  } catch (error) {
    console.error("Platform notifications error:", error);
    return res.status(500).json({ error: "Unable to load platform notifications" });
  }
}

export async function handlePlatformNotificationStream(req: PlatformAuthenticatedRequest, res: Response) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  let closed = false;
  let fingerprint = "";
  const send = async () => {
    if (closed) return;
    try {
      const notifications = await getPlatformNotifications();
      const next = notifications.map((item) => `${item.id}:${item.created_at}`).join("|");
      if (next !== fingerprint) { fingerprint = next; res.write(`event: notifications\ndata: ${JSON.stringify({ notifications })}\n\n`); }
      else res.write(`: heartbeat\n\n`);
    } catch { res.write(`event: error\ndata: {"retry":true}\n\n`); }
  };
  await send();
  const interval = setInterval(send, 15_000);
  const lifetime = setTimeout(() => { if (!closed) { res.write(`event: reconnect\ndata: {}\n\n`); res.end(); } }, 55_000);
  req.on("close", () => { closed = true; clearInterval(interval); clearTimeout(lifetime); });
}
