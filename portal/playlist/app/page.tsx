import PlaylistBoard from "./playlist-board";
import { loadPlaylistData } from "./lib/google-sheets";

export const dynamic = "force-dynamic";

export default async function PlaylistPage() {
  const data = await loadPlaylistData();
  return <PlaylistBoard data={data} />;
}
