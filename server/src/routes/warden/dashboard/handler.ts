import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { cachedRead } from "../../../lib/runtimeCache";

export async function handleWardenDashboard(req: AuthorizedRequest, res: Response) {
  const orgId = req.headers["x-org-id"] as string;
  try {
    const dashboard = await cachedRead(`org:${orgId}:warden-dashboard`, 5_000, async () => {
      const [rooms, complaints, gatePasses, visitors, documents] = await Promise.all([
        prisma.room.findMany({ where: { org_id: orgId, is_active: true }, select: { id: true, room_number: true, capacity: true, current_occupancy: true, status: true }, orderBy: { room_number: "asc" } }),
        prisma.complaint.findMany({ where: { org_id: orgId, status: { in: ["open", "in_progress"] } }, select: { id: true, title: true, category: true, priority: true, status: true, created_at: true, tenant: { select: { full_name: true } } }, orderBy: [{ priority: "desc" }, { created_at: "desc" }], take: 30 }),
        prisma.gatePass.findMany({ where: { org_id: orgId, status: { in: ["pending", "approved"] } }, select: { id: true, purpose: true, destination: true, status: true, expected_out_time: true, expected_return_time: true, actual_out_time: true, actual_in_time: true, tenant: { select: { full_name: true, phone: true } } }, orderBy: { created_at: "desc" }, take: 40 }),
        prisma.visitor.findMany({ where: { org_id: orgId, status: { in: ["pending", "approved"] } }, select: { id: true, visitor_name: true, visitor_phone: true, visitor_relation: true, purpose: true, status: true, expected_visit_time: true, tenant: { select: { full_name: true } } }, orderBy: { expected_visit_time: "asc" }, take: 40 }),
        prisma.document.findMany({ where: { org_id: orgId, is_verified: false }, select: { id: true, doc_type: true, file_name: true, is_verified: true, tenant_id: true, created_at: true }, orderBy: { created_at: "desc" }, take: 30 }),
      ]);
      return { rooms, complaints, gatePasses, visitors, documents };
    });
    return res.json({ dashboard });
  } catch (error) {
    console.error("Warden dashboard error:", error);
    return res.status(500).json({ error: "Unable to load the warden dashboard" });
  }
}
