import { Router } from "express";
import { handleGetLateFeeConfig, handleUpdateLateFeeConfig } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/late-fee-config",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleGetLateFeeConfig as any
);

router.put(
  "/late-fee-config",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleUpdateLateFeeConfig as any
);

export default router;
