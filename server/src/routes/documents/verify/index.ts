import { Router } from "express";
import { handleVerifyDocument } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/:id/verify",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleVerifyDocument as any
);

export default router;
