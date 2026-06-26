import { Router } from "express";
import { handleGetRoomHistory } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/:id/history",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleGetRoomHistory as any
);

export default router;
