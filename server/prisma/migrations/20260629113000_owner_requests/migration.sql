CREATE TYPE "OwnerRequestType" AS ENUM (
  'credential_creation',
  'feature_request',
  'plan_upgrade',
  'new_property',
  'staff_addition',
  'document_verification',
  'support'
);

CREATE TYPE "OwnerRequestStatus" AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'need_more_info',
  'approved',
  'fulfilled',
  'activated',
  'rejected',
  'canceled'
);

CREATE TABLE "owner_requests" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "requested_by" UUID NOT NULL,
  "type" "OwnerRequestType" NOT NULL,
  "status" "OwnerRequestStatus" NOT NULL DEFAULT 'submitted',
  "title" VARCHAR(255) NOT NULL,
  "person_name" VARCHAR(255),
  "role" "OrgRole",
  "property_name" VARCHAR(255),
  "department" VARCHAR(255),
  "reason" TEXT,
  "required_access" TEXT,
  "details" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,

  CONSTRAINT "owner_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "owner_requests_org_id_type_status_idx" ON "owner_requests"("org_id", "type", "status");
CREATE INDEX "owner_requests_requested_by_created_at_idx" ON "owner_requests"("requested_by", "created_at");

ALTER TABLE "owner_requests"
  ADD CONSTRAINT "owner_requests_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "owner_requests"
  ADD CONSTRAINT "owner_requests_requested_by_fkey"
  FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
