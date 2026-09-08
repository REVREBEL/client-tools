import type { DashboardColorMap, DashboardTask } from "./dashboard-types";
import { normalizedKey } from "./dashboard-utils";

type MetricsRibbonProps = {
  tasks: DashboardTask[];
  colors: DashboardColorMap;
};

export default function MetricsRibbon({ tasks, colors }: MetricsRibbonProps) {
  const counts = tasks.reduce<Record<string, number>>((result, task) => {
    const key = normalizedKey(task.status);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});

  const statusKeys = Object.keys(colors).filter((status) => {
    const count = counts[status] || 0;
    return count > 0 || status === "COMPLETED" || status === "IN-PROGRESS";
  });

  return (
    <section className="playlist-metrics-ribbon" aria-label="Action item status summary">
      <div className="playlist-metrics-ribbon__total">
        <strong>{tasks.length.toLocaleString()}</strong>
        <span>Action Items</span>
      </div>
      <div className="playlist-metrics-ribbon__divider" aria-hidden="true" />
      <div className="playlist-metrics-ribbon__statuses">
        {statusKeys.map((status) => {
          const color = colors[status];
          return (
            <div
              className="playlist-metrics-status"
              key={status}
              style={{ backgroundColor: color.background, color: color.color }}
            >
              <strong>{(counts[status] || 0).toLocaleString()}</strong>
              <span>{status}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
