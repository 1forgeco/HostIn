import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleCreateTenant = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields (fullName, email, phone)" });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const temporaryPassword = password || `${organization.slug}@123`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });

      const user = existingUser
        ? existingUser
        : await tx.user.create({
            data: {
              email,
              phone,
              full_name: fullName,
              password_hash: passwordHash,
              is_active: true,
            },
          });

      await tx.userOrgRole.upsert({
        where: {
          user_id_org_id_role: {
            user_id: user.id,
            org_id: orgId,
            role: "tenant",
          },
        },
        update: { is_active: true },
        create: {
          user_id: user.id,
          org_id: orgId,
          role: "tenant",
          is_active: true,
        },
      });

      return user;
    });

    return res.status(201).json({
      message: "Tenant account created successfully",
      tenant: {
        userId: result.id,
        fullName: result.full_name,
        email: result.email,
        phone: result.phone,
        assignmentStatus: "unassigned",
      },
      temporaryPassword,
    });
  } catch (error) {
    console.error("Create tenant error:", error);
    return res.status(500).json({ error: "An error occurred creating tenant account" });
  }
};
