import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyTenantCircle } from "../../../lib/notifications";

export const handleCheckOut = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id) {
    return res.status(400).json({ error: "Missing gate pass ID parameter" });
  }

  try {
    const gatePass = await prisma.gatePass.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!gatePass) {
      return res.status(404).json({ error: "Gate pass not found in this organization" });
    }

    if (gatePass.status !== "approved") {
      return res.status(400).json({
        error: `Cannot check out. Gate pass status is '${gatePass.status}' (must be 'approved').`,
      });
    }

    if (gatePass.actual_out_time) {
      return res.status(400).json({ error: "Tenant has already checked out on this gate pass" });
    }

    const updatedPass = await prisma.gatePass.update({
      where: { id },
      data: {
        actual_out_time: new Date(),
        checked_by: userId,
      },
    });
    await notifyTenantCircle(prisma, gatePass.tenant_id, { orgId, title: "Tenant checked out", body: `${gatePass.purpose} · Expected back ${gatePass.expected_return_time.toLocaleString("en-IN")}`, type: "gate_pass", referenceId: id, referenceType: "gate_pass" }, userId);

    return res.status(200).json({
      message: "Tenant checked out successfully",
      gatePass: updatedPass,
    });
  } catch (error) {
    console.error("Check out gate pass error:", error);
    return res.status(500).json({ error: "An error occurred during gate pass check-out" });
  }
};
