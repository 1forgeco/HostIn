import { Router } from "express";
import { handleLogin } from "./handler";

const router = Router();

router.post("/", handleLogin);

export default router;
