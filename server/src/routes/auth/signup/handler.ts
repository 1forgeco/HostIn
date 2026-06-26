import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export const handleSignup = async (req: Request, res: Response) => {
  const {
    email,
    phone,
    password,
    fullName,
    inviteToken,
    // Owner signup fields
    orgName,
    slug,
    cityState,
    totalCapacity,
    planId,
    // Tenant onboarding fields
    roomId,
    emergencyContactName,
    emergencyContactPhone,
    collegeOrCompany,
  } = req.body;

  if (!email || !phone || !password || !fullName) {
    return res.status(400).json({ error: "Missing required fields (email, phone, password, fullName)" });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email or phone number already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Start a transaction to ensure all db modifications happen atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          phone,
          password_hash: passwordHash,
          full_name: fullName,
          is_active: true,
        },
      });

      // 2. Handle Onboarding Invite Signup
      if (inviteToken) {
        const invite = await tx.onboardingInvite.findUnique({
          where: { token: inviteToken },
        });

        if (!invite) {
          throw new Error("Invalid invite token");
        }

        if (invite.status !== "pending") {
          throw new Error("Invite token has already been accepted or is inactive");
        }

        if (new Date() > invite.expires_at) {
          // Update status to expired
          await tx.onboardingInvite.update({
            where: { id: invite.id },
            data: { status: "expired" },
          });
          throw new Error("Invite token has expired");
        }

        // Accept invite
        await tx.onboardingInvite.update({
          where: { id: invite.id },
          data: { status: "accepted" },
        });

        // Create UserOrgRole
        await tx.userOrgRole.create({
          data: {
            user_id: user.id,
            org_id: invite.org_id,
            role: invite.role,
            is_active: true,
          },
        });

        // If role is tenant, create TenantProfile
        if (invite.role === "tenant") {
          if (!roomId || !emergencyContactName || !emergencyContactPhone) {
            throw new Error("Missing tenant profile details (roomId, emergencyContactName, emergencyContactPhone)");
          }

          // Check if room exists and has capacity
          const room = await tx.room.findUnique({
            where: { id: roomId },
          });

          if (!room) {
            throw new Error("Selected room does not exist");
          }

          if (room.current_occupancy >= room.capacity) {
            throw new Error("Selected room is already at full capacity");
          }

          // Create TenantProfile
          await tx.tenantProfile.create({
            data: {
              user_id: user.id,
              org_id: invite.org_id,
              room_id: roomId,
              admission_date: new Date(),
              emergency_contact_name: emergencyContactName,
              emergency_contact_phone: emergencyContactPhone,
              college_or_company: collegeOrCompany || null,
              status: "active",
            },
          });

          // Update room occupancy
          const newOccupancy = room.current_occupancy + 1;
          await tx.room.update({
            where: { id: roomId },
            data: {
              current_occupancy: newOccupancy,
              status: newOccupancy >= room.capacity ? "occupied" : "available",
            },
          });

          // Record in room assignment history
          await tx.roomAssignmentHistory.create({
            data: {
              org_id: invite.org_id,
              room_id: roomId,
              tenant_id: user.id,
              reason: "onboarding",
            },
          });
        }

        return { user, orgId: invite.org_id, role: invite.role };
      }

      // 3. Handle Owner Signup & Organization Creation
      if (orgName && slug && cityState && totalCapacity !== undefined) {
        // Find default plan (Starter Plan) if planId is not provided
        let targetPlanId = planId;
        if (!targetPlanId) {
          const starterPlan = await tx.plan.findFirst({
            where: { tier: "starter" },
          });
          if (!starterPlan) {
            throw new Error("No plans configured. Please seed plans database first.");
          }
          targetPlanId = starterPlan.id;
        }

        // Check if slug is unique
        const existingOrg = await tx.organization.findUnique({
          where: { slug },
        });

        if (existingOrg) {
          throw new Error("Organization slug already exists. Please choose a different URL identifier.");
        }

        // Create PropertyGroup
        const propertyGroup = await tx.propertyGroup.create({
          data: {
            owner_id: user.id,
            name: `${fullName}'s Property Group`,
          },
        });

        // Create Organization
        const org = await tx.organization.create({
          data: {
            name: orgName,
            slug,
            owner_name: fullName,
            city_state: cityState,
            total_capacity: totalCapacity,
            plan_id: targetPlanId,
            plan_status: "active",
            group_id: propertyGroup.id,
            is_active: true,
          },
        });

        // Create UserOrgRole for owner
        await tx.userOrgRole.create({
          data: {
            user_id: user.id,
            org_id: org.id,
            role: "owner",
            is_active: true,
          },
        });

        return { user, orgId: org.id, role: "owner" };
      }

      // 4. Standard registration (no invite token, no org details)
      return { user, orgId: null, role: null };
    });

    const { user, orgId, role } = result;

    return res.status(201).json({
      message: "User signed up successfully",
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
      },
      orgId,
      role,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(400).json({ error: error.message || "An error occurred during signup" });
  }
};
