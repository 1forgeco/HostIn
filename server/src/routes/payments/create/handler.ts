import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { PaymentMethod, PaymentGateway, DueStatus } from "../../../../generated/prisma/client";

export const handleRecordPayment = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;

  const { dueId, amount, paymentMethod, gateway, gatewayPaymentId, receiptUrl } = req.body;

  if (!dueId || amount === undefined || !paymentMethod) {
    return res.status(400).json({
      error: "Missing required fields (dueId, amount, paymentMethod)",
    });
  }

  // Validate PaymentMethod enum
  const validMethods = Object.values(PaymentMethod);
  if (!validMethods.includes(paymentMethod as PaymentMethod)) {
    return res.status(400).json({ error: `Invalid paymentMethod. Must be one of: ${validMethods.join(", ")}` });
  }

  // Validate PaymentGateway enum if provided
  if (gateway) {
    const validGateways = Object.values(PaymentGateway);
    if (!validGateways.includes(gateway as PaymentGateway)) {
      return res.status(400).json({ error: `Invalid gateway. Must be one of: ${validGateways.join(", ")}` });
    }
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    // Find the due
    const due = await prisma.due.findFirst({
      where: {
        id: dueId,
        org_id: orgId,
      },
    });

    if (!due) {
      return res.status(404).json({ error: "Due not found in this organization" });
    }

    // Tenant isolation check
    if (userRole === "tenant" && due.tenant_id !== userId) {
      return res.status(403).json({ error: "Access denied. You can only pay for your own dues." });
    }

    if (due.status === "paid") {
      return res.status(400).json({ error: "This due has already been fully paid" });
    }

    // Convert decimal columns to float for calculation
    const dueAmount = Number(due.amount);
    const duePaid = Number(due.amount_paid);
    const remaining = dueAmount - duePaid;

    if (parsedAmount > remaining) {
      return res.status(400).json({
        error: `Payment amount (${parsedAmount}) exceeds the remaining due amount (${remaining.toFixed(2)})`,
      });
    }

    // Perform atomic transaction
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payRecord = await tx.payment.create({
        data: {
          org_id: orgId,
          tenant_id: due.tenant_id,
          due_id: dueId,
          amount: parsedAmount,
          payment_method: paymentMethod as PaymentMethod,
          gateway: (gateway as PaymentGateway) || "manual",
          gateway_payment_id: gatewayPaymentId || null,
          status: "successful",
          paid_by: userId as string,
          paid_at: new Date(),
          receipt_url: receiptUrl || null,
        },
      });

      // 2. Update Due values
      const newPaidAmount = duePaid + parsedAmount;
      let newStatus: DueStatus = "partial";
      if (newPaidAmount >= dueAmount) {
        newStatus = "paid";
      }

      await tx.due.update({
        where: { id: dueId },
        data: {
          amount_paid: newPaidAmount,
          status: newStatus,
        },
      });

      return payRecord;
    });

    return res.status(201).json({
      message: "Payment recorded and due updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    return res.status(500).json({ error: "An error occurred during payment recording" });
  }
};
