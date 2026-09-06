import Link from "next/link";

const tools = [
  {
    href: "/docs",
    number: "01",
    title: "Docs Hub",
    status: "Ready",
    description: "Audit resources, implementation guides, campaign references, blogs, and project photography.",
  },
  {
    href: "/metrics",
    number: "02",
    title: "Client Metrics",
    status: "Ready",
    description: "Live segment and channel reporting powered by the connected Google Sheets datasets.",
  },
  {
    href: "/playlist",
    number: "03",
    title: "Strategy Playlist",
    status: "Refactor in progress",
    description: "Action-item workspace backed by the existing Google Sheet and Apps Script workflow engine.",
  },
];

export default function PortalHome() {
  return (
    <main className="rr-portal-home">
      <div className="rr-portal-home__inner">
        <p className="rr-portal-eyebrow">REVREBEL Client Workspace</p>
        <h1>One door. Three working rooms.</h1>
        <p className="rr-portal-home__intro">
          Move between documentation, performance reporting, and the strategy playlist without leaving the authenticated client workspace.
        </p>

        <div className="rr-tool-grid">
          {tools.map((tool) => (
            <Link className="rr-tool-card" href={tool.href} key={tool.href}>
              <span className="rr-tool-card__number">{tool.number}</span>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
              <div className="rr-tool-card__open">
                <span className="rr-tool-card__status">{tool.status}</span>
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
