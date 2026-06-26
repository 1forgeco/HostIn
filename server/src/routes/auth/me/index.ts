import { Router } from "express";
import { handleMe } from "./handler";
import { authenticateJWT } from "../../../middleware/auth";

const router = Router();

router.get("/", authenticateJWT as any, handleMe);

export default router;
