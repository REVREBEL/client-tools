"use client";

import { useMemo, useState } from "react";
import type { PlaylistData } from "./lib/google-sheets";

function normalized(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function statusClass(status: string) {
  return `playlist-status playlist-status--${normalized(status).replace(/[^a-z0-9]+/g, "-") || "blank"}`;
}

export default function PlaylistBoard({ data }: { data: PlaylistData }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Statuses");

  const statuses = useMemo(
    () => Array.from(new Set(data.rows.map((row) => row.values.STATUS).filter(Boolean))).sort(),
    [data.rows],
  );

  const rows = useMemo(() => {
    const needle = normalized(query);
    return data.rows.filter((row) => {
      const statusMatch = status === "All Statuses" || row.values.STATUS === status;
      const haystack = normalized(
        [
          row.values["ITEM SORT"],
          row.values["TACTICAL ITEM"],
          row.values["ACTION ITEM"],
          row.values.STATUS,
          row.values["TEAM LEAD"],
          row.values["DUE DATE"],
        ].join(" "),
      );
      return statusMatch && (!needle || haystack.includes(needle));
    });
  }, [data.rows, query, status]);

  if (!data.configured) {
    return (
      <main className="playlist-page">
        <section className="playlist-empty">
          <p className="playlist-eyebrow">Strategy Playlist</p>
          <h1>Connect the Playlist Sheet</h1>
          <p>
            Add <code>PLAYLIST_SPREADSHEET_ID</code> to the Webflow Cloud environment and share that Google Sheet with the existing service-account email as a Viewer.
          </p>
          <p>The existing Apps Script project stays in place for workflow automation while the portal UI is refactored around it.</p>
        </section>
      </main>
    );
  }

  if (data.error) {
    return (
      <main className="playlist-page">
        <section className="playlist-empty playlist-empty--error">
          <p className="playlist-eyebrow">Strategy Playlist</p>
          <h1>Playlist connection error</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="playlist-page">
      <section className="playlist-hero">
        <div>
          <p className="playlist-eyebrow">Commercial Strategy Workspace</p>
          <h1>Strategy Playlist</h1>
        </div>
        <div className="playlist-hero__meta">
          <strong>{data.rows.length.toLocaleString()} action rows</strong>
          <span>{data.syncedAt ? `Synced ${new Date(data.syncedAt).toLocaleString()}` : "Live Google Sheet"}</span>
        </div>
      </section>

      <section className="playlist-toolbar" aria-label="Playlist filters">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search action items, team leads, or workstreams"
          aria-label="Search strategy playlist"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option>All Statuses</option>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
        <span>{rows.length.toLocaleString()} shown</span>
      </section>

      <section className="playlist-table-wrap">
        <table className="playlist-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Workstream</th>
              <th>Action Item</th>
              <th>Status</th>
              <th>Team Lead</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber}>
                <td className="playlist-table__sort">{row.values["ITEM SORT"] || "—"}</td>
                <td>{row.values["TACTICAL ITEM"] || "—"}</td>
                <td className="playlist-table__action">{row.values["ACTION ITEM"] || "—"}</td>
                <td><span className={statusClass(row.values.STATUS)}>{row.values.STATUS || "Unspecified"}</span></td>
                <td>{row.values["TEAM LEAD"] || "—"}</td>
                <td>{row.values["DUE DATE"] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="playlist-no-results">No playlist rows match those filters.</div>}
      </section>
    </main>
  );
}
