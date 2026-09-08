"use client";

import { Calendar, ChevronDown, Edit2, FileText, Notebook, Search, Star, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { WorkspaceTeamMember } from "../../app/lib/google-sheets";
import type { DashboardColorMap, DashboardTask } from "./dashboard-types";
import { getDependencyStatus, getInitials, groupStrategies, normalizedKey } from "./dashboard-utils";

type StrategyDashboardProps = {
  tasks: DashboardTask[];
  teamMembers: WorkspaceTeamMember[];
  statusColors: DashboardColorMap;
  priorityColors: DashboardColorMap;
  busy: boolean;
  onNew: () => void;
  onEdit: (task: DashboardTask) => void;
  onDelete: (task: DashboardTask) => Promise<void>;
  onCycleStatus: (task: DashboardTask) => Promise<void>;
};

function textWithLinks(text: string) {
  const expression = /(https?:\/\/[^\s]+)/g;
  return text.split(expression).map((part, index) => {
    if (expression.test(part)) {
      expression.lastIndex = 0;
      return <a href={part} key={`${part}-${index}`} target="_blank" rel="noreferrer">{part}</a>;
    }
    expression.lastIndex = 0;
    return part;
  });
}

export default function StrategyDashboard({
  tasks,
  teamMembers,
  statusColors,
  priorityColors,
  busy,
  onNew,
  onEdit,
  onDelete,
  onCycleStatus,
}: StrategyDashboardProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [person, setPerson] = useState("ALL");
  const [coreOnly, setCoreOnly] = useState(false);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [expandedStrategies, setExpandedStrategies] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [tacticalFilters, setTacticalFilters] = useState<Record<string, string>>({});

  const availablePriorities = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.priority).filter(Boolean))).sort(),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const haystack = [task.action, task.actionDescription, task.notes, task.strategy, task.tactical, task.lead, task.sort]
        .join(" ")
        .toLowerCase();
      return (
        (!needle || haystack.includes(needle)) &&
        (status === "ALL" || normalizedKey(task.status) === status) &&
        (person === "ALL" || task.lead === person) &&
        (!coreOnly || task.coreFunction) &&
        (!priorities.length || priorities.includes(task.priority))
      );
    });
  }, [tasks, query, status, person, coreOnly, priorities]);

  const groups = useMemo(() => groupStrategies(filteredTasks), [filteredTasks]);
  const statusKeys = Object.keys(statusColors);
  const team = teamMembers.length
    ? teamMembers
    : Array.from(new Set(tasks.map((task) => task.lead).filter((lead) => lead && normalizedKey(lead) !== "UNASSIGNED"))).map((fullName, index) => ({ rowNumber: index, firstName: "", lastName: "", fullName, email: "", emailOptOut: false }));

  function togglePriority(priority: string) {
    setPriorities((current) => current.includes(priority) ? current.filter((item) => item !== priority) : [...current, priority]);
  }

  return (
    <section className="strategy-dashboard">
      <div className="strategy-dashboard__toolbar">
        <div className="strategy-status-filters" aria-label="Filter by status">
          <button type="button" data-active={status === "ALL"} onClick={() => setStatus("ALL")}>All Items</button>
          {statusKeys.map((key) => {
            const selected = status === key;
            const color = statusColors[key];
            return (
              <button
                type="button"
                key={key}
                data-active={selected}
                onClick={() => setStatus(key)}
                style={selected ? { backgroundColor: color.background, color: color.color, borderColor: color.color } : undefined}
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="strategy-dashboard__filter-row">
          <label className="strategy-search">
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search actions, strategies, or descriptions" />
          </label>

          <div className="strategy-filter-actions">
            <div className="strategy-priority-filter">
              <button type="button" className="playlist-outline-button" onClick={() => setPriorityOpen((value) => !value)}>
                Priority {priorities.length ? `(${priorities.length})` : ""} <ChevronDown aria-hidden="true" />
              </button>
              {priorityOpen ? (
                <div className="strategy-priority-filter__menu">
                  <div><strong>Filter Priority</strong>{priorities.length ? <button type="button" onClick={() => setPriorities([])}>Clear</button> : null}</div>
                  {availablePriorities.map((priority) => (
                    <label key={priority}>
                      <input type="checkbox" checked={priorities.includes(priority)} onChange={() => togglePriority(priority)} />
                      <span>{priority}</span>
                    </label>
                  ))}
                  {!availablePriorities.length ? <small>No priorities found</small> : null}
                </div>
              ) : null}
            </div>

            <button type="button" className="playlist-outline-button" data-active={coreOnly} onClick={() => setCoreOnly((value) => !value)}>
              <Star aria-hidden="true" /> Core
            </button>
          </div>

          <div className="strategy-member-filter">
            <strong>Members</strong>
            <button type="button" data-active={person === "ALL"} onClick={() => setPerson("ALL")}>ALL</button>
            {team.map((member) => (
              <button
                type="button"
                key={`${member.rowNumber}-${member.fullName}`}
                data-active={person === member.fullName}
                onClick={() => setPerson(member.fullName)}
                title={member.fullName}
              >
                {getInitials(member.fullName)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="strategy-dashboard__summary-row">
        <span>{filteredTasks.length.toLocaleString()} of {tasks.length.toLocaleString()} action items</span>
        <button type="button" className="playlist-primary-button" onClick={onNew} disabled={busy}>+ New Task</button>
      </div>

      <div className="strategy-groups">
        {groups.map((group) => {
          const expanded = expandedStrategies[group.name] ?? true;
          const tacticals = Array.from(new Set(group.tasks.map((task) => task.tactical).filter(Boolean))).sort();
          const tactical = tacticalFilters[group.name] || "ALL";
          const visibleTasks = tactical === "ALL" ? group.tasks : group.tasks.filter((task) => normalizedKey(task.tactical) === tactical);
          const percent = group.total ? Math.round((group.completed / group.total) * 100) : 0;

          return (
            <article className="strategy-group" key={group.name}>
              <button
                type="button"
                className="strategy-group__header"
                onClick={() => setExpandedStrategies((current) => ({ ...current, [group.name]: !expanded }))}
              >
                <ChevronDown aria-hidden="true" data-collapsed={!expanded} />
                <div>
                  <h2>{group.name}</h2>
                  <span>{group.total} Action Items</span>
                </div>
                <div className="strategy-group__progress">
                  <div><span style={{ width: `${percent}%` }} /></div>
                  <strong>{percent}% Complete</strong>
                </div>
              </button>

              {expanded ? (
                <div>
                  {tacticals.length ? (
                    <div className="strategy-tactical-filter">
                      <strong>Filter by Tactical:</strong>
                      <button type="button" data-active={tactical === "ALL"} onClick={() => setTacticalFilters((current) => ({ ...current, [group.name]: "ALL" }))}>All</button>
                      {tacticals.map((name) => (
                        <button type="button" key={name} data-active={tactical === normalizedKey(name)} onClick={() => setTacticalFilters((current) => ({ ...current, [group.name]: normalizedKey(name) }))}>{name}</button>
                      ))}
                    </div>
                  ) : null}

                  <div className="strategy-table-wrap">
                    <table className="strategy-table">
                      <thead><tr><th>Status</th><th>Action Item Details</th><th>Rank</th><th>Priority</th><th>Lead Resource</th><th>Due Date</th><th>Edit</th></tr></thead>
                      <tbody>
                        {visibleTasks.map((task) => {
                          const detailsOpen = Boolean(expandedTasks[task.id]);
                          const dependencyStatus = getDependencyStatus(tasks, task.dependency);
                          const blocksSomething = tasks.some((other) => other.dependency && other.dependency.toUpperCase().startsWith(task.sort.toUpperCase())) && normalizedKey(task.status) !== "COMPLETED";
                          const statusColor = statusColors[normalizedKey(task.status)] || { background: "#163666", color: "#B2D3DE" };
                          const priorityColor = priorityColors[normalizedKey(task.priority)] || { background: "#163666", color: "#B2D3DE" };
                          const canExpand = Boolean(task.notes || task.actionDescription);

                          return (
                            <Fragment key={task.id}>
                              <tr className={canExpand ? "strategy-task-row strategy-task-row--expandable" : "strategy-task-row"} onClick={() => canExpand && setExpandedTasks((current) => ({ ...current, [task.id]: !detailsOpen }))}>
                                <td><button type="button" className="strategy-status-chip" disabled={busy} onClick={(event) => { event.stopPropagation(); void onCycleStatus(task); }} style={{ backgroundColor: statusColor.background, color: statusColor.color, borderColor: statusColor.color }}>{task.status}</button></td>
                                <td>
                                  <div className="strategy-task-title">{task.coreFunction ? <Star aria-hidden="true" /> : null}<span>{task.action}</span></div>
                                  <div className="strategy-task-flags">
                                    {task.tactical ? <span>{task.tactical}</span> : null}
                                    {task.notes ? <span><Notebook aria-hidden="true" /> Note</span> : null}
                                    {blocksSomething ? <span data-alert="true">Blocking Item</span> : null}
                                    {task.dependency && dependencyStatus && dependencyStatus !== "COMPLETED" ? <span data-warning="true">Dependency Not Met</span> : null}
                                    {task.dependency && dependencyStatus === "COMPLETED" && normalizedKey(task.status) !== "COMPLETED" ? <span data-success="true">Dependency Met</span> : null}
                                  </div>
                                </td>
                                <td>{task.rank ? <span className="strategy-rank">{String(task.rank).padStart(3, "0")}</span> : "—"}</td>
                                <td>{task.priority ? <span className="strategy-priority-chip" style={{ backgroundColor: priorityColor.background, color: priorityColor.color }}>{task.priority}</span> : "—"}</td>
                                <td><span className="strategy-lead"><b>{getInitials(task.lead)}</b>{task.lead}</span></td>
                                <td><span className="strategy-due-date"><Calendar aria-hidden="true" />{task.dueDate || "No Date"}</span></td>
                                <td>
                                  <div className="strategy-row-actions">
                                    <button type="button" onClick={(event) => { event.stopPropagation(); onEdit(task); }} aria-label={`Edit ${task.action}`}><Edit2 /></button>
                                    <button type="button" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Delete ${task.action}?`)) void onDelete(task); }} aria-label={`Delete ${task.action}`}><Trash2 /></button>
                                  </div>
                                </td>
                              </tr>
                              {detailsOpen && canExpand ? (
                                <tr className="strategy-task-details">
                                  <td colSpan={7}>
                                    {task.actionDescription ? <div><h3><FileText aria-hidden="true" /> Action Item Description</h3><p>{textWithLinks(task.actionDescription)}</p></div> : null}
                                    {task.notes ? <div><h3><Notebook aria-hidden="true" /> Strategy Notes</h3><p>{textWithLinks(task.notes)}</p></div> : null}
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}

        {!groups.length ? <div className="playlist-no-results">No action items match the current filters.</div> : null}
      </div>
    </section>
  );
}
