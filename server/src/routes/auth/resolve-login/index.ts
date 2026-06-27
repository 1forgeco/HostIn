import { Router } from "express";
import { handleResolveLogin } from "./handler";
const router = Router();
router.post("/", handleResolveLogin as any);
export default router;
