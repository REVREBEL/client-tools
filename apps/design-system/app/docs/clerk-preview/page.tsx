import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";

const surfaces = [
  ["Sign In", "sign-in", "Unauthenticated entry surface"],
  ["Sign Up", "sign-up", "Client account sign-up surface"],
  ["Request Access", "waitlist", "Client access request surface"],
  ["OAuth Consent", "oauth-consent", "Requires signed-in OAuth consent state"],
  ["Choose an Organization", "choose-organization", "Requires active Clerk task state"],
  ["Reset Password", "reset-password", "Requires reset-password task state"],
  ["Setup MFA", "setup-mfa", "Requires MFA setup task state"],
  ["User Profile", "user-profile", "Requires signed-in user state"],
] as const;

export default function ClerkPreviewPage() {
  return (
    <DocsPage toc={[]} full>
      <DocsTitle>Clerk Component Runtime Preview</DocsTitle>
      <DocsDescription>
        The exact REVREBEL Clerk source used by the Webflow component library,
        rendered outside Webflow. Each surface runs in its own isolated frame.
      </DocsDescription>

      <DocsBody>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(560px, 100%), 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {surfaces.map(([label, slug, note]) => (
            <section
              key={slug}
              style={{
                border: "1px solid var(--color-fd-border)",
                borderRadius: "12px",
                overflow: "hidden",
                background: "var(--color-fd-card)",
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-fd-border)" }}>
                <strong>{label}</strong>
                <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.7 }}>{note}</div>
              </div>
              <iframe
                title={label}
                src={`../../clerk-preview/${slug}/`}
                style={{
                  width: "100%",
                  height: "760px",
                  display: "block",
                  border: 0,
                  background: "#ffffff",
                }}
              />
            </section>
          ))}
        </div>
      </DocsBody>
    </DocsPage>
  );
}
