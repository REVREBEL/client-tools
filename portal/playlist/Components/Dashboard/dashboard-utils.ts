import type { PlaylistData, WorkspaceSetupData } from "../../app/lib/google-sheets";
import type { DashboardColorMap, DashboardTask, DashboardTaskPayload, StrategyGroup } from "./dashboard-types";

export const DEFAULT_STATUS_COLORS: DashboardColorMap = {
  "NOT STARTED": { background: "#EFF5F6", color: "#163666" },
  "IN-PROGRESS": { background: "#00A6B6", color: "#FFFFFF" },
  WAITING: { background: "#FACA78", color: "#E05047" },
  "VERIFICATION CHECKS": { background: "#00A6B6", color: "#FFFFFF" },
  "FAILED VERIFICATION": { background: "#FACA78", color: "#E05047" },
  "NO RESPONSE": { background: "#F37D59", color: "#E05047" },
  "ON-HOLD": { background: "#B2D3DE", color: "#163666" },
  COMPLETED: { background: "#163666", color: "#B2D3DE" },
  "FUTURE TBD": { background: "#8E456A", color: "#F37D59" },
  SKIPPED: { background: "#E05047", color: "#B2D3DE" },
};

export const DEFAULT_PRIORITY_COLORS: DashboardColorMap = {
  CRITICAL: { background: "#E05047", color: "#FFFFFF" },
  MAJOR: { background: "#F37D59", color: "#163666" },
  ELEVATED: { background: "#FACA78", color: "#163666" },
  MEDIUM: { background: "#71C9C5", color: "#163666" },
  LOW: { background: "#B2D3DE", color: "#163666" },
};

export function normalize(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizedKey(value: unknown) {
  return normalize(value).toUpperCase();
}

export function formatDate(value: unknown) {
  const raw = normalize(value);
  if (!raw) return "";
  if (["TBD", "SKIPPED", "PENDING", "DATE", "UNSCHEDULED"].includes(raw.toUpperCase())) return raw;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(date);
  }

  return raw;
}

export function getInitials(name: string) {
  const parts = normalize(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function extractSortIndex(sortValue: string) {
  const match = normalize(sortValue).match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function extractSortPrefix(sortValue: string) {
  const match = normalize(sortValue).match(/^([A-Z]+)/i);
  return match ? match[1].toUpperCase() : "";
}

export function getCleanLetters(value: string) {
  return normalize(value).replace(/[^A-Za-z]/g, "").toUpperCase();
}

function configuredColors(
  setup: WorkspaceSetupData | undefined,
  kind: "status" | "priority",
  fallback: DashboardColorMap,
): DashboardColorMap {
  const settings = kind === "status" ? setup?.statuses : setup?.priorities;
  const configured = Object.fromEntries(
    (settings || []).map((item) => [
      normalizedKey(item.label),
      {
        background: item.backgroundColor || fallback[normalizedKey(item.label)]?.background || "#FFFFFF",
        color: item.fontColor || fallback[normalizedKey(item.label)]?.color || "#163666",
      },
    ]),
  );
  return { ...fallback, ...configured };
}

export function statusColorMap(setup?: WorkspaceSetupData) {
  return configuredColors(setup, "status", DEFAULT_STATUS_COLORS);
}

export function priorityColorMap(setup?: WorkspaceSetupData) {
  return configuredColors(setup, "priority", DEFAULT_PRIORITY_COLORS);
}

export function parseDashboardTasks(data: PlaylistData): DashboardTask[] {
  return data.rows
    .map((row) => ({
      id: row.rowNumber,
      rowNumber: row.rowNumber,
      strategy: normalize(row.values["STRATEGY PARENT ITEM"] || row.values["MAIN STRATEGY"]) || "UNCATEGORIZED",
      tactical: normalize(row.values["TACTICAL ITEM"]),
      lead: normalize(row.values["TEAM LEAD"] || row.values.ASSIGNED) || "UNASSIGNED",
      action: normalize(row.values["ACTION ITEM"]).slice(0, 150),
      actionDescription: normalize(row.values["ACTION ITEM DESCRIPTION"]),
      notes: normalize(row.values.NOTES),
      dueDate: formatDate(row.values["DUE DATE"]),
      rawDueDate: normalize(row.values["DUE DATE"]),
      coreFunction: ["TRUE", "YES", "1"].includes(normalizedKey(row.values["CORE FUNCTION"])),
      rank: normalize(row.values.RANK),
      priority: normalize(row.values.PRIORITY),
      status: normalizedKey(row.values.STATUS) || "NOT STARTED",
      sort: normalize(row.values["ITEM SORT"] || row.values["ITEM NO"]),
      dependency: normalize(row.values["ACTION ITEM DEPENDENCY"]),
    }))
    .filter((task) => task.action && normalizedKey(task.action) !== "ACTION ITEM")
    .sort((left, right) => left.sort.localeCompare(right.sort, undefined, { numeric: true, sensitivity: "base" }));
}

export function taskPayloadToSheetValues(payload: DashboardTaskPayload) {
  return {
    "STRATEGY PARENT ITEM": payload.strategy,
    "TACTICAL ITEM": payload.tactical,
    "TEAM LEAD": payload.lead,
    "ACTION ITEM": payload.action,
    "ACTION ITEM DESCRIPTION": payload.actionDescription,
    NOTES: payload.notes,
    "CORE FUNCTION": payload.coreFunction ? "TRUE" : "FALSE",
    "DUE DATE": payload.dueDate,
    RANK: payload.rank,
    PRIORITY: payload.priority,
    STATUS: payload.status,
    "ITEM SORT": payload.sort,
    "ACTION ITEM DEPENDENCY": payload.dependency,
  };
}

export function emptyTaskSheetValues() {
  return taskPayloadToSheetValues({
    strategy: "",
    tactical: "",
    lead: "",
    action: "",
    actionDescription: "",
    notes: "",
    coreFunction: false,
    dueDate: "",
    rank: "",
    priority: "",
    status: "",
    sort: "",
    dependency: "",
  });
}

export function groupStrategies(tasks: DashboardTask[]): StrategyGroup[] {
  const groups = new Map<string, StrategyGroup>();
  for (const task of tasks) {
    const name = task.strategy || "UNCATEGORIZED";
    const existing = groups.get(name) || { name, tasks: [], total: 0, completed: 0 };
    existing.tasks.push(task);
    existing.total += 1;
    if (normalizedKey(task.status) === "COMPLETED") existing.completed += 1;
    groups.set(name, existing);
  }
  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getDependencyStatus(tasks: DashboardTask[], dependency: string) {
  if (!dependency) return null;
  const match = dependency.trim().match(/^([A-Z]+0*\d+)/i);
  if (!match) return null;
  const code = match[1].toUpperCase();
  return tasks.find((task) => task.sort.toUpperCase() === code)?.status.toUpperCase() || null;
}

export function getGroupPrefix(tasks: DashboardTask[], tacticalName: string, currentTaskId?: number | null) {
  if (!tacticalName) return "TASK";
  const normalizedTactical = normalizedKey(tacticalName);
  for (const task of tasks) {
    if (task.id === currentTaskId) continue;
    if (normalizedKey(task.tactical) !== normalizedTactical) continue;
    const prefix = extractSortPrefix(task.sort);
    if (prefix) return prefix;
  }
  return getCleanLetters(tacticalName).slice(0, 4).padEnd(4, "X");
}

export function isComplete(task: DashboardTask) {
  return normalizedKey(task.status) === "COMPLETED";
}
