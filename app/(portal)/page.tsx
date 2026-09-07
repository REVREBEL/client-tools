export default function PortalHome() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>REVREBEL Client Portal</h1>
      <p>Route test page for the Webflow Cloud portal mount.</p>

      <ul>
        <li>
          <a href="/portal/docs">Docs Hub</a>
        </li>
        <li>
          <a href="/portal/metrics">Client Metrics</a>
        </li>
        <li>
          <a href="/portal/playlist">Strategy Playlist</a>
        </li>
        <li>
          <a href="/onboard">Onboard</a>
        </li>
      </ul>
    </main>
  );
}
