import { Router } from "express";
import { handleReadAnnouncement } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:id/read",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "staff", "guard", "tenant", "parent"]) as any,
  handleReadAnnouncement as any
);

export default router;
