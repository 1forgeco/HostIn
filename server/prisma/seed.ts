import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding plans...");

  const plans = [
    {
      name: "Starter Plan",
      tier: "starter" as const,
      max_tenants: 20,
      price_monthly: 0.0,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: false,
        analytics: false,
      },
    },
    {
      name: "Growth Plan",
      tier: "growth" as const,
      max_tenants: 100,
      price_monthly: 49.0,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: true,
        analytics: true,
      },
    },
    {
      name: "Pro Plan",
      tier: "pro" as const,
      max_tenants: 500,
      price_monthly: 149.0,
      features: {
        gate_pass: true,
        visitor_log: true,
        complaints: true,
        mess_menu: true,
        analytics: true,
        multi_property: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: {
        name: plan.name,
        tier: plan.tier,
        max_tenants: plan.max_tenants,
        price_monthly: plan.price_monthly,
        features: plan.features,
        is_active: true,
      },
    });
  }
  console.log("Plans seeded successfully!");

  console.log("Seeding platform user...");
  const adminPasswordHash = await bcrypt.hash("PlatformAdminPassword123", 10);
  await prisma.platformUser.upsert({
    where: { email: "admin@1forge.com" },
    update: {},
    create: {
      email: "admin@1forge.com",
      password_hash: adminPasswordHash,
      full_name: "Platform Super Admin",
      is_active: true,
    },
  });
  console.log("Platform user seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
