import { Router } from "express";
import { handleLinkParent } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/link",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleLinkParent as any
);

export default router;
