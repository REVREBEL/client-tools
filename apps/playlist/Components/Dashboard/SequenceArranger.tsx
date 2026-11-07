"use client";

import { ArrowDown, ArrowUp, GripVertical, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { DragEvent, useEffect, useMemo, useState } from "react";
import type { PlaylistData, WorkspaceSetupData } from "../../app/lib/google-sheets";
import PlaylistHeader from "../Playlist/PlaylistHeader";
import type { DashboardTask } from "./dashboard-types";
import { getGroupPrefix, parseDashboardTasks, statusColorMap } from "./dashboard-utils";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function SequenceArranger({ data, setup }: { data: PlaylistData; setup: WorkspaceSetupData }) {
  const router = useRouter();
  const parsed = useMemo(() => parseDashboardTasks(data), [data]);
  const [tasks, setTasks] = useState(parsed);
  const tacticalGroups = useMemo(() => Array.from(new Set(tasks.map((task) => task.tactical).filter(Boolean))).sort(), [tasks]);
  const [tactical, setTactical] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const colors = useMemo(() => statusColorMap(setup), [setup]);

  useEffect(() => setTasks(parsed), [parsed]);
  useEffect(() => {
    if (!tactical && tacticalGroups.length) setTactical(tacticalGroups[0]);
  }, [tactical, tacticalGroups]);

  const groupTasks = useMemo(
    () => tasks.filter((task) => task.tactical === tactical).sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true })),
    [tasks, tactical],
  );

  useEffect(() => setOrder(groupTasks.map((task) => task.id)), [tactical, groupTasks.map((task) => task.id).join(",")]);

  const orderedTasks = order.map((id) => groupTasks.find((task) => task.id === id)).filter(Boolean) as DashboardTask[];

  if (!data.configured || data.error) {
    return (
      <main className="playlist-page"><section className={`playlist-empty${data.error ? " playlist-empty--error" : ""}`}>
        <p className="playlist-eyebrow">Sequence Arranger</p>
        <h1>{data.error ? "Playlist connection error" : "Connect the Playlist Sheet"}</h1>
        <p>{data.error || "The sequence arranger uses the Playlist Action Items sheet."}</p>
      </section></main>
    );
  }

  function move(oldIndex: number, newIndex: number) {
    if (oldIndex === newIndex || oldIndex < 0 || newIndex < 0 || newIndex >= order.length) return;
    setOrder((current) => {
      const copy = [...current];
      const [item] = copy.splice(oldIndex, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>, targetId: number) {
    event.preventDefault();
    if (draggingId === null || draggingId === targetId) return;
    move(order.indexOf(draggingId), order.indexOf(targetId));
    setDraggingId(null);
  }

  async function saveOrder() {
    if (!orderedTasks.length) return;
    setBusy(true);
    setMessage("");
    const prefix = getGroupPrefix(tasks, tactical);
    try {
      for (let index = 0; index < orderedTasks.length; index += 1) {
        const task = orderedTasks[index];
        const nextSort = `${prefix}${String(index + 1).padStart(3, "0")}`;
        if (task.sort === nextSort) continue;
        const response = await fetch(`${BASE_PATH}/api/playlist/mutate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateRow", rowNumber: task.rowNumber, values: { "ITEM SORT": nextSort } }),
        });
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(result?.error || `Could not update ${task.action}.`);
      }
      setTasks((current) => current.map((task) => {
        const index = order.indexOf(task.id);
        return index >= 0 ? { ...task, sort: `${prefix}${String(index + 1).padStart(3, "0")}` } : task;
      }));
      setMessage("Sequence saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sequence could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const dirty = orderedTasks.some((task, index) => task.sort !== `${getGroupPrefix(tasks, tactical)}${String(index + 1).padStart(3, "0")}`);

  return (
    <main className="playlist-page">
      <div className="playlist-shell playlist-shell--wide">
        <PlaylistHeader title="Sequence Arranger" eyebrow="Execution Order" syncedAt={data.syncedAt} rowCount={tasks.length} active="sequencer" />

        <section className="sequence-card">
          <header className="sequence-card__header">
            <div><p>Tactical Workstream</p><h2>Arrange Action Items</h2><span>Drag rows, choose a position, or use the arrows. Changes are written only when you save.</span></div>
            <label><span>Select Tactical Group</span><select value={tactical} onChange={(event) => { setTactical(event.target.value); setMessage(""); }}>{tacticalGroups.map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
          </header>

          <div className="sequence-toolbar">
            <span>{orderedTasks.length} items</span>
            <div>{message ? <strong>{message}</strong> : null}<button type="button" className="playlist-primary-button" onClick={saveOrder} disabled={busy || !dirty}><Save aria-hidden="true" />{busy ? "Saving…" : "Save Sequence"}</button></div>
          </div>

          <div className="sequence-list">
            {orderedTasks.map((task, index) => {
              const color = colors[task.status] || { background: "#163666", color: "#B2D3DE" };
              return (
                <div
                  className="sequence-row"
                  data-dragging={draggingId === task.id}
                  key={task.id}
                  draggable={!busy}
                  onDragStart={() => setDraggingId(task.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDrop(event, task.id)}
                >
                  <GripVertical className="sequence-row__grip" aria-hidden="true" />
                  <div className="sequence-row__position"><span>{getGroupPrefix(tasks, tactical)}</span><select value={index + 1} onChange={(event) => move(index, Number(event.target.value) - 1)}>{orderedTasks.map((_, position) => <option key={position} value={position + 1}>{String(position + 1).padStart(3, "0")}</option>)}</select></div>
                  <div className="sequence-row__task"><strong>{task.action}</strong><small>{task.strategy}</small></div>
                  <span className="sequence-row__status" style={{ backgroundColor: color.background, color: color.color }}>{task.status}</span>
                  <span className="sequence-row__date">{task.dueDate || "No Date"}</span>
                  <div className="sequence-row__moves"><button type="button" disabled={busy || index === 0} onClick={() => move(index, index - 1)} aria-label="Move item up"><ArrowUp /></button><button type="button" disabled={busy || index === orderedTasks.length - 1} onClick={() => move(index, index + 1)} aria-label="Move item down"><ArrowDown /></button></div>
                </div>
              );
            })}
            {!orderedTasks.length ? <div className="playlist-no-results">No action items are assigned to this tactical group.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
