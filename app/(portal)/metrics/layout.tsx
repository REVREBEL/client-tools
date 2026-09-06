import "../../../portal/metrics/app/globals.css";

export default function MetricsLayout({ children }: { children: React.ReactNode }) {
  return <div data-client-tool="metrics">{children}</div>;
}
