CREATE INDEX "user_org_roles_org_id_role_is_active_idx"
ON "user_org_roles" ("org_id", "role", "is_active");

CREATE INDEX "parent_profiles_org_id_tenant_id_idx"
ON "parent_profiles" ("org_id", "tenant_id");

CREATE INDEX "payments_org_id_status_paid_at_idx"
ON "payments" ("org_id", "status", "paid_at");

CREATE INDEX "documents_org_id_is_verified_created_at_idx"
ON "documents" ("org_id", "is_verified", "created_at");

CREATE INDEX "notifications_org_id_user_id_created_at_idx"
ON "notifications" ("org_id", "user_id", "created_at");
