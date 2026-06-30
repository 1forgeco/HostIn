import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyTenantCircle } from "../../../lib/notifications";

export const handleVerifyDocument = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const verifiedByUserId = req.user?.userId;
  const documentId = req.params.id as string;
  const { isVerified } = req.body;

  // Default to true if isVerified isn't explicitly provided
  const targetVerificationStatus = isVerified === undefined ? true : !!isVerified;

  try {
    // Verify document exists and belongs to the current org
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        org_id: orgId,
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update document verification fields
    const updatedDocument = await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        is_verified: targetVerificationStatus,
        verified_by: targetVerificationStatus ? (verifiedByUserId as string) : null,
        verified_at: targetVerificationStatus ? new Date() : null,
      },
    });
    await notifyTenantCircle(prisma, document.tenant_id, { orgId, title: targetVerificationStatus ? "Document verified" : "Document needs review", body: document.file_name, type: "other", referenceId: document.id, referenceType: "document" }, verifiedByUserId);

    return res.status(200).json({
      message: targetVerificationStatus ? "Document verified successfully" : "Document verification removed",
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Verify document error:", error);
    return res.status(500).json({ error: "An error occurred while verifying the document" });
  }
};
