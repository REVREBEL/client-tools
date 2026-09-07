import PlaylistLayout from "../Components/Playlist/PlaylistLayout";
import { loadPlaylistData } from "./lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function PlaylistPage() {
  const data = await loadPlaylistData();
  return <PlaylistLayout data={data} />;
}
