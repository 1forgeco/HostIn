type DbClient = any;

export async function expireUnusedGatePasses(db: DbClient, orgId: string, tenantId?: string) {
  return db.gatePass.updateMany({
    where: {
      org_id: orgId,
      ...(tenantId ? { tenant_id: tenantId } : {}),
      status: { in: ["pending", "approved"] },
      actual_out_time: null,
      expected_return_time: { lt: new Date() },
    },
    data: { status: "expired" },
  });
}
