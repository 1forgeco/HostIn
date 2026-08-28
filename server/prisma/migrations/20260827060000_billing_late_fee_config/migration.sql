CREATE TABLE "billing_late_fee_configs" (
  "id" UUID NOT NULL,
  "org_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "fine_day" INTEGER,
  "fine_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "description" TEXT,
  "last_applied_at" TIMESTAMP(6),
  "updated_by" UUID,
  "updated_at" TIMESTAMP(6) NOT NULL,

  CONSTRAINT "billing_late_fee_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_late_fee_configs_org_id_key" ON "billing_late_fee_configs"("org_id");

ALTER TABLE "billing_late_fee_configs"
  ADD CONSTRAINT "billing_late_fee_configs_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "billing_late_fee_configs"
  ADD CONSTRAINT "billing_late_fee_configs_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
