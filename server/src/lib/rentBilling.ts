import { notifyTenantCircle } from "./notifications";

type TransactionClient = any;

export async function syncCurrentRentDue(tx: TransactionClient, { orgId, tenantId, room, actorUserId }: { orgId: string; tenantId: string; room: { id: string; room_number: string; monthly_rent: unknown }; actorUserId: string }) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10));
  const amount = Number(room.monthly_rent);
  const existing = await tx.due.findFirst({ where: { org_id: orgId, tenant_id: tenantId, due_type: "rent", billing_month: { gte: monthStart, lt: monthEnd } } });
  const amountPaid = Number(existing?.amount_paid ?? 0);
  const status = amountPaid >= amount ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  const description = `Monthly room rent · Room ${room.room_number}`;
  const due = existing
    ? await tx.due.update({ where: { id: existing.id }, data: { amount, description, status } })
    : await tx.due.create({ data: { org_id: orgId, tenant_id: tenantId, due_type: "rent", amount, amount_paid: 0, description, due_date: dueDate, billing_month: monthStart, status: "unpaid", created_by: actorUserId } });

  await notifyTenantCircle(tx, tenantId, { orgId, title: "Room rent updated", body: `Current monthly rent is ₹${amount.toLocaleString("en-IN")} for Room ${room.room_number}.`, type: "due_reminder", referenceId: due.id, referenceType: "due" }, actorUserId);
  return due;
}
