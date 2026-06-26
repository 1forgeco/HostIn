import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";

export const handleGetWardDetails = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const parentUserId = req.user?.userId;

  try {
    // Find all parent profiles for this parent in the organization
    const parentProfiles = await prisma.parentProfile.findMany({
      where: {
        user_id: parentUserId,
        org_id: orgId,
      },
      include: {
        tenant: {
          include: {
            tenant_profiles: {
              where: {
                org_id: orgId,
                is_active: true,
              },
              include: {
                room: {
                  include: {
                    floor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (parentProfiles.length === 0) {
      return res.status(404).json({ error: "No linked tenant profiles found for this parent user" });
    }

    const wardDetailsList: any[] = [];

    for (const profile of parentProfiles) {
      const wardUser = profile.tenant;
      const tenantProfile = wardUser.tenant_profiles[0];

      if (!tenantProfile) {
        continue; // Ward has no active tenant profile in this org
      }

      // Fetch active dues for the ward
      const activeDues = await prisma.due.findMany({
        where: {
          tenant_id: wardUser.id,
          org_id: orgId,
          status: {
            in: ["unpaid", "partial", "overdue"],
          },
        },
        orderBy: {
          due_date: "asc",
        },
      });

      // Fetch active/pending gate passes
      const activeGatePasses = await prisma.gatePass.findMany({
        where: {
          tenant_id: wardUser.id,
          org_id: orgId,
          status: {
            in: ["pending", "approved"],
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Fetch active/pending visitor logs
      const visitors = await prisma.visitor.findMany({
        where: {
          tenant_id: wardUser.id,
          org_id: orgId,
          status: {
            in: ["pending", "approved"],
          },
        },
        orderBy: {
          expected_visit_time: "asc",
        },
      });

      // Retrieve roommate contacts if visibility is allowed
      let roommates: Array<{ name: string; phone: string }> = [];
      if (profile.can_see_roommate_contact && tenantProfile.room_id) {
        const roommateProfiles = await prisma.tenantProfile.findMany({
          where: {
            room_id: tenantProfile.room_id,
            org_id: orgId,
            is_active: true,
            user_id: {
              not: wardUser.id,
            },
          },
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        });

        roommates = roommateProfiles.map((rp) => ({
          name: rp.user.full_name,
          phone: rp.user.phone,
        }));
      }

      wardDetailsList.push({
        parentProfileId: profile.id,
        relation: profile.relation,
        canSeeRoommateContact: profile.can_see_roommate_contact,
        canSeeParentContact: profile.can_see_parent_contact,
        ward: {
          userId: wardUser.id,
          name: wardUser.full_name,
          email: wardUser.email,
          phone: wardUser.phone,
          admissionDate: tenantProfile.admission_date,
          status: tenantProfile.status,
          room: {
            id: tenantProfile.room.id,
            roomNumber: tenantProfile.room.room_number,
            floorName: tenantProfile.room.floor.floor_name,
            floorNumber: tenantProfile.room.floor.floor_number,
            monthlyRent: tenantProfile.room.monthly_rent,
          },
        },
        dues: activeDues,
        gatePasses: activeGatePasses,
        visitors,
        roommates,
      });
    }

    return res.status(200).json({
      wards: wardDetailsList,
    });
  } catch (error) {
    console.error("Get ward details error:", error);
    return res.status(500).json({ error: "An error occurred while fetching ward details" });
  }
};
