import WorkspaceSetup from "../../Components/Setup/WorkspaceSetup";
import { loadWorkspaceSetupData } from "../lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function WorkspaceSetupPage() {
  const data = await loadWorkspaceSetupData();
  return <WorkspaceSetup data={data} />;
}
