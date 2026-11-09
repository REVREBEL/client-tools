import type { PlaylistRow, WorkspaceColorSetting } from "../../app/lib/google-sheets";
import { normalize, statusColors } from "../playlist-utils";

const PRIORITY_COLORS: Record<string, { background: string; color: string }> = {
  HIGH: { background: "#E05047", color: "#FFFFFF" },
  MEDIUM: { background: "#FACA78", color: "#163666" },
  LOW: { background: "#B2D3DE", color: "#163666" },
};

type ColorMap = Record<string, { background?: string; color?: string }>;

function configuredColors(settings: WorkspaceColorSetting[]): ColorMap {
  return Object.fromEntries(
    settings.map((setting) => [
      normalize(setting.label).toUpperCase(),
      {
        background: setting.backgroundColor || undefined,
        color: setting.fontColor || undefined,
      },
    ]),
  );
}

function Badge({ value, type, colors }: { value: string; type: "status" | "priority"; colors: ColorMap }) {
  const label = normalize(value) || "Unspecified";
  const key = label.toUpperCase();
  const fallback = type === "status"
    ? statusColors(label)
    : PRIORITY_COLORS[key] || { background: "#FFFFFF", color: "#163666" };
  const configured = colors[key];
  const resolved = {
    background: configured?.background || fallback.background,
    color: configured?.color || fallback.color,
  };

  return (
    <span
      className={`playlist-badge playlist-badge--${type}`}
      style={{ backgroundColor: resolved.background, color: resolved.color }}
    >
      {label}
    </span>
  );
}

type PlaylistTableProps = {
  rows: PlaylistRow[];
  showPriority: boolean;
  showDependency: boolean;
  statusSettings?: WorkspaceColorSetting[];
  prioritySettings?: WorkspaceColorSetting[];
};

export default function PlaylistTable({
  rows,
  showPriority,
  showDependency,
  statusSettings = [],
  prioritySettings = [],
}: PlaylistTableProps) {
  const statusColorMap = configuredColors(statusSettings);
  const priorityColorMap = configuredColors(prioritySettings);

  return (
    <section className="playlist-table-card">
      <div className="playlist-table-card__heading">
        <div>
          <p>Project Workplan</p>
          <h2>Action Items</h2>
        </div>
        <span>Live from Google Sheets</span>
      </div>

      <div className="playlist-table-wrap">
        <table className="playlist-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Workstream</th>
              <th>Action Item</th>
              <th>Status</th>
              {showPriority && <th>Priority</th>}
              <th>Team Lead</th>
              <th>Due Date</th>
              {showDependency && <th>Dependency</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber}>
                <td className="playlist-table__sort">{row.values["ITEM SORT"] || "—"}</td>
                <td className="playlist-table__workstream">{row.values["TACTICAL ITEM"] || "—"}</td>
                <td className="playlist-table__action">{row.values["ACTION ITEM"] || "—"}</td>
                <td><Badge value={row.values.STATUS} type="status" colors={statusColorMap} /></td>
                {showPriority && <td><Badge value={row.values.PRIORITY} type="priority" colors={priorityColorMap} /></td>}
                <td>{row.values["TEAM LEAD"] || "—"}</td>
                <td className="playlist-table__date">{row.values["DUE DATE"] || "—"}</td>
                {showDependency && <td className="playlist-table__dependency">{row.values["ACTION ITEM DEPENDENCY"] || "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <div className="playlist-no-results">No playlist items match these filters.</div>}
    </section>
  );
}
