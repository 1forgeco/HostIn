import { Router } from "express";
import { authenticatePlatformJWT } from "../../../middleware/platformAuth";
import { handlePlatformNotifications } from "./handler";

const router = Router();
router.get("/", authenticatePlatformJWT as any, handlePlatformNotifications as any);
export default router;
