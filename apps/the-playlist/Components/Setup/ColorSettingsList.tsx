"use client";

import { Palette, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WorkspaceColorSetting } from "../../app/lib/google-sheets";

type ColorValues = {
  label: string;
  backgroundColor: string;
  fontColor: string;
};

type ColorSettingsListProps = {
  eyebrow: string;
  title: string;
  emptyLabel: string;
  addLabel: string;
  settings: WorkspaceColorSetting[];
  busy: boolean;
  defaults: Record<string, { backgroundColor: string; fontColor: string }>;
  onAdd: (values: ColorValues) => Promise<void>;
  onSave: (setting: WorkspaceColorSetting, values: ColorValues) => Promise<void>;
  onDelete: (setting: WorkspaceColorSetting) => Promise<void>;
};

function normalizeHex(value: string, fallback: string) {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toUpperCase();
  return fallback;
}

function defaultFor(label: string, defaults: ColorSettingsListProps["defaults"]) {
  return defaults[label.trim().toUpperCase()] || { backgroundColor: "#EFF5F6", fontColor: "#163666" };
}

export default function ColorSettingsList({
  eyebrow,
  title,
  emptyLabel,
  addLabel,
  settings,
  busy,
  defaults,
  onAdd,
  onSave,
  onDelete,
}: ColorSettingsListProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<ColorValues>({ label: "", backgroundColor: "#EFF5F6", fontColor: "#163666" });
  const [newValues, setNewValues] = useState<ColorValues>({ label: "", backgroundColor: "#EFF5F6", fontColor: "#163666" });

  useEffect(() => {
    if (editingRow && !settings.some((setting) => setting.rowNumber === editingRow)) setEditingRow(null);
  }, [editingRow, settings]);

  function getColors(setting: WorkspaceColorSetting) {
    const fallback = defaultFor(setting.label, defaults);
    return {
      backgroundColor: normalizeHex(setting.backgroundColor, fallback.backgroundColor),
      fontColor: normalizeHex(setting.fontColor, fallback.fontColor),
    };
  }

  function startEdit(setting: WorkspaceColorSetting) {
    const colors = getColors(setting);
    setEditingRow(setting.rowNumber);
    setEditValues({ label: setting.label, ...colors });
  }

  async function addSetting() {
    const label = newValues.label.trim();
    if (!label) return;
    const fallback = defaultFor(label, defaults);
    await onAdd({
      label,
      backgroundColor: normalizeHex(newValues.backgroundColor, fallback.backgroundColor),
      fontColor: normalizeHex(newValues.fontColor, fallback.fontColor),
    });
    setNewValues({ label: "", backgroundColor: "#EFF5F6", fontColor: "#163666" });
  }

  return (
    <section className="workspace-card workspace-card--colors">
      <header className="workspace-card__header">
        <div className="workspace-card__icon"><Palette aria-hidden="true" /></div>
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span className="workspace-card__count">{settings.length}</span>
      </header>

      <div className="workspace-color-list">
        {settings.map((setting) => {
          const colors = getColors(setting);
          const editing = editingRow === setting.rowNumber;
          return (
            <article className="workspace-color-row" key={setting.rowNumber} data-editing={editing ? "true" : "false"}>
              {editing ? (
                <div className="workspace-color-edit">
                  <label className="workspace-field workspace-field--wide">
                    <span>Label</span>
                    <input value={editValues.label} onChange={(event) => setEditValues({ ...editValues, label: event.target.value })} />
                  </label>
                  <label className="workspace-color-field">
                    <span>Background</span>
                    <div>
                      <input type="color" value={editValues.backgroundColor} onChange={(event) => setEditValues({ ...editValues, backgroundColor: event.target.value.toUpperCase() })} />
                      <input value={editValues.backgroundColor} onChange={(event) => setEditValues({ ...editValues, backgroundColor: event.target.value })} />
                    </div>
                  </label>
                  <label className="workspace-color-field">
                    <span>Font</span>
                    <div>
                      <input type="color" value={editValues.fontColor} onChange={(event) => setEditValues({ ...editValues, fontColor: event.target.value.toUpperCase() })} />
                      <input value={editValues.fontColor} onChange={(event) => setEditValues({ ...editValues, fontColor: event.target.value })} />
                    </div>
                  </label>
                  <div className="workspace-row-actions workspace-row-actions--color">
                    <button
                      className="workspace-icon-button"
                      type="button"
                      disabled={busy || !editValues.label.trim()}
                      onClick={async () => {
                        const fallback = defaultFor(editValues.label, defaults);
                        await onSave(setting, {
                          label: editValues.label.trim(),
                          backgroundColor: normalizeHex(editValues.backgroundColor, fallback.backgroundColor),
                          fontColor: normalizeHex(editValues.fontColor, fallback.fontColor),
                        });
                        setEditingRow(null);
                      }}
                      aria-label={`Save ${setting.label}`}
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
                  <div className="workspace-color-preview" style={{ backgroundColor: colors.backgroundColor, color: colors.fontColor }}>
                    {setting.label}
                  </div>
                  <div className="workspace-color-values">
                    <span>{colors.backgroundColor}</span>
                    <span>{colors.fontColor}</span>
                  </div>
                  <div className="workspace-row-actions">
                    <button className="workspace-icon-button" type="button" disabled={busy} onClick={() => startEdit(setting)} aria-label={`Edit ${setting.label}`}>
                      <Pencil aria-hidden="true" />
                    </button>
                    <button className="workspace-icon-button workspace-icon-button--danger" type="button" disabled={busy} onClick={() => onDelete(setting)} aria-label={`Delete ${setting.label}`}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
        {!settings.length ? <div className="workspace-empty-row">{emptyLabel}</div> : null}
      </div>

      <div className="workspace-add-block workspace-add-block--colors">
        <div className="workspace-add-block__title">
          <Plus aria-hidden="true" />
          <span>{addLabel}</span>
        </div>
        <label className="workspace-field workspace-field--wide">
          <span>Label</span>
          <input value={newValues.label} onChange={(event) => setNewValues({ ...newValues, label: event.target.value })} placeholder="Label" />
        </label>
        <div className="workspace-color-new-grid">
          <label className="workspace-color-field">
            <span>Background</span>
            <div>
              <input type="color" value={newValues.backgroundColor} onChange={(event) => setNewValues({ ...newValues, backgroundColor: event.target.value.toUpperCase() })} />
              <input value={newValues.backgroundColor} onChange={(event) => setNewValues({ ...newValues, backgroundColor: event.target.value })} />
            </div>
          </label>
          <label className="workspace-color-field">
            <span>Font</span>
            <div>
              <input type="color" value={newValues.fontColor} onChange={(event) => setNewValues({ ...newValues, fontColor: event.target.value.toUpperCase() })} />
              <input value={newValues.fontColor} onChange={(event) => setNewValues({ ...newValues, fontColor: event.target.value })} />
            </div>
          </label>
        </div>
        <button className="workspace-button workspace-button--primary workspace-button--full" type="button" disabled={busy || !newValues.label.trim()} onClick={addSetting}>
          <Plus aria-hidden="true" />
          {addLabel}
        </button>
      </div>
    </section>
  );
}
