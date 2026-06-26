import { Router } from "express";
import { handleAssignComplaint } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/assign",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleAssignComplaint as any
);

export default router;
