import { Router } from "express";
import { handleCreateOrUpdatePlan } from "./handler";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";

const router = Router();

router.post(
  "/",
  authenticatePlatformJWT as any,
  handleCreateOrUpdatePlan as any
);

export default router;
