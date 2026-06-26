import { Router } from "express";
import { handleUpdateOrganization } from "./handler";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";

const router = Router();

router.put(
  "/:id",
  authenticatePlatformJWT as any,
  handleUpdateOrganization as any
);

export default router;
