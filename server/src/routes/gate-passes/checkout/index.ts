import { Router } from "express";
import { handleCheckOut } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/check-out",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard"]) as any,
  handleCheckOut as any
);

export default router;
