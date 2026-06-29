import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { AuthenticatedRequest } from "../../../middleware/auth";

const schema = z.object({ password: z.string().min(12).max(128) });

export const handleChangePassword = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Password must contain at least 12 characters" });
  if (!req.user?.userId) return res.status(401).json({ error: "Unauthorized" });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { id: req.user.userId }, data: { password_hash: passwordHash, force_password_change: false, account_status: "active", is_active: true } });
  return res.json({ message: "Password updated" });
};
