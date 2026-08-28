import { Router } from "express";
import { handleCreateCheckout } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/checkout",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "tenant"]) as any,
  handleCreateCheckout as any
);

export default router;
