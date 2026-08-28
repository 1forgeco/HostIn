import { Router } from "express";
import { authenticatePlatformJWT } from "../../../middleware/platformAuth";
import { handleCreatePlatformRequestMessage, handleListPlatformRequests, handleUpdatePlatformRequestStatus } from "./handler";

const router = Router();

router.get("/", authenticatePlatformJWT as any, handleListPlatformRequests as any);
router.put("/:id/status", authenticatePlatformJWT as any, handleUpdatePlatformRequestStatus as any);
router.post("/:id/messages", authenticatePlatformJWT as any, handleCreatePlatformRequestMessage as any);

export default router;
