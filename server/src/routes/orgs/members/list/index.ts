import { Router } from "express";
import { handleListMembers } from "./handler";
import { authenticateJWT } from "../../../../middleware/auth";
import { checkOrgAccess } from "../../../../middleware/orgAccess";

const router = Router({ mergeParams: true });

router.get(
  "/members",
  authenticateJWT as any,
  checkOrgAccess(["owner", "warden"]) as any,
  handleListMembers as any
);

export default router;
