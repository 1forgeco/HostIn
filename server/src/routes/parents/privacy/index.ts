import { Router } from "express";
import { handleUpdateParentPrivacy } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.put(
  "/privacy",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "tenant"]) as any,
  handleUpdateParentPrivacy as any
);

export default router;
