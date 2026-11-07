"use client";

import { ChevronDown, Star, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { WorkspaceTeamMember } from "../../app/lib/google-sheets";
import type { DashboardTask, DashboardTaskPayload } from "./dashboard-types";
import { extractSortIndex, getGroupPrefix } from "./dashboard-utils";

type TaskEditorModalProps = {
  isOpen: boolean;
  task: DashboardTask | null;
  tasks: DashboardTask[];
  teamMembers: WorkspaceTeamMember[];
  statuses: string[];
  priorities: string[];
  busy: boolean;
  onClose: () => void;
  onSave: (payload: DashboardTaskPayload) => Promise<void>;
};

function toDateInput(value: string) {
  if (!value) return "";
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TaskEditorModal({
  isOpen,
  task,
  tasks,
  teamMembers,
  statuses,
  priorities,
  busy,
  onClose,
  onSave,
}: TaskEditorModalProps) {
  const [strategy, setStrategy] = useState("");
  const [tactical, setTactical] = useState("");
  const [lead, setLead] = useState("UNASSIGNED");
  const [action, setAction] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rank, setRank] = useState("000");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [coreFunction, setCoreFunction] = useState(false);
  const [sequenceNumber, setSequenceNumber] = useState("001");
  const [dependency, setDependency] = useState("");
  const [error, setError] = useState("");

  const dependencyOptions = useMemo(
    () => tasks.filter((candidate) => candidate.id !== task?.id).sort((a, b) => a.sort.localeCompare(b.sort, undefined, { numeric: true })),
    [tasks, task],
  );

  useEffect(() => {
    if (!isOpen) return;
    setStrategy(task?.strategy || "");
    setTactical(task?.tactical || "");
    setLead(task?.lead || "UNASSIGNED");
    setAction(task?.action || "");
    setActionDescription(task?.actionDescription || "");
    setNotes(task?.notes || "");
    setDueDate(toDateInput(task?.rawDueDate || ""));
    setRank(task?.rank ? String(task.rank).padStart(3, "0") : "000");
    setPriority(task?.priority || priorities[0] || "");
    setStatus(task?.status || statuses[0] || "NOT STARTED");
    setCoreFunction(Boolean(task?.coreFunction));
    setSequenceNumber(task ? String(extractSortIndex(task.sort) || 1).padStart(3, "0") : "001");
    setDependency(task?.dependency || "");
    setError("");
  }, [isOpen, task, priorities, statuses]);

  if (!isOpen) return null;

  const prefix = getGroupPrefix(tasks, tactical, task?.id);
  const sortCode = `${prefix}${String(Number(sequenceNumber) || 1).padStart(3, "0")}`;
  const duplicateSort = tasks.some((candidate) => candidate.id !== task?.id && candidate.sort.toUpperCase() === sortCode.toUpperCase());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (strategy.trim().length < 3) return setError("Add a strategy parent item before saving.");
    if (!tactical.trim()) return setError("Add a tactical sub-item before saving.");
    if (!action.trim()) return setError("Add an action item title before saving.");
    if (duplicateSort) return setError(`Sequence code ${sortCode} is already in use.`);

    try {
      await onSave({
        strategy: strategy.trim(),
        tactical: tactical.trim(),
        lead: lead || "UNASSIGNED",
        action: action.trim().slice(0, 150),
        actionDescription: actionDescription.trim(),
        notes: notes.trim(),
        coreFunction,
        dueDate,
        rank: String(Number(rank) || 0).padStart(3, "0"),
        priority,
        status,
        sort: sortCode,
        dependency,
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The action item could not be saved.");
    }
  }

  return (
    <div className="playlist-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section className="playlist-task-modal" role="dialog" aria-modal="true" aria-labelledby="playlist-task-editor-title">
        <header className="playlist-task-modal__header">
          <div>
            <p>{task ? "Edit Action Item" : "New Action Item"}</p>
            <h2 id="playlist-task-editor-title">{task ? "Edit Tactical Action Item" : "Create Tactical Action Item"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close task editor"><X /></button>
        </header>

        <form onSubmit={submit} className="playlist-task-form">
          <div className="playlist-task-form__body">
            {error ? <div className="playlist-task-form__error">{error}</div> : null}

            <label className="playlist-form-field playlist-form-field--wide">
              <span>Strategy Parent Item</span>
              <input value={strategy} onChange={(event) => setStrategy(event.target.value)} placeholder="Website Offers + Merchandising" />
            </label>

            <label className="playlist-form-field">
              <span>Tactical Sub-Item</span>
              <input value={tactical} onChange={(event) => setTactical(event.target.value)} placeholder="Create Offer Copy" />
            </label>

            <label className="playlist-form-field">
              <span>Team Lead</span>
              <span className="playlist-select-wrap">
                <select value={lead} onChange={(event) => setLead(event.target.value)}>
                  <option value="UNASSIGNED">Unassigned</option>
                  {teamMembers.map((member) => <option key={member.rowNumber} value={member.fullName}>{member.fullName}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>

            <div className="playlist-sequence-field">
              <div>
                <span>Sequence Group Prefix</span>
                <strong>{prefix}</strong>
              </div>
              <label>
                <span>Sequence Number</span>
                <input value={sequenceNumber} maxLength={3} inputMode="numeric" onChange={(event) => setSequenceNumber(event.target.value.replace(/\D/g, "").slice(0, 3))} />
              </label>
            </div>

            <label className="playlist-form-field">
              <span>Status</span>
              <span className="playlist-select-wrap">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>

            <label className="playlist-form-field">
              <span>Due Date</span>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>

            <label className="playlist-form-field playlist-form-field--wide">
              <span>Action Item Title <small>{150 - action.length} characters remaining</small></span>
              <input maxLength={150} value={action} onChange={(event) => setAction(event.target.value)} placeholder="Review copy and offer details" />
            </label>

            <label className="playlist-form-field playlist-form-field--wide">
              <span>Action Item Description</span>
              <textarea value={actionDescription} onChange={(event) => setActionDescription(event.target.value)} rows={4} />
            </label>

            <label className="playlist-form-field playlist-form-field--wide">
              <span>Strategy Notes</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
            </label>

            <label className="playlist-form-field">
              <span>Priority</span>
              <span className="playlist-select-wrap">
                <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option value="">No Priority</option>
                  {priorities.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>

            <label className="playlist-form-field">
              <span>Rank</span>
              <input value={rank} maxLength={3} inputMode="numeric" onChange={(event) => setRank(event.target.value.replace(/\D/g, "").slice(0, 3))} />
            </label>

            <label className="playlist-form-field playlist-form-field--wide">
              <span>Blocking Dependency</span>
              <span className="playlist-select-wrap">
                <select value={dependency} onChange={(event) => setDependency(event.target.value)}>
                  <option value="">No Blocking Dependency</option>
                  {dependencyOptions.map((candidate) => {
                    const value = `${candidate.sort} ${candidate.action}`.trim();
                    return <option key={candidate.id} value={value}>{candidate.sort} {candidate.action} ({candidate.status})</option>;
                  })}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>

            <label className="playlist-core-toggle playlist-form-field--wide">
              <input type="checkbox" checked={coreFunction} onChange={(event) => setCoreFunction(event.target.checked)} />
              <span><Star aria-hidden="true" /> Core Function</span>
            </label>
          </div>

          <footer className="playlist-task-modal__footer">
            <button type="button" className="playlist-secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="playlist-primary-button" disabled={busy}>{busy ? "Saving…" : task ? "Save Changes" : "Create Action Item"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
