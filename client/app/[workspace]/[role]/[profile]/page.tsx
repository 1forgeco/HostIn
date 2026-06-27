import { WorkspaceApp } from "../../../components/workspace-app";

export default async function ProfileWorkspacePage({ params }: { params: Promise<{ workspace: string; role: string; profile: string }> }) {
  const { workspace, role } = await params;
  return <WorkspaceApp workspace={workspace} role={role} />;
}
