ALTER TABLE "user_org_roles" ADD COLUMN "account_slug" VARCHAR(255), ADD COLUMN "is_primary" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "user_org_roles_org_id_account_slug_key" ON "user_org_roles"("org_id", "account_slug");
