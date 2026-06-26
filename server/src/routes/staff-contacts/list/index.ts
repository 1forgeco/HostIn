import { Router } from "express";
import { handleListStaffContacts } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "staff", "tenant"]) as any,
  handleListStaffContacts as any
);

export default router;
