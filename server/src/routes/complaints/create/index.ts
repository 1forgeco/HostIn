import { Router } from "express";
import { handleCreateComplaint } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["tenant"]) as any,
  handleCreateComplaint as any
);

export default router;
