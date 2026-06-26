import { Router } from "express";
import { handleListVisitors } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "tenant"]) as any,
  handleListVisitors as any
);

export default router;
