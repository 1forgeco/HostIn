import { Router } from "express";
import { handleCreateVisitor } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "tenant"]) as any,
  handleCreateVisitor as any
);

export default router;
