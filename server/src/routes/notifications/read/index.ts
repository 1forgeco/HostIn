import { Router } from "express";
import { handleReadNotification } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/:id/read",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "staff", "tenant", "parent"]) as any,
  handleReadNotification as any
);

export default router;
