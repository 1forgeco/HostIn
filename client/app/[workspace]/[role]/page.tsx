import { WorkspaceApp } from "../../components/workspace-app";

export default async function WorkspaceRolePage({
  params,
}: {
  params: Promise<{ workspace: string; role: string }>;
}) {
  const { workspace, role } = await params;

  return <WorkspaceApp workspace={workspace} role={role} />;
}
