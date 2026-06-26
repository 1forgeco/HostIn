import { Router } from "express";
import { handleGetRoomDetails } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.get(
  "/:roomId",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden", "guard", "staff", "tenant", "parent"]) as any,
  handleGetRoomDetails as any
);

export default router;
