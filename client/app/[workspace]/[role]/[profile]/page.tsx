import { WorkspaceApp } from "../../../components/workspace-app";
import { notFound } from "next/navigation";

const supportedRoles = new Set(["owner", "warden", "guard", "security", "staff", "tenant", "parent", "platform"]);

export default async function ProfileWorkspacePage({ params }: { params: Promise<{ workspace: string; role: string; profile: string }> }) {
  const { workspace, role, profile } = await params;
  if (!workspace || !profile || !supportedRoles.has(role)) notFound();
  return <WorkspaceApp workspace={workspace} role={role} />;
}
