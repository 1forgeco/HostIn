import { NotificationType, OrgRole } from "../../generated/prisma/client";

type DbClient = any;
type Notice = {
  orgId: string;
  title: string;
  body: string;
  type?: NotificationType;
  referenceId?: string | null;
  referenceType?: string | null;
};

const unique = (values: Array<string | null | undefined>) => [...new Set(values.filter(Boolean) as string[])];

export async function notifyUsers(db: DbClient, userIds: Array<string | null | undefined>, notice: Notice, excludeUserId?: string) {
  const recipients = unique(userIds).filter((id) => id !== excludeUserId);
  if (!recipients.length) return 0;
  const result = await db.notification.createMany({
    data: recipients.map((userId) => ({
      org_id: notice.orgId,
      user_id: userId,
      title: notice.title,
      body: notice.body,
      type: notice.type ?? "other",
      reference_id: notice.referenceId ?? null,
      reference_type: notice.referenceType ?? null,
    })),
  });
  return result.count;
}

export async function notifyRoles(db: DbClient, roles: OrgRole[], notice: Notice, excludeUserId?: string) {
  const memberships = await db.userOrgRole.findMany({ where: { org_id: notice.orgId, role: { in: roles }, is_active: true }, select: { user_id: true } });
  return notifyUsers(db, memberships.map((item: { user_id: string }) => item.user_id), notice, excludeUserId);
}

export async function notifyAllMembers(db: DbClient, notice: Notice, excludeUserId?: string) {
  const memberships = await db.userOrgRole.findMany({ where: { org_id: notice.orgId, is_active: true }, select: { user_id: true } });
  return notifyUsers(db, memberships.map((item: { user_id: string }) => item.user_id), notice, excludeUserId);
}

export async function notifyTenantCircle(db: DbClient, tenantId: string, notice: Notice, excludeUserId?: string) {
  const links = await db.parentProfile.findMany({ where: { org_id: notice.orgId, tenant_id: tenantId }, select: { user_id: true } });
  return notifyUsers(db, [tenantId, ...links.map((item: { user_id: string }) => item.user_id)], notice, excludeUserId);
}
