import { Router } from "express";
import { handleToggleOrgFeatures } from "./handler";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";

const router = Router();

router.post(
  "/:id/features",
  authenticatePlatformJWT as any,
  handleToggleOrgFeatures as any
);

export default router;
