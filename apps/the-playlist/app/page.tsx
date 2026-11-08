import PlaylistDashboard from "../Components/Dashboard/PlaylistDashboard";
import { loadPlaylistData, loadWorkspaceSetupData } from "./lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function PlaylistPage() {
  const [data, setup] = await Promise.all([loadPlaylistData(), loadWorkspaceSetupData()]);
  return <PlaylistDashboard data={data} setup={setup} />;
}
