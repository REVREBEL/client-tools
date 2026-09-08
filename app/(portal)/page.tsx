import Link from "next/link";

export default function PortalHome() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>REVREBEL Client Portal</h1>
      <p>Route test page for the Webflow Cloud portal mount.</p>

      <ul>
        <li>
          <Link href="/docs">Docs Hub</Link>
        </li>
        <li>
          <Link href="/metrics">Client Metrics</Link>
        </li>
        <li>
          <Link href="/playlist">Strategy Playlist</Link>
        </li>
        <li>
          <a href="/onboard">Onboard</a>
        </li>
      </ul>
    </main>
  );
}
