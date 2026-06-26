import { Router } from "express";
import { handleListPlans } from "./handler";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";

const router = Router();

router.get(
  "/",
  authenticatePlatformJWT as any,
  handleListPlans as any
);

export default router;
