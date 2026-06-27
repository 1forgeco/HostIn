import { Router } from "express";
import { authenticatePlatformJWT } from "../../../../middleware/platformAuth";
import { handleCreateOrganizationAccount } from "./handler";
const router = Router();
router.post("/:id/accounts", authenticatePlatformJWT as any, handleCreateOrganizationAccount as any);
export default router;
