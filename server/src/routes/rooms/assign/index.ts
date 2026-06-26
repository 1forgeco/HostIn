import { Router } from "express";
import { handleAssignTenantToRoom } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.post(
  "/:roomId/assign-tenant",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleAssignTenantToRoom as any
);

export default router;
