import { Router } from "express";
import { handleGetWardDetails } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.get(
  "/ward",
  authenticateJWT as any,
  checkOrgAccess(["parent"]) as any,
  handleGetWardDetails as any
);

export default router;
