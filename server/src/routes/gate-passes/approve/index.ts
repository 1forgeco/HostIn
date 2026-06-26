import { Router } from "express";
import { handleApprovePass } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/approve",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleApprovePass as any
);

export default router;
