import "../../../client-playlist/app/globals.css";

export default function PlaylistLayout({ children }: { children: React.ReactNode }) {
  return <div data-client-tool="playlist">{children}</div>;
}
