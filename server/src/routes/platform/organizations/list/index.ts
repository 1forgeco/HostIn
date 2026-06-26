import { Router } from "express";
import { handleListOrganizations } from "./handler";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";

const router = Router();

router.get(
  "/",
  authenticatePlatformJWT as any,
  handleListOrganizations as any
);

export default router;
