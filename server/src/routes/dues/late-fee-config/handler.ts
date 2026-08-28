import { Response } from "express";
import { DueStatus } from "../../../../generated/prisma/client";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyTenantCircle } from "../../../lib/notifications";

const LATE_FEE_DESCRIPTION = "Late payment fine";

function monthRange(input?: string) {
  const base = input ? new Date(`${input.slice(0, 7)}-01T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { end, key: start.toISOString().slice(0, 7), start };
}

function dueDateForFine(monthStart: Date, fineDay?: number | null) {
  const lastDay = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), Math.min(fineDay || 10, lastDay)));
}

export const handleGetLateFeeConfig = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  try {
    const config = await prisma.billingLateFeeConfig.findUnique({ where: { org_id: orgId } });
    return res.status(200).json({
      config: config ?? { is_active: false, fine_day: null, fine_amount: 0, description: LATE_FEE_DESCRIPTION },
    });
  } catch (error) {
    console.error("Get late fee config error:", error);
    return res.status(500).json({ error: "An error occurred fetching late fee config" });
  }
};

export const handleUpdateLateFeeConfig = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const { isActive, fineDay, fineAmount, description, billingMonth, applyToCurrentMonth = true } = req.body;
  const active = Boolean(isActive);
  const parsedFineDay = fineDay === null || fineDay === undefined || fineDay === "" ? null : Number(fineDay);
  const parsedFineAmount = fineAmount === null || fineAmount === undefined || fineAmount === "" ? 0 : Number(fineAmount);

  if (parsedFineDay !== null && (!Number.isInteger(parsedFineDay) || parsedFineDay < 1 || parsedFineDay > 31)) {
    return res.status(400).json({ error: "fineDay must be between 1 and 31" });
  }
  if (active && (!Number.isFinite(parsedFineAmount) || parsedFineAmount <= 0)) {
    return res.status(400).json({ error: "fineAmount must be a positive number when late fee is enabled" });
  }

  const { start, end, key } = monthRange(billingMonth);
  const fineDueDate = dueDateForFine(start, parsedFineDay);
  const fineDescription = String(description || LATE_FEE_DESCRIPTION).trim() || LATE_FEE_DESCRIPTION;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.billingLateFeeConfig.upsert({
        where: { org_id: orgId },
        create: {
          org_id: orgId,
          is_active: active,
          fine_day: parsedFineDay,
          fine_amount: parsedFineAmount,
          description: fineDescription,
          updated_by: userId,
          last_applied_at: applyToCurrentMonth ? new Date() : null,
        },
        update: {
          is_active: active,
          fine_day: parsedFineDay,
          fine_amount: parsedFineAmount,
          description: fineDescription,
          updated_by: userId,
          ...(applyToCurrentMonth ? { last_applied_at: new Date() } : {}),
        },
      });

      if (!applyToCurrentMonth) return { applied: 0, config, waived: 0 };

      const existingLateFees = await tx.due.findMany({
        where: { org_id: orgId, due_type: "other", billing_month: { gte: start, lt: end }, description: { startsWith: LATE_FEE_DESCRIPTION } },
      });

      if (!active) {
        const waived = await tx.due.updateMany({
          where: { id: { in: existingLateFees.map((due) => due.id) }, status: { not: "paid" } },
          data: { amount: 0, status: "waived" as DueStatus },
        });
        return { applied: 0, config, waived: waived.count };
      }

      const baseDues = await tx.due.findMany({
        where: {
          org_id: orgId,
          billing_month: { gte: start, lt: end },
          status: { in: ["unpaid", "partial", "overdue"] },
          due_type: { not: "other" },
        },
        select: { tenant_id: true, amount: true, amount_paid: true },
      });
      const tenantsWithBalance = Array.from(new Set(baseDues.filter((due) => Number(due.amount) > Number(due.amount_paid)).map((due) => due.tenant_id)));
      const existingByTenant = new Map(existingLateFees.map((due) => [due.tenant_id, due]));
      let applied = 0;

      for (const tenantId of tenantsWithBalance) {
        const existing = existingByTenant.get(tenantId);
        if (existing) {
          if (existing.status !== "paid") {
            await tx.due.update({
              where: { id: existing.id },
              data: { amount: parsedFineAmount, due_date: fineDueDate, status: "unpaid", description: `${LATE_FEE_DESCRIPTION}: ${fineDescription}` },
            });
          }
        } else {
          const due = await tx.due.create({
            data: {
              org_id: orgId,
              tenant_id: tenantId,
              due_type: "other",
              amount: parsedFineAmount,
              amount_paid: 0,
              description: `${LATE_FEE_DESCRIPTION}: ${fineDescription}`,
              due_date: fineDueDate,
              billing_month: start,
              status: "unpaid",
              created_by: userId as string,
            },
          });
          await notifyTenantCircle(tx, tenantId, { orgId, title: "Late fee added", body: `₹${parsedFineAmount.toLocaleString("en-IN")} late payment fine is due by ${fineDueDate.toLocaleDateString("en-IN")}.`, type: "due_reminder", referenceId: due.id, referenceType: "due" }, userId);
        }
        applied += 1;
      }

      const staleFees = existingLateFees.filter((due) => !tenantsWithBalance.includes(due.tenant_id) && due.status !== "paid");
      if (staleFees.length) {
        await tx.due.updateMany({ where: { id: { in: staleFees.map((due) => due.id) } }, data: { amount: 0, status: "waived" as DueStatus } });
      }

      return { applied, config, waived: staleFees.length };
    });

    return res.status(200).json({ billingMonth: key, message: "Late fee settings updated", ...result });
  } catch (error) {
    console.error("Update late fee config error:", error);
    return res.status(500).json({ error: "An error occurred updating late fee settings" });
  }
};
