import PlaylistLayout from "../Components/Playlist/PlaylistLayout";
import { loadPlaylistData, loadWorkspaceSetupData } from "./lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function PlaylistPage() {
  const [data, setup] = await Promise.all([loadPlaylistData(), loadWorkspaceSetupData()]);
  return <PlaylistLayout data={data} setup={setup} />;
}
