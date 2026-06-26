import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { VisitStatus } from "../../../../generated/prisma/client";

export const handleVisitorCheckOut = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const id = req.params.id as string;

  if (!id) {
    return res.status(400).json({ error: "Missing visitor record ID parameter" });
  }

  try {
    const visitor = await prisma.visitor.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!visitor) {
      return res.status(404).json({ error: "Visitor record not found in this organization" });
    }

    if (!visitor.actual_in_time) {
      return res.status(400).json({ error: "Cannot check out visitor. Visitor has not checked in yet." });
    }

    if (visitor.actual_out_time) {
      return res.status(400).json({ error: "Visitor has already checked out" });
    }

    const updatedVisitor = await prisma.visitor.update({
      where: { id },
      data: {
        actual_out_time: new Date(),
        status: VisitStatus.completed,
      },
    });

    return res.status(200).json({
      message: "Visitor check-out logged successfully",
      visitor: updatedVisitor,
    });
  } catch (error) {
    console.error("Visitor check-out error:", error);
    return res.status(500).json({ error: "An error occurred logging visitor check-out" });
  }
};
