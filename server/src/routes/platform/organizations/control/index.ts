import { Router } from "express";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";
import { handleDeleteAccessOverride, handleGetOrganizationControl, handleResetAccountPassword, handleUpdateAccountStatus, handleUpdateRoleDashboard, handleUpdateRolePermission, handleUpsertAccessOverride } from "./handler";

const router = Router();
router.get("/:id/control", authenticatePlatformJWT as any, handleGetOrganizationControl as any);
router.put("/:id/role-dashboards/:role", authenticatePlatformJWT as any, handleUpdateRoleDashboard as any);
router.put("/:id/role-permissions/:role/:featureKey", authenticatePlatformJWT as any, handleUpdateRolePermission as any);
router.put("/:id/accounts/:userId/status", authenticatePlatformJWT as any, handleUpdateAccountStatus as any);
router.post("/:id/accounts/:userId/reset-password", authenticatePlatformJWT as any, handleResetAccountPassword as any);
router.post("/:id/access-overrides", authenticatePlatformJWT as any, handleUpsertAccessOverride as any);
router.delete("/:id/access-overrides/:overrideId", authenticatePlatformJWT as any, handleDeleteAccessOverride as any);
export default router;
