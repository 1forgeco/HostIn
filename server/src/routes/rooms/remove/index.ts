import { Router } from "express";
import { handleRemoveTenantFromRoom } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:roomId/tenants/:tenantProfileId/remove",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleRemoveTenantFromRoom as any
);

export default router;
