import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { ComplaintCategory, ComplaintPriority } from "../../../../generated/prisma/client";

export const handleCreateComplaint = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;

  const { category, title, description, priority, photoUrls } = req.body;

  if (!category || !title || !description) {
    return res.status(400).json({
      error: "Missing required fields (category, title, description)",
    });
  }

  // Validate category
  const validCategories = Object.values(ComplaintCategory);
  if (!validCategories.includes(category as ComplaintCategory)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
  }

  // Validate priority
  if (priority) {
    const validPriorities = Object.values(ComplaintPriority);
    if (!validPriorities.includes(priority as ComplaintPriority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` });
    }
  }

  try {
    // Verify user is an active tenant in the organization
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        user_id: userId,
        org_id: orgId,
        is_active: true,
      },
    });

    if (!tenant) {
      return res.status(403).json({ error: "Only active tenants can file complaints" });
    }

    const complaint = await prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({ data: {
        org_id: orgId,
        tenant_id: userId as string,
        category: category as ComplaintCategory,
        title,
        description,
        priority: (priority as ComplaintPriority) || "medium",
        photo_urls: photoUrls || [],
        status: "open",
      } });
      const responders = await tx.userOrgRole.findMany({ where: { org_id: orgId, role: { in: ["owner", "warden"] }, is_active: true }, select: { user_id: true } });
      const userIds = [...new Set(responders.map((item) => item.user_id))];
      if (userIds.length) await tx.notification.createMany({ data: userIds.map((responderId) => ({ org_id: orgId, user_id: responderId, title: `New ${category} complaint`, body: title, type: "complaint" as const, reference_id: created.id, reference_type: "complaint" })) });
      return created;
    });

    return res.status(201).json({
      message: "Complaint registered successfully",
      complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    return res.status(500).json({ error: "An error occurred creating the complaint" });
  }
};
