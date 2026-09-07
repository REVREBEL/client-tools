import TrackingDashboard from "../../Components/Tracking/TrackingDashboard";
import { loadPlaylistData } from "../lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const data = await loadPlaylistData();
  return <TrackingDashboard data={data} />;
}
