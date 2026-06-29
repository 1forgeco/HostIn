import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth";
import { handleChangePassword } from "./handler";

const router = Router();
router.post("/", authenticateJWT as any, handleChangePassword as any);
export default router;
