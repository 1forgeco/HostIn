import { Router } from "express";
import { authenticatePlatformJWT } from "../../../middleware/platformAuth";
import { handlePlatformNotifications, handlePlatformNotificationStream } from "./handler";

const router = Router();
router.get("/", authenticatePlatformJWT as any, handlePlatformNotifications as any);
router.get("/stream", authenticatePlatformJWT as any, handlePlatformNotificationStream as any);
export default router;
