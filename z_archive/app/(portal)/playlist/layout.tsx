import "../../../portal/playlist/app/globals.css";
import "../../../portal/playlist/app/dashboard.css";

export default function PlaylistLayout({ children }: { children: React.ReactNode }) {
  return <div data-client-tool="playlist">{children}</div>;
}
