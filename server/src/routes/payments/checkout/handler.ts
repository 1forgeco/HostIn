import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";

export const handleCreateCheckout = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;
  const { dueId, amount } = req.body;
  const parsedAmount = Number(amount);

  if (!dueId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: "dueId and a positive amount are required" });

  try {
    const due = await prisma.due.findFirst({ where: { id: dueId, org_id: orgId }, include: { tenant: { select: { id: true, full_name: true, email: true, phone: true } } } });
    if (!due) return res.status(404).json({ error: "Due not found in this organization" });
    if (userRole === "tenant" && due.tenant_id !== userId) return res.status(403).json({ error: "Access denied. You can only pay for your own dues." });

    const remaining = Number(due.amount) - Number(due.amount_paid);
    if (parsedAmount > remaining) return res.status(400).json({ error: "Payment amount exceeds remaining due amount" });

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return res.status(200).json({
        mode: "demo",
        gateway: "razorpay",
        orderId: `hostin_demo_${Date.now()}`,
        keyId: null,
        amount: parsedAmount,
        currency: "INR",
        tenant: due.tenant,
      });
    }

    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(parsedAmount * 100),
        currency: "INR",
        receipt: `due_${due.id.slice(0, 24)}`,
        notes: { orgId, dueId: due.id, tenantId: due.tenant_id },
      }),
    });
    const order = await response.json().catch(() => ({})) as { id?: string; currency?: string; error?: { description?: string } };
    if (!response.ok) return res.status(502).json({ error: order.error?.description || "Unable to create Razorpay order" });

    return res.status(200).json({
      mode: "razorpay",
      gateway: "razorpay",
      orderId: order.id,
      keyId: env.RAZORPAY_KEY_ID,
      amount: parsedAmount,
      currency: order.currency || "INR",
      tenant: due.tenant,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return res.status(500).json({ error: "An error occurred creating payment checkout" });
  }
};
