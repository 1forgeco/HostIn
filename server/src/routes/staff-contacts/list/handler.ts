import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleListStaffContacts = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const isEmergencyQuery = req.query.isEmergency as string;

  try {
    const whereClause: any = {
      org_id: orgId,
      is_active: true,
    };

    if (isEmergencyQuery !== undefined) {
      whereClause.is_emergency = isEmergencyQuery === "true";
    }

    const staffContacts = await prisma.staffContact.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      staffContacts,
    });
  } catch (error) {
    console.error("List staff contacts error:", error);
    return res.status(500).json({ error: "An error occurred while listing staff contacts" });
  }
};
