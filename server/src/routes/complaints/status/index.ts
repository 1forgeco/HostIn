import { Router } from "express";
import { handleUpdateComplaintStatus } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/status",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "staff", "guard"]) as any,
  handleUpdateComplaintStatus as any
);

export default router;
