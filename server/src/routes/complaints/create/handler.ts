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

    // Create Complaint
    const complaint = await prisma.complaint.create({
      data: {
        org_id: orgId,
        tenant_id: userId as string,
        category: category as ComplaintCategory,
        title,
        description,
        priority: (priority as ComplaintPriority) || "medium",
        photo_urls: photoUrls || [],
        status: "open",
      },
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
