/*
  Warnings:

  - The values [admin] on the enum `OrgRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `ip_address` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(45)`.
  - You are about to drop the column `title_body` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `razorpay_order_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `razorpay_payment_id` on the `payments` table. All the data in the column will be lost.
  - The `status` column on the `tenant_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[announcement_id,user_id]` on the table `announcement_reads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,floor_number]` on the table `floors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,menu_item_id]` on the table `mess_feedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[menu_id,day_of_week,meal_type]` on the table `mess_menu_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,week_start_date]` on the table `mess_menus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,feature_key]` on the table `org_features` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,tenant_id,org_id]` on the table `parent_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,room_number]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,org_id]` on the table `tenant_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,org_id,role]` on the table `user_org_roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `dues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `gate_passes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `mess_menus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `body` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `parent_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tier` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `staff_contacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tenant_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_org_roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `visitors` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('starter', 'growth', 'pro');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('razorpay', 'cashfree', 'phonepe', 'stripe', 'manual');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('onboarding', 'active', 'deactivated');

-- AlterEnum
ALTER TYPE "ComplaintCategory" ADD VALUE 'noise';

-- AlterEnum
ALTER TYPE "DueStatus" ADD VALUE 'waived';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DueType" ADD VALUE 'electricity';
ALTER TYPE "DueType" ADD VALUE 'damage';
ALTER TYPE "DueType" ADD VALUE 'mess';
ALTER TYPE "DueType" ADD VALUE 'laundry';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'due_reminder';

-- AlterEnum
BEGIN;
CREATE TYPE "OrgRole_new" AS ENUM ('owner', 'warden', 'guard', 'staff', 'tenant', 'parent');
ALTER TABLE "user_org_roles" ALTER COLUMN "role" TYPE "OrgRole_new" USING ("role"::text::"OrgRole_new");
ALTER TABLE "onboarding_invites" ALTER COLUMN "role" TYPE "OrgRole_new" USING ("role"::text::"OrgRole_new");
ALTER TYPE "OrgRole" RENAME TO "OrgRole_old";
ALTER TYPE "OrgRole_new" RENAME TO "OrgRole";
DROP TYPE "public"."OrgRole_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StaffRoleType" ADD VALUE 'plumber';
ALTER TYPE "StaffRoleType" ADD VALUE 'electrician';

-- DropForeignKey
ALTER TABLE "announcement_reads" DROP CONSTRAINT "announcement_reads_announcement_id_fkey";

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_org_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_org_id_fkey";

-- DropForeignKey
ALTER TABLE "complaint_updates" DROP CONSTRAINT "complaint_updates_complaint_id_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_org_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_org_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_verified_by_fkey";

-- DropForeignKey
ALTER TABLE "dues" DROP CONSTRAINT "dues_org_id_fkey";

-- DropForeignKey
ALTER TABLE "floors" DROP CONSTRAINT "floors_org_id_fkey";

-- DropForeignKey
ALTER TABLE "gate_passes" DROP CONSTRAINT "gate_passes_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "gate_passes" DROP CONSTRAINT "gate_passes_org_id_fkey";

-- DropForeignKey
ALTER TABLE "mess_feedback" DROP CONSTRAINT "mess_feedback_menu_item_id_fkey";

-- DropForeignKey
ALTER TABLE "mess_feedback" DROP CONSTRAINT "mess_feedback_org_id_fkey";

-- DropForeignKey
ALTER TABLE "mess_menu_items" DROP CONSTRAINT "mess_menu_items_menu_id_fkey";

-- DropForeignKey
ALTER TABLE "mess_menus" DROP CONSTRAINT "mess_menus_org_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_org_id_fkey";

-- DropForeignKey
ALTER TABLE "onboarding_invites" DROP CONSTRAINT "onboarding_invites_org_id_fkey";

-- DropForeignKey
ALTER TABLE "org_features" DROP CONSTRAINT "org_features_org_id_fkey";

-- DropForeignKey
ALTER TABLE "parent_profiles" DROP CONSTRAINT "parent_profiles_org_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_org_id_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_org_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_contacts" DROP CONSTRAINT "staff_contacts_org_id_fkey";

-- DropForeignKey
ALTER TABLE "tenant_profiles" DROP CONSTRAINT "tenant_profiles_org_id_fkey";

-- DropForeignKey
ALTER TABLE "user_org_roles" DROP CONSTRAINT "user_org_roles_org_id_fkey";

-- DropForeignKey
ALTER TABLE "visitors" DROP CONSTRAINT "visitors_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "visitors" DROP CONSTRAINT "visitors_org_id_fkey";

-- AlterTable
ALTER TABLE "announcement_reads" ALTER COLUMN "read_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "target_id" DROP NOT NULL,
ALTER COLUMN "send_push" SET DEFAULT false,
ALTER COLUMN "send_whatsapp" SET DEFAULT false,
ALTER COLUMN "scheduled_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" DROP NOT NULL,
ALTER COLUMN "old_value" DROP NOT NULL,
ALTER COLUMN "new_value" DROP NOT NULL,
ALTER COLUMN "ip_address" DROP NOT NULL,
ALTER COLUMN "ip_address" SET DATA TYPE VARCHAR(45),
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "complaint_updates" ALTER COLUMN "note" DROP NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "photo_urls" TEXT[],
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'open',
ALTER COLUMN "priority" SET DEFAULT 'medium',
ALTER COLUMN "assigned_to" DROP NOT NULL,
ALTER COLUMN "resolved_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "verified_at" TIMESTAMP(6),
ALTER COLUMN "is_verified" SET DEFAULT false,
ALTER COLUMN "verified_by" DROP NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "dues" ADD COLUMN     "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'unpaid';

-- AlterTable
ALTER TABLE "floors" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "gate_passes" ADD COLUMN     "checked_by" UUID,
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "actual_out_time" DROP NOT NULL,
ALTER COLUMN "actual_in_time" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "approved_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mess_feedback" ALTER COLUMN "note" DROP NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "mess_menu_items" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "mess_menus" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "is_published" SET DEFAULT false,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "title_body",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "title" VARCHAR(255) NOT NULL,
ALTER COLUMN "reference_id" DROP NOT NULL,
ALTER COLUMN "reference_type" DROP NOT NULL,
ALTER COLUMN "channel" SET DEFAULT 'in_app',
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "read_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "onboarding_invites" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "org_features" ALTER COLUMN "is_enabled" SET DEFAULT false;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_phone" VARCHAR(20),
ADD COLUMN     "group_id" UUID,
ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "longitude" DECIMAL(11,8),
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "logo_url" DROP NOT NULL,
ALTER COLUMN "plan_expires_at" DROP NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "parent_profiles" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "can_see_roommate_contact" SET DEFAULT false,
ALTER COLUMN "can_see_parent_contact" SET DEFAULT false,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "razorpay_order_id",
DROP COLUMN "razorpay_payment_id",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gateway" "PaymentGateway" NOT NULL DEFAULT 'manual',
ADD COLUMN     "gateway_order_id" VARCHAR(255),
ADD COLUMN     "gateway_payment_id" VARCHAR(255),
ADD COLUMN     "receipt_url" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "paid_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tier" "PlanTier" NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "current_occupancy" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'available';

-- AlterTable
ALTER TABLE "staff_contacts" ADD COLUMN     "is_emergency" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tenant_profiles" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deactivated_at" TIMESTAMP(6),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "expected_exit_date" DROP NOT NULL,
ALTER COLUMN "college_or_company" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TenantStatus" NOT NULL DEFAULT 'onboarding',
ALTER COLUMN "onboarding_token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_org_roles" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "profile_photo_url" DROP NOT NULL,
ALTER COLUMN "is_active" SET DEFAULT true,
ALTER COLUMN "last_login_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "visitor_id_proof" VARCHAR(255),
ALTER COLUMN "actual_in_time" DROP NOT NULL,
ALTER COLUMN "actual_out_time" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "approved_by" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platform_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_audit_logs" (
    "id" UUID NOT NULL,
    "platform_user_id" UUID NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "entity_type" VARCHAR(255) NOT NULL,
    "entity_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "metric_date" DATE NOT NULL,
    "active_tenants" INTEGER NOT NULL DEFAULT 0,
    "vacant_seats" INTEGER NOT NULL DEFAULT 0,
    "revenue_collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "revenue_outstanding" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_groups" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(512) NOT NULL,
    "device" VARCHAR(255),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_assignment_history" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacated_at" TIMESTAMP(6),
    "reason" VARCHAR(255),

    CONSTRAINT "room_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "due_reminder_configs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "reminder_days" INTEGER[],
    "send_whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "send_push" BOOLEAN NOT NULL DEFAULT true,
    "send_sms" BOOLEAN NOT NULL DEFAULT false,
    "send_to_parent" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "due_reminder_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_users_email_key" ON "platform_users"("email");

-- CreateIndex
CREATE INDEX "platform_audit_logs_platform_user_id_idx" ON "platform_audit_logs"("platform_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_metrics_org_id_metric_date_key" ON "platform_metrics"("org_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "room_assignment_history_org_id_room_id_idx" ON "room_assignment_history"("org_id", "room_id");

-- CreateIndex
CREATE INDEX "room_assignment_history_tenant_id_idx" ON "room_assignment_history"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "due_reminder_configs_org_id_key" ON "due_reminder_configs"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_user_id_key" ON "announcement_reads"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "announcements_org_id_created_at_idx" ON "announcements"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_org_id_entity_type_idx" ON "audit_logs"("org_id", "entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "complaints_org_id_status_idx" ON "complaints"("org_id", "status");

-- CreateIndex
CREATE INDEX "complaints_tenant_id_idx" ON "complaints"("tenant_id");

-- CreateIndex
CREATE INDEX "documents_tenant_id_idx" ON "documents"("tenant_id");

-- CreateIndex
CREATE INDEX "dues_org_id_tenant_id_status_idx" ON "dues"("org_id", "tenant_id", "status");

-- CreateIndex
CREATE INDEX "dues_org_id_due_date_idx" ON "dues"("org_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "floors_org_id_floor_number_key" ON "floors"("org_id", "floor_number");

-- CreateIndex
CREATE INDEX "gate_passes_org_id_status_idx" ON "gate_passes"("org_id", "status");

-- CreateIndex
CREATE INDEX "gate_passes_tenant_id_status_idx" ON "gate_passes"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mess_feedback_tenant_id_menu_item_id_key" ON "mess_feedback"("tenant_id", "menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "mess_menu_items_menu_id_day_of_week_meal_type_key" ON "mess_menu_items"("menu_id", "day_of_week", "meal_type");

-- CreateIndex
CREATE UNIQUE INDEX "mess_menus_org_id_week_start_date_key" ON "mess_menus"("org_id", "week_start_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_org_id_type_idx" ON "notifications"("org_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "org_features_org_id_feature_key_key" ON "org_features"("org_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_user_id_tenant_id_org_id_key" ON "parent_profiles"("user_id", "tenant_id", "org_id");

-- CreateIndex
CREATE INDEX "payments_org_id_paid_at_idx" ON "payments"("org_id", "paid_at");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_org_id_room_number_key" ON "rooms"("org_id", "room_number");

-- CreateIndex
CREATE INDEX "staff_contacts_org_id_role_type_idx" ON "staff_contacts"("org_id", "role_type");

-- CreateIndex
CREATE INDEX "tenant_profiles_org_id_status_idx" ON "tenant_profiles"("org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_user_id_org_id_key" ON "tenant_profiles"("user_id", "org_id");

-- CreateIndex
CREATE INDEX "user_org_roles_user_id_org_id_idx" ON "user_org_roles"("user_id", "org_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_org_roles_user_id_org_id_role_key" ON "user_org_roles"("user_id", "org_id", "role");

-- CreateIndex
CREATE INDEX "visitors_org_id_status_idx" ON "visitors"("org_id", "status");

-- AddForeignKey
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_platform_user_id_fkey" FOREIGN KEY ("platform_user_id") REFERENCES "platform_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_metrics" ADD CONSTRAINT "platform_metrics_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_groups" ADD CONSTRAINT "property_groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "property_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_features" ADD CONSTRAINT "org_features_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_invites" ADD CONSTRAINT "onboarding_invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_profiles" ADD CONSTRAINT "tenant_profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_assignment_history" ADD CONSTRAINT "room_assignment_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_assignment_history" ADD CONSTRAINT "room_assignment_history_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_assignment_history" ADD CONSTRAINT "room_assignment_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_passes" ADD CONSTRAINT "gate_passes_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_menus" ADD CONSTRAINT "mess_menus_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_menu_items" ADD CONSTRAINT "mess_menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "mess_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_feedback" ADD CONSTRAINT "mess_feedback_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_feedback" ADD CONSTRAINT "mess_feedback_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "mess_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dues" ADD CONSTRAINT "dues_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "due_reminder_configs" ADD CONSTRAINT "due_reminder_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_updates" ADD CONSTRAINT "complaint_updates_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_contacts" ADD CONSTRAINT "staff_contacts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
