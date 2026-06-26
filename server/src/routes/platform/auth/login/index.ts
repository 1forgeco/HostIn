import { Router } from "express";
import { handlePlatformLogin } from "./handler";

const router = Router();

router.post("/login", handlePlatformLogin as any);

export default router;
