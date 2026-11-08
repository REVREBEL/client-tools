"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { PlaylistData, WorkspaceSetupData } from "../../app/lib/google-sheets";
import PlaylistHeader from "../Playlist/PlaylistHeader";
import MetricsRibbon from "./MetricsRibbon";
import StrategyDashboard from "./StrategyDashboard";
import TaskEditorModal from "./TaskEditorModal";
import type { DashboardTask, DashboardTaskPayload } from "./dashboard-types";
import {
  emptyTaskSheetValues,
  normalizedKey,
  parseDashboardTasks,
  priorityColorMap,
  statusColorMap,
  taskPayloadToSheetValues,
} from "./dashboard-utils";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type MutationResult = { error?: string };

export default function PlaylistDashboard({ data, setup }: { data: PlaylistData; setup: WorkspaceSetupData }) {
  const router = useRouter();
  const parsed = useMemo(() => parseDashboardTasks(data), [data]);
  const [tasks, setTasks] = useState(parsed);
  const [editingTask, setEditingTask] = useState<DashboardTask | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setTasks(parsed), [parsed]);

  const statusColors = useMemo(() => statusColorMap(setup), [setup]);
  const priorityColors = useMemo(() => priorityColorMap(setup), [setup]);
  const statuses = setup.statuses.length ? setup.statuses.map((item) => normalizedKey(item.label)) : Object.keys(statusColors);
  const priorities = setup.priorities.length ? setup.priorities.map((item) => item.label) : Object.keys(priorityColors);

  if (!data.configured || data.error) {
    return (
      <main className="playlist-page">
        <section className={`playlist-empty${data.error ? " playlist-empty--error" : ""}`}>
          <p className="playlist-eyebrow">Strategy Items</p>
          <h1>{data.error ? "Playlist connection error" : "Connect the Playlist Sheet"}</h1>
          <p>{data.error || "Add PLAYLIST_SPREADSHEET_ID to the Webflow Cloud environment to load The Playlist."}</p>
        </section>
      </main>
    );
  }

  async function mutate(body: Record<string, unknown>) {
    const response = await fetch(`${BASE_PATH}/api/playlist/mutate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => null)) as MutationResult | null;
    if (!response.ok) throw new Error(result?.error || `Playlist update failed (${response.status}).`);
    return result;
  }

  async function saveTask(payload: DashboardTaskPayload) {
    setBusy(true);
    setNotice(null);
    try {
      if (editingTask) {
        await mutate({ action: "updateRow", rowNumber: editingTask.rowNumber, values: taskPayloadToSheetValues(payload) });
        setTasks((current) => current.map((task) => task.id === editingTask.id ? {
          ...task,
          ...payload,
          dueDate: payload.dueDate,
          rawDueDate: payload.dueDate,
        } : task));
      } else {
        await mutate({ action: "insertRow", values: taskPayloadToSheetValues(payload) });
      }
      setNotice(editingTask ? "Action item updated." : "Action item created.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask(task: DashboardTask) {
    setBusy(true);
    setNotice(null);
    try {
      await mutate({ action: "updateRow", rowNumber: task.rowNumber, values: emptyTaskSheetValues() });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotice("Action item removed.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The action item could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(task: DashboardTask) {
    const currentIndex = statuses.indexOf(normalizedKey(task.status));
    const nextStatus = statuses[(currentIndex >= 0 ? currentIndex + 1 : 0) % statuses.length] || "NOT STARTED";
    setBusy(true);
    setNotice(null);
    try {
      await mutate({ action: "updateRow", rowNumber: task.rowNumber, values: { STATUS: nextStatus } });
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item));
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="playlist-page playlist-page--dashboard">
      <div className="playlist-shell playlist-shell--wide">
        <PlaylistHeader
          title={setup.projectName || "Strategy Items"}
          eyebrow="Commercial Strategy Action Plan"
          syncedAt={data.syncedAt}
          rowCount={tasks.length}
          active="dashboard"
        />

        <MetricsRibbon tasks={tasks} colors={statusColors} />

        {notice ? (
          <div className="playlist-dashboard-notice" role="status">
            <TriangleAlert aria-hidden="true" />
            <span>{notice}</span>
          </div>
        ) : null}

        <StrategyDashboard
          tasks={tasks}
          teamMembers={setup.teamMembers}
          statusColors={statusColors}
          priorityColors={priorityColors}
          busy={busy}
          onNew={() => { setEditingTask(null); setEditorOpen(true); }}
          onEdit={(task) => { setEditingTask(task); setEditorOpen(true); }}
          onDelete={deleteTask}
          onCycleStatus={cycleStatus}
        />

        <TaskEditorModal
          isOpen={editorOpen}
          task={editingTask}
          tasks={tasks}
          teamMembers={setup.teamMembers}
          statuses={statuses}
          priorities={priorities}
          busy={busy}
          onClose={() => { if (!busy) { setEditorOpen(false); setEditingTask(null); } }}
          onSave={saveTask}
        />
      </div>
    </main>
  );
}
