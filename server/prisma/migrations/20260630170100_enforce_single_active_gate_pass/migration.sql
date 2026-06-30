-- Requests that were never used should not block a tenant after their time window.
UPDATE "gate_passes"
SET "status" = 'expired'
WHERE "status" IN ('pending', 'approved')
  AND "actual_out_time" IS NULL
  AND "expected_return_time" < NOW();

-- Preserve the newest open request if legacy data contains duplicates.
WITH ranked_open_passes AS (
  SELECT "id",
         ROW_NUMBER() OVER (
           PARTITION BY "org_id", "tenant_id"
           ORDER BY "created_at" DESC, "id" DESC
         ) AS open_rank
  FROM "gate_passes"
  WHERE "status" IN ('pending', 'approved')
)
UPDATE "gate_passes"
SET "status" = 'cancelled'
WHERE "id" IN (
  SELECT "id" FROM ranked_open_passes WHERE open_rank > 1
);

CREATE UNIQUE INDEX "gate_passes_one_open_per_tenant"
ON "gate_passes" ("org_id", "tenant_id")
WHERE "status" IN ('pending', 'approved');
