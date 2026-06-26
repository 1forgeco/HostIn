import { Router } from "express";
import { handleGetDueReminderConfig } from "./handler";
import { authenticateJWT } from "../../../../middleware/auth";
import { checkOrgAccess } from "../../../../middleware/orgAccess";

const router = Router();

router.get(
  "/reminder-config",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleGetDueReminderConfig as any
);

export default router;
