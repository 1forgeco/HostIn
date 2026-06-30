import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { ComplaintStatus } from "../../../../generated/prisma/client";

export const handleUpdateComplaintStatus = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;
  const id = req.params.id as string;
  const { status, note } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing complaint ID parameter" });
  }

  if (!status) {
    return res.status(400).json({ error: "Missing status in request body" });
  }

  // Validate status
  const validStatuses = Object.values(ComplaintStatus);
  if (!validStatuses.includes(status as ComplaintStatus)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    // Check if complaint exists
    const complaint = await prisma.complaint.findFirst({
      where: {
        id,
        org_id: orgId,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found in this organization" });
    }

    // Check authorization: Must be owner, warden, OR the assigned user of this complaint
    const isOwnerOrWarden = userRole === "owner" || userRole === "warden";
    const isAssignedToMe = complaint.assigned_to === userId;

    if (!isOwnerOrWarden && !isAssignedToMe) {
      return res.status(403).json({
        error: "Access denied. Only owners, wardens, or the assigned staff member can update status.",
      });
    }

    // Process update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update status
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          status: status as ComplaintStatus,
          resolved_at: status === "resolved" ? new Date() : complaint.resolved_at,
        },
      });

      // 2. Create history log
      await tx.complaintUpdate.create({
        data: {
          complaint_id: id,
          updated_by: userId as string,
          status: status as ComplaintStatus,
          note: note || null,
        },
      });
      await tx.notification.create({ data: { org_id: orgId, user_id: complaint.tenant_id, title: `Complaint ${String(status).replaceAll("_", " ")}`, body: note || `Your complaint is now ${String(status).replaceAll("_", " ")}.`, type: "complaint", reference_id: id, reference_type: "complaint" } });

      return updatedComplaint;
    });

    return res.status(200).json({
      message: "Complaint status updated successfully",
      complaint: result,
    });
  } catch (error) {
    console.error("Update complaint status error:", error);
    return res.status(500).json({ error: "An error occurred updating the complaint status" });
  }
};
