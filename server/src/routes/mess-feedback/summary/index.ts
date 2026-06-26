import { Router } from "express";
import { handleGetMessFeedbackSummary } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/summary",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleGetMessFeedbackSummary as any
);

export default router;
