import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";
import { handleWardenDashboard } from "./handler";

const router = Router();
router.get("/", authenticateJWT as any, checkOrgAccess(["warden"]) as any, handleWardenDashboard as any);
export default router;
