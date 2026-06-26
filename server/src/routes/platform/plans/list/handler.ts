import { Response } from "express";
import { PlatformAuthenticatedRequest } from "../../../../middleware/platformAuth";
import { prisma } from "../../../../lib/prisma";

export const handleListPlans = async (req: PlatformAuthenticatedRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: {
        price_monthly: "asc",
      },
    });

    return res.status(200).json({
      plans,
    });
  } catch (error) {
    console.error("List plans error:", error);
    return res.status(500).json({ error: "An error occurred while listing subscription plans" });
  }
};
