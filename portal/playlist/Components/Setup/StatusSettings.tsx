"use client";

import type { WorkspaceColorSetting } from "../../app/lib/google-sheets";
import ColorSettingsList from "./ColorSettingsList";

const STATUS_DEFAULTS = {
  "NOT STARTED": { backgroundColor: "#EFF5F6", fontColor: "#163666" },
  "IN-PROGRESS": { backgroundColor: "#00A6B6", fontColor: "#FFFFFF" },
  WAITING: { backgroundColor: "#FACA78", fontColor: "#E05047" },
  "ON-HOLD": { backgroundColor: "#B2D3DE", fontColor: "#163666" },
  COMPLETED: { backgroundColor: "#163666", fontColor: "#B2D3DE" },
  "FUTURE TBD": { backgroundColor: "#8E456A", fontColor: "#F37D59" },
  SKIPPED: { backgroundColor: "#E05047", fontColor: "#B2D3DE" },
};

type ColorValues = { label: string; backgroundColor: string; fontColor: string };

type StatusSettingsProps = {
  settings: WorkspaceColorSetting[];
  busy: boolean;
  onAdd: (values: ColorValues) => Promise<void>;
  onSave: (setting: WorkspaceColorSetting, values: ColorValues) => Promise<void>;
  onDelete: (setting: WorkspaceColorSetting) => Promise<void>;
};

export default function StatusSettings(props: StatusSettingsProps) {
  return (
    <ColorSettingsList
      eyebrow="Workflow States"
      title="Status Colors"
      emptyLabel="No status colors mapped"
      addLabel="Add Status Color"
      defaults={STATUS_DEFAULTS}
      {...props}
    />
  );
}
