CREATE TYPE "OwnerRequestEventType" AS ENUM ('status_change', 'message', 'payment', 'fulfillment', 'internal_note');

CREATE TABLE "owner_request_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_platform_user_id" UUID,
    "actor_label" VARCHAR(255) NOT NULL,
    "event_type" "OwnerRequestEventType" NOT NULL,
    "from_status" "OwnerRequestStatus",
    "to_status" "OwnerRequestStatus",
    "message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_request_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "owner_request_events_request_id_created_at_idx" ON "owner_request_events"("request_id", "created_at");
CREATE INDEX "owner_request_events_org_id_created_at_idx" ON "owner_request_events"("org_id", "created_at");

ALTER TABLE "owner_request_events" ADD CONSTRAINT "owner_request_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "owner_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "owner_request_events" ADD CONSTRAINT "owner_request_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "owner_request_events" ADD CONSTRAINT "owner_request_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "owner_request_events" ADD CONSTRAINT "owner_request_events_actor_platform_user_id_fkey" FOREIGN KEY ("actor_platform_user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
