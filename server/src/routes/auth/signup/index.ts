import { Router } from "express";
import { handleSignup } from "./handler";

const router = Router();

router.post("/", handleSignup);

export default router;
