import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export async function handleNotificationStream(req: AuthorizedRequest, res: Response) {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId as string;
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
      const notifications = await prisma.notification.findMany({ where: { org_id: orgId, user_id: userId }, orderBy: { created_at: "desc" }, take: 50 });
      const nextFingerprint = notifications.map((item) => `${item.id}:${item.status}`).join("|");
      if (nextFingerprint !== fingerprint) {
        fingerprint = nextFingerprint;
        res.write(`event: notifications\ndata: ${JSON.stringify({ notifications })}\n\n`);
      } else res.write(`: heartbeat\n\n`);
    } catch { res.write(`event: error\ndata: {"retry":true}\n\n`); }
  };
  await send();
  const interval = setInterval(send, 3000);
  const lifetime = setTimeout(() => { if (!closed) { res.write(`event: reconnect\ndata: {}\n\n`); res.end(); } }, 55_000);
  req.on("close", () => { closed = true; clearInterval(interval); clearTimeout(lifetime); });
}
