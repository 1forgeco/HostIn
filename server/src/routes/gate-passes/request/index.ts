import { Router } from "express";
import { handleRequestPass } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/",
  authenticateJWT as any,
  checkOrgAccess(["tenant"]) as any,
  handleRequestPass as any
);

export default router;
