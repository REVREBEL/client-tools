import "../../../apps/playlist/app/globals.css";
import "../../../apps/playlist/app/dashboard.css";

export default function PlaylistLayout({ children }: { children: React.ReactNode }) {
  return <div data-client-tool="playlist">{children}</div>;
}
