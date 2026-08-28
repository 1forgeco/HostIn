import { Router } from "express";
import { handleBillingSummary } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/billing-summary",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "tenant"]) as any,
  handleBillingSummary as any
);

export default router;
