import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { PassStatus } from "../../../../generated/prisma/client";

export const handleApprovePass = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const id = req.params.id as string;
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing gate pass ID parameter" });
  }

  if (!status || (status !== "approved" && status !== "rejected")) {
    return res.status(400).json({ error: "Invalid status. Must be 'approved' or 'rejected'." });
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

    if (gatePass.status !== "pending") {
      return res.status(400).json({ error: `Cannot change status. Gate pass is currently '${gatePass.status}'` });
    }

    const updatedPass = await prisma.gatePass.update({
      where: { id },
      data: {
        status: status as PassStatus,
        approved_by: userId,
      },
    });

    return res.status(200).json({
      message: `Gate pass successfully ${status}`,
      gatePass: updatedPass,
    });
  } catch (error) {
    console.error("Approve gate pass error:", error);
    return res.status(500).json({ error: "An error occurred during gate pass approval" });
  }
};
