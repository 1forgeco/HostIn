import { Router } from "express";
import { handleLogout, handleRefresh } from "./handler";
const router = Router();
router.post("/refresh", handleRefresh as any);
router.post("/logout", handleLogout as any);
export default router;
