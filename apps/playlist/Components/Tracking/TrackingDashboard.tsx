"use client";

import { useMemo, useState } from "react";
import type { PlaylistData, WorkspaceSetupData } from "../../app/lib/google-sheets";
import MetricsRibbon from "../Dashboard/MetricsRibbon";
import { getDependencyStatus, isComplete, normalizedKey, parseDashboardTasks, statusColorMap } from "../Dashboard/dashboard-utils";
import PlaylistHeader from "../Playlist/PlaylistHeader";

export default function TrackingDashboard({ data, setup }: { data: PlaylistData; setup?: WorkspaceSetupData }) {
  const [subtab, setSubtab] = useState<"overview" | "team">("overview");
  const tasks = useMemo(() => parseDashboardTasks(data), [data]);
  const colors = useMemo(() => statusColorMap(setup), [setup]);

  if (!data.configured || data.error) {
    return (
      <main className="playlist-page">
        <section className={`playlist-empty${data.error ? " playlist-empty--error" : ""}`}>
          <p className="playlist-eyebrow">Tracking Dashboard</p>
          <h1>{data.error ? "Playlist connection error" : "Connect the Playlist Sheet"}</h1>
          <p>{data.error || "The tracking dashboard uses the same Action Items data source as The Playlist."}</p>
        </section>
      </main>
    );
  }

  const dependencies = tasks.filter((task) => task.dependency);
  const dependenciesMet = dependencies.filter((task) => getDependencyStatus(tasks, task.dependency) === "COMPLETED").length;
  const dependencyPercent = dependencies.length ? Math.round((dependenciesMet / dependencies.length) * 100) : 100;
  const waitingOnHold = tasks.filter((task) => ["WAITING", "ON-HOLD"].includes(normalizedKey(task.status))).length;
  const blockingItems = tasks.filter((task) => {
    const blocksSomething = tasks.some((candidate) => {
      const match = candidate.dependency.trim().match(/^([A-Z]+0*\d+)/i);
      return match ? match[1].toUpperCase() === task.sort.toUpperCase() : false;
    });
    return blocksSomething && !isComplete(task);
  }).length;

  const parentProgress = Array.from(
    tasks.reduce((map, task) => {
      const entry = map.get(task.strategy) || { name: task.strategy, total: 0, completed: 0 };
      entry.total += 1;
      if (isComplete(task)) entry.completed += 1;
      map.set(task.strategy, entry);
      return map;
    }, new Map<string, { name: string; total: number; completed: number }>()).values(),
  )
    .map((entry) => ({ ...entry, percentage: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const teamNames = setup?.teamMembers.length
    ? setup.teamMembers.map((member) => member.fullName)
    : Array.from(new Set(tasks.map((task) => task.lead).filter((lead) => lead && normalizedKey(lead) !== "UNASSIGNED"))).sort();

  const teamProgress = teamNames.map((fullName) => {
    const owned = tasks.filter((task) => task.lead === fullName);
    return {
      fullName,
      total: owned.length,
      notStarted: owned.filter((task) => normalizedKey(task.status) === "NOT STARTED").length,
      waiting: owned.filter((task) => ["WAITING", "ON-HOLD"].includes(normalizedKey(task.status))).length,
      inProgress: owned.filter((task) => ["IN-PROGRESS", "VERIFICATION CHECKS"].includes(normalizedKey(task.status))).length,
      completed: owned.filter(isComplete).length,
    };
  }).filter((member) => member.total > 0);

  return (
    <main className="playlist-page playlist-page--dashboard">
      <div className="playlist-shell playlist-shell--wide">
        <PlaylistHeader
          title="Tracking Dashboard"
          eyebrow="Project Progress & Accountability"
          syncedAt={data.syncedAt}
          rowCount={tasks.length}
          active="tracking"
        />

        <MetricsRibbon tasks={tasks} colors={colors} />

        <div className="tracking-subnav" role="tablist" aria-label="Tracking dashboard views">
          <button type="button" role="tab" aria-selected={subtab === "overview"} data-active={subtab === "overview"} onClick={() => setSubtab("overview")}>Overview</button>
          <button type="button" role="tab" aria-selected={subtab === "team"} data-active={subtab === "team"} onClick={() => setSubtab("team")}>Team Progress</button>
        </div>

        {subtab === "overview" ? (
          <section className="tracking-overview">
            <div className="tracking-overview__metrics">
              <article className="tracking-square-metric">
                <strong>{blockingItems}</strong>
                <span>Blocking<br />Items</span>
              </article>
              <article className="tracking-dependency-metric">
                <div><strong>{dependenciesMet}</strong><div><span>{dependencyPercent}%</span><div><b style={{ width: `${dependencyPercent}%` }} /></div></div></div>
                <h2>Dependencies<br />Met</h2>
              </article>
              <article className="tracking-square-metric tracking-square-metric--waiting">
                <strong>{waitingOnHold}</strong>
                <span>Waiting<br />On-Hold</span>
              </article>
            </div>

            <article className="tracking-parent-progress">
              <header><p>Strategic Progress</p><h2>Progress by Parent Item</h2></header>
              <div>
                {parentProgress.map((parent) => {
                  const radius = 18;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (parent.percentage / 100) * circumference;
                  return (
                    <div className="tracking-parent-row" key={parent.name}>
                      <strong>{parent.name}</strong>
                      <div><svg viewBox="0 0 44 44" aria-hidden="true"><circle className="tracking-ring-base" strokeWidth="4" fill="transparent" r={radius} cx="22" cy="22" /><circle className="tracking-ring-value" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} fill="transparent" r={radius} cx="22" cy="22" /></svg><span>{parent.percentage}%</span></div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        ) : (
          <section className="tracking-team-progress">
            <h2>Team Progress</h2>
            <div>
              {teamProgress.map((member) => (
                <article className="tracking-team-row" key={member.fullName}>
                  <div className="tracking-team-total"><strong>{member.total}</strong><span>Total Items</span></div>
                  <div className="tracking-team-statuses">
                    <div style={{ backgroundColor: colors["NOT STARTED"]?.background, color: colors["NOT STARTED"]?.color }}><strong>{member.notStarted}</strong><span>Not Started</span></div>
                    <div style={{ backgroundColor: colors.WAITING?.background, color: colors.WAITING?.color }}><strong>{member.waiting}</strong><span>Waiting</span></div>
                    <div style={{ backgroundColor: colors["IN-PROGRESS"]?.background, color: colors["IN-PROGRESS"]?.color }}><strong>{member.inProgress}</strong><span>In Progress</span></div>
                    <div style={{ backgroundColor: colors.COMPLETED?.background, color: colors.COMPLETED?.color }}><strong>{member.completed}</strong><span>Completed</span></div>
                  </div>
                  <h3>{member.fullName.split(/\s+/)[0]}</h3>
                </article>
              ))}
              {!teamProgress.length ? <div className="playlist-no-results">No team members have assigned action items.</div> : null}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
