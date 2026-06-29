import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";
import { handleGetOwnerDashboard } from "./handler";

const router = Router();

router.get("/", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleGetOwnerDashboard as any);

export default router;
