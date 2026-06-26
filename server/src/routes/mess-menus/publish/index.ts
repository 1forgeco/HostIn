import { Router } from "express";
import { handlePublishMessMenu } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";
import { checkOrgAccess } from "../../../middleware/orgAccess";

const router = Router();

router.post(
  "/:id/publish",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handlePublishMessMenu as any
);

export default router;
