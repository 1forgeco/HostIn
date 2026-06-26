import { Router } from "express";
import { handleCreateAnnouncement } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleCreateAnnouncement as any
);

export default router;
