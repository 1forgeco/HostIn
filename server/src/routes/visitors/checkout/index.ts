import { Router } from "express";
import { handleVisitorCheckOut } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/check-out",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard"]) as any,
  handleVisitorCheckOut as any
);

export default router;
