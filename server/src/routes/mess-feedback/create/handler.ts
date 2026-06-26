import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { FeedbackRating } from "../../../../generated/prisma/client";

export const handleCreateMessFeedback = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const tenantId = req.user?.userId;

  const { menuItemId, rating, note } = req.body;

  if (!menuItemId || !rating) {
    return res.status(400).json({
      error: "Missing required fields (menuItemId, rating)",
    });
  }

  // Validate rating enum
  const validRatings = Object.values(FeedbackRating);
  if (!validRatings.includes(rating as FeedbackRating)) {
    return res.status(400).json({
      error: `Invalid rating. Must be one of: ${validRatings.join(", ")}`,
    });
  }

  try {
    // Verify menu item exists and belongs to the current org
    const menuItem = await prisma.messMenuItem.findFirst({
      where: {
        id: menuItemId,
        menu: {
          org_id: orgId,
        },
      },
    });

    if (!menuItem) {
      return res.status(404).json({ error: "Mess menu item not found in this organization" });
    }

    // Upsert feedback
    const feedback = await prisma.messFeedback.upsert({
      where: {
        tenant_id_menu_item_id: {
          tenant_id: tenantId as string,
          menu_item_id: menuItemId,
        },
      },
      create: {
        org_id: orgId,
        tenant_id: tenantId as string,
        menu_item_id: menuItemId,
        rating: rating as FeedbackRating,
        note: note || null,
      },
      update: {
        rating: rating as FeedbackRating,
        note: note || null,
      },
    });

    return res.status(200).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Submit mess feedback error:", error);
    return res.status(500).json({ error: "An error occurred while submitting feedback" });
  }
};
