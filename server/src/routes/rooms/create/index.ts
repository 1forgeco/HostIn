import { Router } from "express";
import { handleCreateRoom } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleCreateRoom as any
);

export default router;
