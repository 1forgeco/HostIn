import { Router } from "express";
import { handleUpdateDueReminderConfig } from "./handler";
import { authenticateJWT } from "../../../../middleware/auth";
import { checkOrgAccess } from "../../../../middleware/orgAccess";

const router = Router();

router.put(
  "/reminder-config",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleUpdateDueReminderConfig as any
);

export default router;
