import { Router } from "express";
import { handleListAnnouncements } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "staff", "guard", "tenant"]) as any,
  handleListAnnouncements as any
);

export default router;
