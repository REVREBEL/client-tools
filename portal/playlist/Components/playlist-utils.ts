import type { PlaylistRow } from "../app/lib/google-sheets";

export const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  "NOT STARTED": { background: "#EFF5F6", color: "#163666" },
  "IN-PROGRESS": { background: "#00A6B6", color: "#FFFFFF" },
  "IN PROGRESS": { background: "#00A6B6", color: "#FFFFFF" },
  WAITING: { background: "#FACA78", color: "#E05047" },
  "ON-HOLD": { background: "#B2D3DE", color: "#163666" },
  "ON HOLD": { background: "#B2D3DE", color: "#163666" },
  COMPLETED: { background: "#163666", color: "#B2D3DE" },
  COMPLETE: { background: "#163666", color: "#B2D3DE" },
  "FUTURE TBD": { background: "#8E456A", color: "#F37D59" },
  SKIPPED: { background: "#E05047", color: "#B2D3DE" },
  "VERIFICATION CHECKS": { background: "#00A6B6", color: "#FACA78" },
  "FAILED VERIFICATION": { background: "#E05047", color: "#FACA78" },
  "NO RESPONSE": { background: "#F37D59", color: "#8E456A" },
};

export function normalize(value: string) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function normalizedKey(value: string) {
  return normalize(value).toUpperCase();
}

export function statusColors(status: string) {
  return STATUS_COLORS[normalizedKey(status)] || { background: "#FFFFFF", color: "#163666" };
}

export function isComplete(row: PlaylistRow) {
  const status = normalizedKey(row.values.STATUS);
  return status === "COMPLETE" || status === "COMPLETED";
}

export function parseDueDate(value: string) {
  const clean = normalize(value);
  if (!clean) return null;
  const timestamp = Date.parse(clean);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

export function isOverdue(row: PlaylistRow, now = new Date()) {
  if (isComplete(row)) return false;
  const due = parseDueDate(row.values["DUE DATE"]);
  if (!due) return false;
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return due.getTime() < endOfToday.getTime();
}

export function groupCounts(rows: PlaylistRow[], header: string) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const label = normalize(row.values[header]) || "Unspecified";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
