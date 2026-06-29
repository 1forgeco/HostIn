CREATE TYPE "WorkspaceStatus" AS ENUM ('draft', 'setup_incomplete', 'ready', 'active', 'suspended', 'canceled');
CREATE TYPE "AccountStatus" AS ENUM ('pending', 'active', 'inactive', 'suspended', 'left', 'archived');
CREATE TYPE "RoleDashboardStatus" AS ENUM ('active', 'inactive', 'plan_locked', 'setup_required', 'suspended');
CREATE TYPE "PersonStatus" AS ENUM ('active', 'inactive', 'left', 'archived');
CREATE TYPE "AccessDecision" AS ENUM ('allow', 'block');

ALTER TABLE "organizations"
  ADD COLUMN "client_type" VARCHAR(50),
  ADD COLUMN "branch_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "billing_cycle" VARCHAR(50) NOT NULL DEFAULT 'monthly',
  ADD COLUMN "start_date" DATE,
  ADD COLUMN "workspace_status" "WorkspaceStatus" NOT NULL DEFAULT 'active';

CREATE TABLE "client_onboarding" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "current_step" INTEGER NOT NULL DEFAULT 1,
  "status" "WorkspaceStatus" NOT NULL DEFAULT 'draft',
  "structure_data" JSONB NOT NULL DEFAULT '{}',
  "rooms_data" JSONB NOT NULL DEFAULT '{}',
  "people_data" JSONB NOT NULL DEFAULT '{}',
  "roles_data" JSONB NOT NULL DEFAULT '{}',
  "accounts_data" JSONB NOT NULL DEFAULT '{}',
  "features_data" JSONB NOT NULL DEFAULT '{}',
  "branding_data" JSONB NOT NULL DEFAULT '{}',
  "review_data" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "client_onboarding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_onboarding_org_id_key" ON "client_onboarding"("org_id");
ALTER TABLE "client_onboarding" ADD CONSTRAINT "client_onboarding_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "people" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "full_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "email" VARCHAR(255),
  "person_type" VARCHAR(50) NOT NULL,
  "branch" VARCHAR(255),
  "room_number" VARCHAR(50),
  "emergency_contact_name" VARCHAR(255),
  "emergency_contact_phone" VARCHAR(20),
  "parent_name" VARCHAR(255),
  "parent_phone" VARCHAR(20),
  "joining_date" DATE,
  "status" "PersonStatus" NOT NULL DEFAULT 'active',
  "metadata" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "people_org_id_person_type_status_idx" ON "people"("org_id", "person_type", "status");
CREATE INDEX "people_org_id_phone_idx" ON "people"("org_id", "phone");
ALTER TABLE "people" ADD CONSTRAINT "people_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users"
  ADD COLUMN "account_status" "AccountStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "force_password_change" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "real_email" VARCHAR(255),
  ADD COLUMN "person_id" UUID;

CREATE UNIQUE INDEX "users_person_id_key" ON "users"("person_id");
ALTER TABLE "users" ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "role_dashboards" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "role" "OrgRole" NOT NULL,
  "status" "RoleDashboardStatus" NOT NULL DEFAULT 'active',
  "config" JSONB,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "role_dashboards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "role_dashboards_org_id_role_key" ON "role_dashboards"("org_id", "role");
ALTER TABLE "role_dashboards" ADD CONSTRAINT "role_dashboards_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "role_feature_permissions" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "role" "OrgRole" NOT NULL,
  "feature_key" VARCHAR(255) NOT NULL,
  "is_allowed" BOOLEAN NOT NULL DEFAULT true,
  "permissions" JSONB,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "role_feature_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "role_feature_permissions_org_id_role_feature_key_key" ON "role_feature_permissions"("org_id", "role", "feature_key");
ALTER TABLE "role_feature_permissions" ADD CONSTRAINT "role_feature_permissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "access_overrides" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "OrgRole" NOT NULL,
  "feature_key" VARCHAR(255) NOT NULL,
  "decision" "AccessDecision" NOT NULL,
  "reason" TEXT,
  "expires_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  CONSTRAINT "access_overrides_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "access_overrides_org_id_user_id_role_feature_key_key" ON "access_overrides"("org_id", "user_id", "role", "feature_key");
CREATE INDEX "access_overrides_org_id_role_feature_key_idx" ON "access_overrides"("org_id", "role", "feature_key");
ALTER TABLE "access_overrides" ADD CONSTRAINT "access_overrides_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_overrides" ADD CONSTRAINT "access_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
