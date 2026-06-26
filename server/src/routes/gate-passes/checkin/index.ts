import { Router } from "express";
import { handleCheckIn } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/check-in",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard"]) as any,
  handleCheckIn as any
);

export default router;
