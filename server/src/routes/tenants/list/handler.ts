import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { TenantStatus } from "../../../../generated/prisma/client";
import { getPagination, paginationMeta } from "../../../lib/pagination";

export const handleListTenants = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { status } = req.query;
  const { limit, page, skip } = getPagination(req.query, 250, 500);

  const whereClause: any = {
    org_id: orgId,
    is_active: true,
  };

  if (status) {
    whereClause.status = status as TenantStatus;
  }

  try {
    const tenantProfiles = await prisma.tenantProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            profile_photo_url: true,
          },
        },
        room: {
          select: {
            id: true,
            room_number: true,
            room_type: true,
            monthly_rent: true,
          },
        },
      },
      orderBy: {
        admission_date: "desc",
      },
      take: limit,
      skip,
    });

    const assignedUserIds = tenantProfiles.map((tenant) => tenant.user_id);
    const unassignedTenantRoles = await prisma.userOrgRole.findMany({
      where: {
        org_id: orgId,
        role: "tenant",
        is_active: true,
        ...(assignedUserIds.length ? { user_id: { notIn: assignedUserIds } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            profile_photo_url: true,
            created_at: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: limit,
    });

    const formattedTenants = tenantProfiles.map((t) => ({
      tenantProfileId: t.id,
      userId: t.user_id,
      fullName: t.user.full_name,
      email: t.user.email,
      phone: t.user.phone,
      profilePhotoUrl: t.user.profile_photo_url,
      room: {
        id: t.room.id,
        roomNumber: t.room.room_number,
        roomType: t.room.room_type,
        monthlyRent: t.room.monthly_rent,
      },
      admissionDate: t.admission_date,
      expectedExitDate: t.expected_exit_date,
      emergencyContactName: t.emergency_contact_name,
      emergencyContactPhone: t.emergency_contact_phone,
      collegeOrCompany: t.college_or_company,
      status: t.status,
      assignmentStatus: "assigned",
    }));

    const unassignedTenants = unassignedTenantRoles.map((role) => ({
      tenantProfileId: null,
      userId: role.user_id,
      fullName: role.user.full_name,
      email: role.user.email,
      phone: role.user.phone,
      profilePhotoUrl: role.user.profile_photo_url,
      room: null,
      admissionDate: role.user.created_at,
      expectedExitDate: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      collegeOrCompany: null,
      status: "onboarding",
      assignmentStatus: "unassigned",
    }));

    const tenants = [...unassignedTenants, ...formattedTenants].slice(0, limit);
    if (req.userOrgRole === "guard") {
      return res.status(200).json({ tenants: tenants.map((tenant) => ({ userId: tenant.userId, fullName: tenant.fullName, room: tenant.room ? { roomNumber: tenant.room.roomNumber } : null })), pagination: paginationMeta(page, limit, tenants.length) });
    }
    return res.status(200).json({ tenants, pagination: paginationMeta(page, limit, tenants.length) });
  } catch (error) {
    console.error("List tenants error:", error);
    return res.status(500).json({ error: "An error occurred fetching tenants list" });
  }
};
