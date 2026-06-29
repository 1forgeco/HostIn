import { Router } from "express";
import { authenticatePlatformJWT } from "../../../middleware/platformAuth";
import { handleActivateOnboarding, handleCreateOnboarding, handleGetOnboarding, handleSaveOnboardingStep } from "./handler";

const router = Router();
router.post("/", authenticatePlatformJWT as any, handleCreateOnboarding as any);
router.get("/:id", authenticatePlatformJWT as any, handleGetOnboarding as any);
router.put("/:id/steps/:step", authenticatePlatformJWT as any, handleSaveOnboardingStep as any);
router.post("/:id/activate", authenticatePlatformJWT as any, handleActivateOnboarding as any);

export default router;
