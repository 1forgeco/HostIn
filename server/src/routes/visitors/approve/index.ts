import { Router } from "express";
import { handleApproveVisitor } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/approve",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "tenant"]) as any,
  handleApproveVisitor as any
);

export default router;
