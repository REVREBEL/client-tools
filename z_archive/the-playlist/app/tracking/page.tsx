import TrackingDashboard from "../../Components/Tracking/TrackingDashboard";
import { loadPlaylistData, loadWorkspaceSetupData } from "../lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const [data, setup] = await Promise.all([loadPlaylistData(), loadWorkspaceSetupData()]);
  return <TrackingDashboard data={data} setup={setup} />;
}
