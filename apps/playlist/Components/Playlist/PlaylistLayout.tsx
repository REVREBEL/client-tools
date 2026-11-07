"use client";

import { useMemo, useState } from "react";
import type { PlaylistData, WorkspaceSetupData } from "../../app/lib/google-sheets";
import { normalize } from "../playlist-utils";
import PlaylistFilters from "./PlaylistFilters";
import PlaylistHeader from "./PlaylistHeader";
import PlaylistTable from "./PlaylistTable";

function ErrorState({ data }: { data: PlaylistData }) {
  if (!data.configured) {
    return (
      <main className="playlist-page">
        <section className="playlist-empty">
          <p className="playlist-eyebrow">Strategy Playlist</p>
          <h1>Connect the Playlist Sheet</h1>
          <p>
            Add <code>PLAYLIST_SPREADSHEET_ID</code> to the Webflow Cloud environment and share the Google Sheet with the existing service-account email as a Viewer.
          </p>
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

  return null;
}

export default function PlaylistLayout({ data, setup }: { data: PlaylistData; setup?: WorkspaceSetupData }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [teamLead, setTeamLead] = useState("");

  const statuses = useMemo(
    () => Array.from(new Set(data.rows.map((row) => normalize(row.values.STATUS)).filter(Boolean))).sort(),
    [data.rows],
  );
  const teamLeads = useMemo(
    () => Array.from(new Set(data.rows.map((row) => normalize(row.values["TEAM LEAD"])).filter(Boolean))).sort(),
    [data.rows],
  );

  const rows = useMemo(() => {
    const needle = normalize(query).toLowerCase();
    return data.rows.filter((row) => {
      const statusMatch = !status || normalize(row.values.STATUS) === status;
      const leadMatch = !teamLead || normalize(row.values["TEAM LEAD"]) === teamLead;
      const haystack = [
        row.values["ITEM SORT"],
        row.values["TACTICAL ITEM"],
        row.values["ACTION ITEM"],
        row.values.STATUS,
        row.values.PRIORITY,
        row.values["TEAM LEAD"],
        row.values["DUE DATE"],
        row.values["ACTION ITEM DEPENDENCY"],
      ]
        .map(normalize)
        .join(" ")
        .toLowerCase();
      return statusMatch && leadMatch && (!needle || haystack.includes(needle));
    });
  }, [data.rows, query, status, teamLead]);

  const errorState = <ErrorState data={data} />;
  if (!data.configured || data.error) return errorState;

  return (
    <main className="playlist-page">
      <div className="playlist-shell">
        <PlaylistHeader
          title="Strategy Playlist"
          eyebrow="Revenue Strategy Action Plan"
          syncedAt={data.syncedAt}
          rowCount={data.rows.length}
          active="dashboard"
        />

        <PlaylistFilters
          query={query}
          status={status}
          teamLead={teamLead}
          statuses={statuses}
          teamLeads={teamLeads}
          shown={rows.length}
          total={data.rows.length}
          onQueryChange={setQuery}
          onStatusChange={setStatus}
          onTeamLeadChange={setTeamLead}
        />

        <PlaylistTable
          rows={rows}
          showPriority={data.headers.includes("PRIORITY")}
          showDependency={data.headers.includes("ACTION ITEM DEPENDENCY")}
          statusSettings={setup?.statuses || []}
          prioritySettings={setup?.priorities || []}
        />
      </div>
    </main>
  );
}
