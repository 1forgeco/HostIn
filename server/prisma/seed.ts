import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_SLUG = "city-complex";
const DEMO_PASSWORD = "city-complex@123";
const PLATFORM_PASSWORD = "PlatformAdminPassword123";

async function upsertUser(input: {
  email: string;
  phone: string;
  full_name: string;
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      phone: input.phone,
      full_name: input.full_name,
      password_hash: input.passwordHash,
      is_active: true,
      account_status: "active",
      force_password_change: false,
    },
    create: {
      email: input.email,
      phone: input.phone,
      full_name: input.full_name,
      password_hash: input.passwordHash,
      is_active: true,
      account_status: "active",
      force_password_change: false,
    },
  });
}

async function ensureRole(userId: string, orgId: string, role: "owner" | "warden" | "guard" | "staff" | "tenant" | "parent", accountSlug: string) {
  return prisma.userOrgRole.upsert({
    where: {
      user_id_org_id_role: {
        user_id: userId,
        org_id: orgId,
        role,
      },
    },
    update: { is_active: true, account_slug: accountSlug, is_primary: true },
    create: {
      user_id: userId,
      org_id: orgId,
      role,
      account_slug: accountSlug,
      is_primary: true,
      is_active: true,
    },
  });
}

async function main() {
  console.log("Seeding plans...");

  await prisma.plan.upsert({
    where: { name: "Starter Plan" },
    update: {
      tier: "starter",
      max_tenants: 20,
      price_monthly: 0,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: false,
        analytics: false,
      },
      is_active: true,
    },
    create: {
      name: "Starter Plan",
      tier: "starter",
      max_tenants: 20,
      price_monthly: 0,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: false,
        analytics: false,
      },
      is_active: true,
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { name: "Growth Plan" },
    update: {
      tier: "growth",
      max_tenants: 100,
      price_monthly: 49,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: true,
        analytics: true,
      },
      is_active: true,
    },
    create: {
      name: "Growth Plan",
      tier: "growth",
      max_tenants: 100,
      price_monthly: 49,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: true,
        analytics: true,
      },
      is_active: true,
    },
  });

  await prisma.plan.upsert({
    where: { name: "Pro Plan" },
    update: {
      tier: "pro",
      max_tenants: 500,
      price_monthly: 149,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: true,
        analytics: true,
        multi_property: true,
      },
      is_active: true,
    },
    create: {
      name: "Pro Plan",
      tier: "pro",
      max_tenants: 500,
      price_monthly: 149,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: true,
        analytics: true,
        multi_property: true,
      },
      is_active: true,
    },
  });

  console.log("Seeding platform admin...");
  const platformPasswordHash = await bcrypt.hash(PLATFORM_PASSWORD, 10);
  await prisma.platformUser.upsert({
    where: { email: "admin@1forge.com" },
    update: {
      password_hash: platformPasswordHash,
      full_name: "Platform Super Admin",
      is_active: true,
    },
    create: {
      email: "admin@1forge.com",
      password_hash: platformPasswordHash,
      full_name: "Platform Super Admin",
      is_active: true,
    },
  });

  console.log("Seeding City Complex demo users...");
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const owner = await upsertUser({
    email: "owner@city-complex.hostin.local",
    phone: "+919900000001",
    full_name: "City Complex Owner",
    passwordHash: demoPasswordHash,
  });
  const warden = await upsertUser({
    email: "warden@city-complex.hostin.local",
    phone: "+919900000002",
    full_name: "Anita Warden",
    passwordHash: demoPasswordHash,
  });
  const guard = await upsertUser({
    email: "security@city-complex.hostin.local",
    phone: "+919900000003",
    full_name: "Ramesh Security",
    passwordHash: demoPasswordHash,
  });
  const staff = await upsertUser({
    email: "staff@city-complex.hostin.local",
    phone: "+919900000004",
    full_name: "Joseph Staff",
    passwordHash: demoPasswordHash,
  });
  const tenant = await upsertUser({
    email: "tenant@city-complex.hostin.local",
    phone: "+919900000005",
    full_name: "Aarav Mehta",
    passwordHash: demoPasswordHash,
  });
  const secondTenant = await upsertUser({
    email: "tenant2@city-complex.hostin.local",
    phone: "+919900000006",
    full_name: "Isha Rao",
    passwordHash: demoPasswordHash,
  });
  const parent = await upsertUser({
    email: "parent@city-complex.hostin.local",
    phone: "+919900000007",
    full_name: "Meena Mehta",
    passwordHash: demoPasswordHash,
  });

  console.log("Seeding City Complex organization...");
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 15);

  const org = await prisma.organization.upsert({
    where: { slug: DEMO_SLUG },
    update: {
      name: "City Complex",
      owner_name: owner.full_name,
      address: "24 Residency Road",
      city_state: "Bengaluru, Karnataka",
      contact_email: owner.email,
      contact_phone: owner.phone,
      plan_id: growthPlan.id,
      plan_status: "trialing",
      plan_expires_at: trialEndsAt,
      total_capacity: 120,
      is_active: true,
      workspace_status: "active",
      client_type: "PG",
      branch_count: 1,
      billing_cycle: "monthly",
    },
    create: {
      name: "City Complex",
      slug: DEMO_SLUG,
      owner_name: owner.full_name,
      address: "24 Residency Road",
      city_state: "Bengaluru, Karnataka",
      contact_email: owner.email,
      contact_phone: owner.phone,
      plan_id: growthPlan.id,
      plan_status: "trialing",
      plan_expires_at: trialEndsAt,
      total_capacity: 120,
      is_active: true,
      workspace_status: "active",
      client_type: "PG",
      branch_count: 1,
      billing_cycle: "monthly",
    },
  });

  await prisma.propertyGroup.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {
      owner_id: owner.id,
      name: "City Complex Group",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      owner_id: owner.id,
      name: "City Complex Group",
    },
  });

  await Promise.all([
    ensureRole(owner.id, org.id, "owner", "city-complex-owner"),
    ensureRole(warden.id, org.id, "warden", "anita-warden"),
    ensureRole(guard.id, org.id, "guard", "ramesh-security"),
    ensureRole(staff.id, org.id, "staff", "joseph-staff"),
    ensureRole(tenant.id, org.id, "tenant", "aarav-mehta"),
    ensureRole(secondTenant.id, org.id, "tenant", "isha-rao"),
    ensureRole(parent.id, org.id, "parent", "meena-mehta"),
  ]);

  for (const role of ["owner", "warden", "guard", "staff", "tenant", "parent"] as const) {
    await prisma.roleDashboard.upsert({
      where: { org_id_role: { org_id: org.id, role } },
      update: { status: "active" },
      create: { org_id: org.id, role, status: "active" },
    });
  }

  console.log("Seeding feature toggles...");
  for (const featureKey of ["rooms", "gate_passes", "visitors", "dues", "payments", "complaints", "mess", "documents", "parents"]) {
    await prisma.orgFeature.upsert({
      where: {
        org_id_feature_key: {
          org_id: org.id,
          feature_key: featureKey,
        },
      },
      update: {
        is_enabled: true,
        updated_by: owner.id,
      },
      create: {
        org_id: org.id,
        feature_key: featureKey,
        is_enabled: true,
        updated_by: owner.id,
      },
    });
  }

  console.log("Seeding property structure...");
  const firstFloor = await prisma.floor.upsert({
    where: { org_id_floor_number: { org_id: org.id, floor_number: 1 } },
    update: { floor_name: "First Floor" },
    create: { org_id: org.id, floor_number: 1, floor_name: "First Floor" },
  });
  const secondFloor = await prisma.floor.upsert({
    where: { org_id_floor_number: { org_id: org.id, floor_number: 2 } },
    update: { floor_name: "Second Floor" },
    create: { org_id: org.id, floor_number: 2, floor_name: "Second Floor" },
  });

  const roomA101 = await prisma.room.upsert({
    where: { org_id_room_number: { org_id: org.id, room_number: "A-101" } },
    update: {
      floor_id: firstFloor.id,
      room_type: "double",
      capacity: 2,
      current_occupancy: 2,
      status: "occupied",
      monthly_rent: 12000,
      is_active: true,
    },
    create: {
      org_id: org.id,
      floor_id: firstFloor.id,
      room_number: "A-101",
      room_type: "double",
      capacity: 2,
      current_occupancy: 2,
      status: "occupied",
      monthly_rent: 12000,
    },
  });
  const roomA102 = await prisma.room.upsert({
    where: { org_id_room_number: { org_id: org.id, room_number: "A-102" } },
    update: {
      floor_id: firstFloor.id,
      room_type: "triple",
      capacity: 3,
      current_occupancy: 1,
      status: "available",
      monthly_rent: 10000,
      is_active: true,
    },
    create: {
      org_id: org.id,
      floor_id: firstFloor.id,
      room_number: "A-102",
      room_type: "triple",
      capacity: 3,
      current_occupancy: 1,
      status: "available",
      monthly_rent: 10000,
    },
  });
  await prisma.room.upsert({
    where: { org_id_room_number: { org_id: org.id, room_number: "B-204" } },
    update: {
      floor_id: secondFloor.id,
      room_type: "single",
      capacity: 1,
      current_occupancy: 0,
      status: "maintenance",
      monthly_rent: 15000,
      is_active: true,
    },
    create: {
      org_id: org.id,
      floor_id: secondFloor.id,
      room_number: "B-204",
      room_type: "single",
      capacity: 1,
      current_occupancy: 0,
      status: "maintenance",
      monthly_rent: 15000,
    },
  });

  await prisma.tenantProfile.upsert({
    where: { user_id_org_id: { user_id: tenant.id, org_id: org.id } },
    update: {
      room_id: roomA101.id,
      status: "active",
      is_active: true,
    },
    create: {
      user_id: tenant.id,
      org_id: org.id,
      room_id: roomA101.id,
      admission_date: new Date("2026-06-01"),
      emergency_contact_name: parent.full_name,
      emergency_contact_phone: parent.phone,
      college_or_company: "City Engineering College",
      status: "active",
      is_active: true,
    },
  });
  await prisma.tenantProfile.upsert({
    where: { user_id_org_id: { user_id: secondTenant.id, org_id: org.id } },
    update: {
      room_id: roomA102.id,
      status: "active",
      is_active: true,
    },
    create: {
      user_id: secondTenant.id,
      org_id: org.id,
      room_id: roomA102.id,
      admission_date: new Date("2026-06-10"),
      emergency_contact_name: "Ravi Rao",
      emergency_contact_phone: "+919900000008",
      college_or_company: "Design Institute",
      status: "active",
      is_active: true,
    },
  });
  await prisma.parentProfile.upsert({
    where: {
      user_id_tenant_id_org_id: {
        user_id: parent.id,
        tenant_id: tenant.id,
        org_id: org.id,
      },
    },
    update: {
      relation: "mother",
      can_see_parent_contact: true,
      can_see_roommate_contact: false,
    },
    create: {
      user_id: parent.id,
      tenant_id: tenant.id,
      org_id: org.id,
      relation: "mother",
      can_see_parent_contact: true,
      can_see_roommate_contact: false,
    },
  });

  const existingHistory = await prisma.roomAssignmentHistory.findFirst({
    where: { org_id: org.id, room_id: roomA101.id, tenant_id: tenant.id },
  });
  if (!existingHistory) {
    await prisma.roomAssignmentHistory.create({
      data: { org_id: org.id, room_id: roomA101.id, tenant_id: tenant.id },
    });
  }

  console.log("Seeding operations data...");
  const due = await prisma.due.findFirst({
    where: {
      org_id: org.id,
      tenant_id: tenant.id,
      due_type: "rent",
      description: "June rent demo due",
    },
  });
  const rentDue =
    due ??
    (await prisma.due.create({
      data: {
        org_id: org.id,
        tenant_id: tenant.id,
        due_type: "rent",
        amount: 12000,
        amount_paid: 0,
        description: "June rent demo due",
        due_date: new Date("2026-06-30"),
        billing_month: new Date("2026-06-01"),
        status: "unpaid",
        created_by: owner.id,
      },
    }));

  const existingPayment = await prisma.payment.findFirst({
    where: {
      org_id: org.id,
      tenant_id: secondTenant.id,
      status: "successful",
      amount: 20000,
    },
  });
  if (!existingPayment) {
    const depositDue = await prisma.due.create({
      data: {
        org_id: org.id,
        tenant_id: secondTenant.id,
        due_type: "security_deposit",
        amount: 20000,
        amount_paid: 20000,
        description: "Security deposit demo due",
        due_date: new Date("2026-06-15"),
        billing_month: new Date("2026-06-01"),
        status: "paid",
        created_by: owner.id,
      },
    });
    await prisma.payment.create({
      data: {
        org_id: org.id,
        tenant_id: secondTenant.id,
        due_id: depositDue.id,
        amount: 20000,
        payment_method: "upi",
        gateway: "manual",
        status: "successful",
        paid_by: secondTenant.id,
        paid_at: new Date("2026-06-14T10:00:00.000Z"),
      },
    });
  }

  if (!(await prisma.gatePass.findFirst({ where: { qr_code: "CITY-COMPLEX-GP-001" } }))) {
    await prisma.gatePass.create({
      data: {
        org_id: org.id,
        tenant_id: tenant.id,
        purpose: "Home visit",
        destination: "Indiranagar",
        expected_out_time: new Date("2026-06-26T11:30:00.000Z"),
        expected_return_time: new Date("2026-06-26T16:00:00.000Z"),
        status: "approved",
        approved_by: warden.id,
        qr_code: "CITY-COMPLEX-GP-001",
      },
    });
  }

  if (!(await prisma.visitor.findFirst({ where: { org_id: org.id, visitor_phone: "+919911111111" } }))) {
    await prisma.visitor.create({
      data: {
        org_id: org.id,
        tenant_id: tenant.id,
        visitor_name: "Priya Shah",
        visitor_phone: "+919911111111",
        visitor_relation: "friend",
        purpose: "Weekend visit",
        expected_visit_time: new Date("2026-06-26T12:30:00.000Z"),
        status: "approved",
        approved_by: tenant.id,
      },
    });
  }

  const complaint = await prisma.complaint.findFirst({
    where: { org_id: org.id, tenant_id: tenant.id, title: "Water leakage in bathroom" },
  });
  if (!complaint) {
    const createdComplaint = await prisma.complaint.create({
      data: {
        org_id: org.id,
        tenant_id: tenant.id,
        category: "maintenance",
        title: "Water leakage in bathroom",
        description: "Tap has been leaking since morning.",
        photo_urls: [],
        status: "in_progress",
        priority: "high",
        assigned_to: staff.id,
      },
    });
    await prisma.complaintUpdate.create({
      data: {
        complaint_id: createdComplaint.id,
        updated_by: warden.id,
        status: "in_progress",
        note: "Assigned to maintenance staff.",
      },
    });
  }

  if (!(await prisma.announcement.findFirst({ where: { org_id: org.id, title: "Water shutdown notice" } }))) {
    await prisma.announcement.create({
      data: {
        org_id: org.id,
        created_by: warden.id,
        title: "Water shutdown notice",
        body: "Water supply will be paused from 2 PM to 4 PM for maintenance.",
        target_type: "all",
        send_push: true,
        send_whatsapp: false,
      },
    });
  }

  const weekStart = new Date("2026-06-22");
  const messMenu = await prisma.messMenu.upsert({
    where: { org_id_week_start_date: { org_id: org.id, week_start_date: weekStart } },
    update: {
      created_by: warden.id,
      is_published: true,
    },
    create: {
      org_id: org.id,
      week_start_date: weekStart,
      created_by: warden.id,
      is_published: true,
    },
  });
  await prisma.messMenuItem.upsert({
    where: {
      menu_id_day_of_week_meal_type: {
        menu_id: messMenu.id,
        day_of_week: "mon",
        meal_type: "lunch",
      },
    },
    update: { items: ["Paneer rice", "Curd", "Salad"] },
    create: {
      menu_id: messMenu.id,
      day_of_week: "mon",
      meal_type: "lunch",
      items: ["Paneer rice", "Curd", "Salad"],
    },
  });

  if (!(await prisma.document.findFirst({ where: { org_id: org.id, tenant_id: tenant.id, doc_type: "aadhaar" } }))) {
    await prisma.document.create({
      data: {
        org_id: org.id,
        tenant_id: tenant.id,
        doc_type: "aadhaar",
        file_url: "https://example.com/demo/aadhaar.pdf",
        file_name: "aarav-aadhaar.pdf",
        uploaded_by: tenant.id,
        is_verified: false,
      },
    });
  }

  for (const contact of [
    { name: "Ramesh Security", phone: guard.phone, role_type: "guard" as const, user_id: guard.id, is_emergency: true },
    { name: "Anita Warden", phone: warden.phone, role_type: "warden" as const, user_id: warden.id, is_emergency: true },
    { name: "Joseph Electrician", phone: "+919900000009", role_type: "electrician" as const, user_id: null, is_emergency: false },
  ]) {
    const exists = await prisma.staffContact.findFirst({
      where: { org_id: org.id, phone: contact.phone },
    });
    if (!exists) {
      await prisma.staffContact.create({
        data: {
          org_id: org.id,
          user_id: contact.user_id,
          name: contact.name,
          phone: contact.phone,
          role_type: contact.role_type,
          is_emergency: contact.is_emergency,
          is_active: true,
        },
      });
    }
  }

  await prisma.dueReminderConfig.upsert({
    where: { org_id: org.id },
    update: {
      reminder_days: [1, 5, 10],
      send_whatsapp: true,
      send_push: true,
      send_sms: false,
      send_to_parent: true,
      is_active: true,
    },
    create: {
      org_id: org.id,
      reminder_days: [1, 5, 10],
      send_whatsapp: true,
      send_push: true,
      send_sms: false,
      send_to_parent: true,
      is_active: true,
    },
  });

  if (!(await prisma.notification.findFirst({ where: { org_id: org.id, user_id: tenant.id, title: "Rent due" } }))) {
    await prisma.notification.create({
      data: {
        org_id: org.id,
        user_id: tenant.id,
        title: "Rent due",
        body: "June rent is due by 30 June.",
        type: "payment",
        reference_id: rentDue.id,
        reference_type: "due",
        channel: "in_app",
        status: "sent",
      },
    });
  }

  if (!(await prisma.auditLog.findFirst({ where: { org_id: org.id, action: "demo_seeded" } }))) {
    await prisma.auditLog.create({
      data: {
        org_id: org.id,
        user_id: owner.id,
        action: "demo_seeded",
        entity_type: "organization",
        entity_id: org.id,
        new_value: { slug: DEMO_SLUG, plan: growthPlan.name },
        ip_address: "127.0.0.1",
      },
    });
  }

  await prisma.platformMetric.upsert({
    where: {
      org_id_metric_date: {
        org_id: org.id,
        metric_date: new Date("2026-06-26"),
      },
    },
    update: {
      active_tenants: 2,
      vacant_seats: 117,
      revenue_collected: 20000,
      revenue_outstanding: 12000,
    },
    create: {
      org_id: org.id,
      metric_date: new Date("2026-06-26"),
      active_tenants: 2,
      vacant_seats: 117,
      revenue_collected: 20000,
      revenue_outstanding: 12000,
    },
  });

  console.log("\nDemo seed complete.");
  console.log("Workspace slug: city-complex");
  console.log(`Demo password: ${DEMO_PASSWORD}`);
  console.log("Owner:    owner@city-complex.hostin.local");
  console.log("Warden:   warden@city-complex.hostin.local");
  console.log("Security: security@city-complex.hostin.local");
  console.log("Tenant:   tenant@city-complex.hostin.local");
  console.log("Parent:   parent@city-complex.hostin.local");
  console.log(`Platform: admin@1forge.com / ${PLATFORM_PASSWORD}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
