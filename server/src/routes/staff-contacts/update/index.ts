import { Router } from "express";
import { handleUpdateStaffContact } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.put(
  "/:id",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleUpdateStaffContact as any
);

export default router;
