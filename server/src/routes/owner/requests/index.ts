import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";
import { handleCreateOwnerPurchase, handleCreateOwnerRequest, handleCreateOwnerRequestMessage, handleGetOwnerPurchaseOptions, handleListOwnerRequests } from "./handler";

const router = Router();

router.get("/", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleListOwnerRequests as any);
router.get("/purchase-options", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleGetOwnerPurchaseOptions as any);
router.post("/purchase", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleCreateOwnerPurchase as any);
router.post("/:id/messages", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleCreateOwnerRequestMessage as any);
router.post("/", authenticateJWT as any, checkOrgAccess(["owner"]) as any, handleCreateOwnerRequest as any);

export default router;
