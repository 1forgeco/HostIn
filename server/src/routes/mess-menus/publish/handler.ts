import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handlePublishMessMenu = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const menuId = req.params.id as string;

  try {
    const existingMenu = await prisma.messMenu.findFirst({
      where: {
        id: menuId,
        org_id: orgId,
      },
    });

    if (!existingMenu) {
      return res.status(404).json({ error: "Mess menu not found" });
    }

    const updatedMenu = await prisma.messMenu.update({
      where: {
        id: menuId,
      },
      data: {
        is_published: true,
      },
    });

    return res.status(200).json({
      message: "Mess menu published successfully",
      menu: updatedMenu,
    });
  } catch (error) {
    console.error("Publish mess menu error:", error);
    return res.status(500).json({ error: "An error occurred while publishing the mess menu" });
  }
};
