import "../../../docs/app/globals.css";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <div data-client-tool="docs">{children}</div>;
}
