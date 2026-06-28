import { WorkspaceApp } from "../../components/workspace-app";
import { notFound } from "next/navigation";

const supportedRoles = new Set(["owner", "warden", "guard", "security", "staff", "tenant", "parent", "platform"]);

export default async function WorkspaceRolePage({
  params,
}: {
  params: Promise<{ workspace: string; role: string }>;
}) {
  const { workspace, role } = await params;

  if (!workspace || !supportedRoles.has(role)) notFound();

  return <WorkspaceApp workspace={workspace} role={role} />;
}
