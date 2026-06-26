import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { TenantStatus } from "../../../../generated/prisma/client";

export const handleListTenants = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { status } = req.query;

  const whereClause: any = {
    org_id: orgId,
    is_active: true,
  };

  if (status) {
    whereClause.status = status as TenantStatus;
  }

  try {
    const tenants = await prisma.tenantProfile.findMany({
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
    });

    const formattedTenants = tenants.map((t) => ({
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
    }));

    return res.status(200).json({ tenants: formattedTenants });
  } catch (error) {
    console.error("List tenants error:", error);
    return res.status(500).json({ error: "An error occurred fetching tenants list" });
  }
};
