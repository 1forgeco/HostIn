import { Router } from "express";
import { handleGetMetrics } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleGetMetrics as any
);

export default router;
