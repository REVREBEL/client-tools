import type { PlaylistData, PlaylistRow, WorkspaceSetupData } from "../../app/lib/google-sheets";
import PlaylistHeader from "../Playlist/PlaylistHeader";
import { groupCounts, isComplete, isOverdue, normalize, parseDueDate, statusColors } from "../playlist-utils";

function completionPercent(rows: PlaylistRow[]) {
  if (!rows.length) return 0;
  return Math.round((rows.filter(isComplete).length / rows.length) * 100);
}

function upcomingRows(rows: PlaylistRow[]) {
  return rows
    .filter((row) => !isComplete(row) && parseDueDate(row.values["DUE DATE"]))
    .sort((a, b) => {
      const left = parseDueDate(a.values["DUE DATE"])?.getTime() || Number.MAX_SAFE_INTEGER;
      const right = parseDueDate(b.values["DUE DATE"])?.getTime() || Number.MAX_SAFE_INTEGER;
      return left - right;
    })
    .slice(0, 8);
}

export default function TrackingDashboard({ data, setup }: { data: PlaylistData; setup?: WorkspaceSetupData }) {
  if (!data.configured || data.error) {
    return (
      <main className="playlist-page">
        <section className={`playlist-empty${data.error ? " playlist-empty--error" : ""}`}>
          <p className="playlist-eyebrow">Tracking Dashboard</p>
          <h1>{data.error ? "Playlist connection error" : "Connect the Playlist Sheet"}</h1>
          <p>{data.error || "The tracking dashboard uses the same Action Items data source as the Strategy Playlist."}</p>
        </section>
      </main>
    );
  }

  const configuredStatusColors = Object.fromEntries(
    (setup?.statuses || []).map((setting) => [
      normalize(setting.label).toUpperCase(),
      {
        background: setting.backgroundColor || "#FFFFFF",
        color: setting.fontColor || "#163666",
      },
    ]),
  );
  const resolvedStatusColors = (label: string) => configuredStatusColors[normalize(label).toUpperCase()] || statusColors(label);

  const completed = data.rows.filter(isComplete).length;
  const overdue = data.rows.filter((row) => isOverdue(row)).length;
  const active = data.rows.length - completed;
  const percent = completionPercent(data.rows);
  const statuses = groupCounts(data.rows, "STATUS");
  const teamLeads = groupCounts(data.rows.filter((row) => !isComplete(row)), "TEAM LEAD").slice(0, 8);
  const workstreams = groupCounts(data.rows.filter((row) => !isComplete(row)), "TACTICAL ITEM").slice(0, 8);
  const upcoming = upcomingRows(data.rows);

  return (
    <main className="playlist-page">
      <div className="playlist-shell">
        <PlaylistHeader
          title="Tracking Dashboard"
          eyebrow="Project Progress & Accountability"
          syncedAt={data.syncedAt}
          rowCount={data.rows.length}
          active="tracking"
        />

        <section className="tracking-kpis" aria-label="Playlist progress summary">
          <article className="tracking-kpi tracking-kpi--primary">
            <span>Completion</span>
            <strong>{percent}%</strong>
            <small>{completed.toLocaleString()} of {data.rows.length.toLocaleString()} complete</small>
          </article>
          <article className="tracking-kpi">
            <span>Open Items</span>
            <strong>{active.toLocaleString()}</strong>
            <small>Remaining across all workstreams</small>
          </article>
          <article className="tracking-kpi tracking-kpi--alert">
            <span>Past Due</span>
            <strong>{overdue.toLocaleString()}</strong>
            <small>Open items beyond their due date</small>
          </article>
          <article className="tracking-kpi">
            <span>Workstreams</span>
            <strong>{groupCounts(data.rows, "TACTICAL ITEM").filter((item) => item.label !== "Unspecified").length}</strong>
            <small>Distinct tactical workstreams</small>
          </article>
        </section>

        <section className="tracking-grid">
          <article className="tracking-panel tracking-panel--status">
            <header>
              <p>Status Mix</p>
              <h2>Where the Work Stands</h2>
            </header>
            <div className="tracking-status-list">
              {statuses.map((item) => {
                const colors = resolvedStatusColors(item.label);
                const share = data.rows.length ? Math.round((item.count / data.rows.length) * 100) : 0;
                return (
                  <div className="tracking-status-row" key={item.label}>
                    <span className="tracking-status-swatch" style={{ backgroundColor: colors.background }} aria-hidden="true" />
                    <strong>{item.label}</strong>
                    <div className="tracking-status-bar" aria-hidden="true">
                      <span style={{ width: `${share}%`, backgroundColor: colors.background }} />
                    </div>
                    <span>{item.count}</span>
                    <small>{share}%</small>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="tracking-panel">
            <header>
              <p>Ownership</p>
              <h2>Open Items by Team Lead</h2>
            </header>
            <div className="tracking-ranked-list">
              {teamLeads.map((item, index) => (
                <div key={item.label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.label}</strong>
                  <b>{item.count}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="tracking-panel">
            <header>
              <p>Workstream Load</p>
              <h2>Open Items by Workstream</h2>
            </header>
            <div className="tracking-ranked-list">
              {workstreams.map((item, index) => (
                <div key={item.label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.label}</strong>
                  <b>{item.count}</b>
                </div>
              ))}
            </div>
          </article>

          <article className="tracking-panel tracking-panel--wide">
            <header>
              <p>Due Date Watch</p>
              <h2>Next Up</h2>
            </header>
            <div className="tracking-due-table-wrap">
              <table className="tracking-due-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Action Item</th>
                    <th>Team Lead</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((row) => (
                    <tr key={row.rowNumber} data-overdue={isOverdue(row) ? "true" : "false"}>
                      <td>{row.values["ITEM SORT"] || "—"}</td>
                      <td>{normalize(row.values["ACTION ITEM"]) || "—"}</td>
                      <td>{normalize(row.values["TEAM LEAD"]) || "—"}</td>
                      <td>{normalize(row.values.STATUS) || "Unspecified"}</td>
                      <td>{normalize(row.values["DUE DATE"]) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!upcoming.length && <div className="playlist-no-results">No open items have due dates.</div>}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
