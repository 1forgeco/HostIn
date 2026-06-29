import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";
import { handleCreateOwnerRequest, handleListOwnerRequests } from "./handler";

const router = Router();

router.get("/", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleListOwnerRequests as any);
router.post("/", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleCreateOwnerRequest as any);

export default router;
