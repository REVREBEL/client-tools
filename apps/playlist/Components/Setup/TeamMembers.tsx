"use client";

import { Mail, Pencil, Plus, Save, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { WorkspaceTeamMember } from "../../app/lib/google-sheets";

type TeamValues = {
  fullName: string;
  email: string;
  emailOptIn: boolean;
};

type TeamMembersProps = {
  members: WorkspaceTeamMember[];
  busy: boolean;
  onAdd: (values: TeamValues) => Promise<void>;
  onSave: (member: WorkspaceTeamMember, values: TeamValues) => Promise<void>;
  onDelete: (member: WorkspaceTeamMember) => Promise<void>;
};

const blankMember: TeamValues = { fullName: "", email: "", emailOptIn: true };

export default function TeamMembers({ members, busy, onAdd, onSave, onDelete }: TeamMembersProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<TeamValues>(blankMember);
  const [newValues, setNewValues] = useState<TeamValues>(blankMember);

  useEffect(() => {
    if (editingRow && !members.some((member) => member.rowNumber === editingRow)) setEditingRow(null);
  }, [editingRow, members]);

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.fullName.localeCompare(right.fullName)),
    [members],
  );

  function startEdit(member: WorkspaceTeamMember) {
    setEditingRow(member.rowNumber);
    setEditValues({
      fullName: member.fullName,
      email: member.email,
      emailOptIn: !member.emailOptOut,
    });
  }

  async function addMember() {
    if (!newValues.fullName.trim()) return;
    await onAdd({ ...newValues, fullName: newValues.fullName.trim(), email: newValues.email.trim() });
    setNewValues(blankMember);
  }

  return (
    <section className="workspace-card" aria-labelledby="workspace-team-heading">
      <header className="workspace-card__header">
        <div className="workspace-card__icon"><Users aria-hidden="true" /></div>
        <div>
          <p>Project Access</p>
          <h2 id="workspace-team-heading">Team Members</h2>
        </div>
        <span className="workspace-card__count">{members.length}</span>
      </header>

      <div className="workspace-team-list">
        {sortedMembers.map((member) => {
          const editing = editingRow === member.rowNumber;
          return (
            <article className="workspace-team-row" key={member.rowNumber} data-editing={editing ? "true" : "false"}>
              {editing ? (
                <div className="workspace-team-edit">
                  <label className="workspace-field">
                    <span>Full Name</span>
                    <input value={editValues.fullName} onChange={(event) => setEditValues({ ...editValues, fullName: event.target.value })} />
                  </label>
                  <label className="workspace-field">
                    <span>Email</span>
                    <input type="email" value={editValues.email} onChange={(event) => setEditValues({ ...editValues, email: event.target.value })} />
                  </label>
                  <label className="workspace-toggle">
                    <input
                      type="checkbox"
                      checked={editValues.emailOptIn}
                      onChange={(event) => setEditValues({ ...editValues, emailOptIn: event.target.checked })}
                    />
                    <span>Email notifications</span>
                  </label>
                  <div className="workspace-row-actions">
                    <button
                      className="workspace-icon-button"
                      type="button"
                      disabled={busy || !editValues.fullName.trim()}
                      onClick={async () => {
                        await onSave(member, {
                          ...editValues,
                          fullName: editValues.fullName.trim(),
                          email: editValues.email.trim(),
                        });
                        setEditingRow(null);
                      }}
                      aria-label={`Save ${member.fullName}`}
                    >
                      <Save aria-hidden="true" />
                    </button>
                    <button className="workspace-icon-button" type="button" disabled={busy} onClick={() => setEditingRow(null)} aria-label="Cancel edit">
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="workspace-team-avatar" aria-hidden="true">
                    {member.fullName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "?"}
                  </div>
                  <div className="workspace-team-copy">
                    <strong>{member.fullName}</strong>
                    <span><Mail aria-hidden="true" />{member.email || "No email assigned"}</span>
                    <small data-muted={member.emailOptOut ? "true" : "false"}>
                      {member.emailOptOut ? "Email notifications off" : "Email notifications on"}
                    </small>
                  </div>
                  <div className="workspace-row-actions">
                    <button className="workspace-icon-button" type="button" disabled={busy} onClick={() => startEdit(member)} aria-label={`Edit ${member.fullName}`}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button className="workspace-icon-button workspace-icon-button--danger" type="button" disabled={busy} onClick={() => onDelete(member)} aria-label={`Delete ${member.fullName}`}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}

        {!members.length ? <div className="workspace-empty-row">No team members configured</div> : null}
      </div>

      <div className="workspace-add-block">
        <div className="workspace-add-block__title">
          <Plus aria-hidden="true" />
          <span>Add Team Member</span>
        </div>
        <div className="workspace-form-grid workspace-form-grid--team">
          <label className="workspace-field">
            <span>Full Name</span>
            <input value={newValues.fullName} onChange={(event) => setNewValues({ ...newValues, fullName: event.target.value })} placeholder="First Last" />
          </label>
          <label className="workspace-field">
            <span>Email</span>
            <input type="email" value={newValues.email} onChange={(event) => setNewValues({ ...newValues, email: event.target.value })} placeholder="name@example.com" />
          </label>
          <label className="workspace-toggle workspace-toggle--add">
            <input
              type="checkbox"
              checked={newValues.emailOptIn}
              onChange={(event) => setNewValues({ ...newValues, emailOptIn: event.target.checked })}
            />
            <span>Email notifications</span>
          </label>
          <button className="workspace-button workspace-button--primary" type="button" disabled={busy || !newValues.fullName.trim()} onClick={addMember}>
            <Plus aria-hidden="true" />
            Add Member
          </button>
        </div>
      </div>
    </section>
  );
}
