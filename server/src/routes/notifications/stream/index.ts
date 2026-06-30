import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";
import { handleNotificationStream } from "./handler";

const router = Router();
router.get("/stream", authenticateJWT as any, checkOrgAccess(["owner", "warden", "guard", "staff", "tenant", "parent"]) as any, handleNotificationStream as any);
export default router;
