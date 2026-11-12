import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";

const previews = [
  {
    label: "Archived Layout + Current Clerk Theme: Sign In",
    note: "Uses the ClerkProvider routing/localization from z_archive/app/layout.tsx and appearance from webflow/clerk-react/clerk-theme.ts.",
    src: "../../clerk-archive-preview/sign-in/",
  },
  {
    label: "Archived Layout + Current Clerk Theme: Request Access",
    note: "Uses the archived provider configuration with the current Clerk theme and localization.",
    src: "../../clerk-archive-preview/request-access/",
  },
] as const;

export default function ClerkArchiveComparisonPage() {
  return (
    <DocsPage toc={[]} full>
      <DocsTitle>Archived Clerk Layout Comparison</DocsTitle>
      <DocsDescription>
        A separate control page combining the archived ClerkProvider layout configuration
        with the current Webflow Clerk theme.
      </DocsDescription>

      <DocsBody>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {previews.map((preview) => (
            <section
              key={preview.src}
              style={{
                border: "1px solid var(--color-fd-border)",
                borderRadius: "12px",
                overflow: "hidden",
                background: "var(--color-fd-card)",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--color-fd-border)",
                }}
              >
                <strong>{preview.label}</strong>
                <div style={{ marginTop: "4px", fontSize: "13px", opacity: 0.7 }}>
                  {preview.note}
                </div>
              </div>
              <iframe
                title={preview.label}
                src={preview.src}
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
