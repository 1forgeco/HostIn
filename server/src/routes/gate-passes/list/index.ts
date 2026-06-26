import { Router } from "express";
import { handleListPasses } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "tenant"]) as any,
  handleListPasses as any
);

export default router;
