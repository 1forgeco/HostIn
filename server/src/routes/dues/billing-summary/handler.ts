import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

const CURRENT_LIMIT = 500;

function monthRange(input?: string) {
  const base = input ? new Date(`${input.slice(0, 7)}-01T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { end, key: start.toISOString().slice(0, 7), start };
}

function statusFrom(amount: number, paid: number, dueDate?: Date) {
  if (paid >= amount && amount > 0) return "paid";
  if (paid > 0) return "partial";
  if (dueDate && dueDate.getTime() < Date.now()) return "overdue";
  return "unpaid";
}

export const handleBillingSummary = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const userId = req.user?.userId;
  const userRole = req.userOrgRole;
  const { start, end, key } = monthRange(req.query.month as string | undefined);

  try {
    const tenantWhere = userRole === "tenant" ? { user_id: userId as string } : {};
    const [dues, payments, tenants, lateFeeConfig] = await Promise.all([
      prisma.due.findMany({
        where: { org_id: orgId, billing_month: { gte: start, lt: end }, ...(userRole === "tenant" ? { tenant_id: userId } : {}) },
        include: { tenant: { select: { id: true, full_name: true, email: true, phone: true } }, payments: { where: { status: "successful" }, orderBy: { paid_at: "desc" } } },
        orderBy: [{ due_date: "asc" }, { created_at: "asc" }],
        take: CURRENT_LIMIT,
      }),
      prisma.payment.findMany({
        where: { org_id: orgId, status: "successful", paid_at: { gte: start, lt: end }, ...(userRole === "tenant" ? { tenant_id: userId } : {}) },
        include: { tenant: { select: { id: true, full_name: true } }, due: { select: { due_type: true, description: true } } },
        orderBy: { paid_at: "desc" },
        take: 20,
      }),
      prisma.tenantProfile.findMany({
        where: { org_id: orgId, is_active: true, ...tenantWhere },
        include: { user: { select: { id: true, full_name: true, email: true, phone: true, profile_photo_url: true } }, room: { select: { room_number: true, room_type: true, monthly_rent: true } } },
        orderBy: { admission_date: "desc" },
        take: CURRENT_LIMIT,
      }),
      prisma.billingLateFeeConfig.findUnique({ where: { org_id: orgId } }),
    ]);

    const duesByTenant = new Map<string, typeof dues>();
    for (const due of dues) {
      duesByTenant.set(due.tenant_id, [...(duesByTenant.get(due.tenant_id) ?? []), due]);
    }

    const tenantRows = tenants.map((profile) => {
      const tenantDues = duesByTenant.get(profile.user_id) ?? [];
      const totalAmount = tenantDues.reduce((sum, due) => sum + Number(due.amount), 0);
      const paidAmount = tenantDues.reduce((sum, due) => sum + Number(due.amount_paid), 0);
      const latestDueDate = tenantDues.map((due) => due.due_date).sort((a, b) => b.getTime() - a.getTime())[0];
      return {
        tenant: {
          id: profile.user.id,
          fullName: profile.user.full_name,
          email: profile.user.email,
          phone: profile.user.phone,
          profilePhotoUrl: profile.user.profile_photo_url,
        },
        room: profile.room ? { number: profile.room.room_number, type: profile.room.room_type, monthlyRent: profile.room.monthly_rent } : null,
        dueCount: tenantDues.length,
        dueDate: latestDueDate,
        status: statusFrom(totalAmount, paidAmount, latestDueDate),
        totalAmount,
        paidAmount,
        balanceAmount: Math.max(0, totalAmount - paidAmount),
      };
    });

    const totalAmount = tenantRows.reduce((sum, row) => sum + row.totalAmount, 0);
    const paidAmount = tenantRows.reduce((sum, row) => sum + row.paidAmount, 0);
    const overdueRows = tenantRows.filter((row) => row.status === "overdue");

    return res.status(200).json({
      month: key,
      lateFeeConfig,
      summary: {
        totalAmount,
        paidAmount,
        balanceAmount: Math.max(0, totalAmount - paidAmount),
        overdueAmount: overdueRows.reduce((sum, row) => sum + row.balanceAmount, 0),
        collectionRate: totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0,
        tenantCount: tenantRows.length,
        overdueCount: overdueRows.length,
      },
      tenants: tenantRows,
      dues,
      payments,
    });
  } catch (error) {
    console.error("Billing summary error:", error);
    return res.status(500).json({ error: "An error occurred fetching billing summary" });
  }
};
