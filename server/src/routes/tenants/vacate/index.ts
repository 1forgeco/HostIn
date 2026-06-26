import { Router } from "express";
import { handleVacateTenant } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:tenantId/vacate",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleVacateTenant as any
);

export default router;
