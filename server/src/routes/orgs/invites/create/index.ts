import { Router } from "express";
import { handleCreateInvite } from "./handler";
import { authenticateJWT } from "../../../../middleware/auth";

const router = Router();

router.post("/", authenticateJWT as any, handleCreateInvite);

export default router;
