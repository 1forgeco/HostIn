import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyRoles, notifyTenantCircle } from "../../../lib/notifications";
export const handleCancelPass = async (req: AuthorizedRequest, res: Response) => {
  const pass = await prisma.gatePass.findFirst({ where: { id: req.params.id as string, org_id: req.headers["x-org-id"] as string, tenant_id: req.user?.userId, status: "pending" } });
  if (!pass) return res.status(404).json({ error: "Only your pending gate pass can be cancelled" });
  const gatePass = await prisma.$transaction(async (tx) => {
    const updated = await tx.gatePass.update({ where: { id: pass.id }, data: { status: "cancelled" } });
    const notice = { orgId: pass.org_id, title: "Gate pass cancelled", body: "A pending gate pass request was cancelled.", type: "gate_pass" as const, referenceId: pass.id, referenceType: "gate_pass" };
    await notifyRoles(tx, ["owner", "warden", "guard"], notice, req.user?.userId);
    await notifyTenantCircle(tx, pass.tenant_id, notice, req.user?.userId);
    return updated;
  });
  return res.json({ gatePass });
};
