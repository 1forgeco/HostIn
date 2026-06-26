import { Router } from "express";
import { handleListRooms } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "staff", "tenant", "parent"]) as any,
  handleListRooms as any
);

export default router;
