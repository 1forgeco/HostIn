import { Router } from "express";
import { handleListPayments } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "tenant"]) as any,
  handleListPayments as any
);

export default router;
