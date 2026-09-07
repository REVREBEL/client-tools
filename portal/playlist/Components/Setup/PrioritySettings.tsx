"use client";

import type { WorkspaceColorSetting } from "../../app/lib/google-sheets";
import ColorSettingsList from "./ColorSettingsList";

const PRIORITY_DEFAULTS = {
  HIGH: { backgroundColor: "#E05047", fontColor: "#FFFFFF" },
  MEDIUM: { backgroundColor: "#FACA78", fontColor: "#163666" },
  LOW: { backgroundColor: "#B2D3DE", fontColor: "#163666" },
};

type ColorValues = { label: string; backgroundColor: string; fontColor: string };

type PrioritySettingsProps = {
  settings: WorkspaceColorSetting[];
  busy: boolean;
  onAdd: (values: ColorValues) => Promise<void>;
  onSave: (setting: WorkspaceColorSetting, values: ColorValues) => Promise<void>;
  onDelete: (setting: WorkspaceColorSetting) => Promise<void>;
};

export default function PrioritySettings(props: PrioritySettingsProps) {
  return (
    <ColorSettingsList
      eyebrow="Task Importance"
      title="Priority Colors"
      emptyLabel="No priority colors mapped"
      addLabel="Add Priority Color"
      defaults={PRIORITY_DEFAULTS}
      {...props}
    />
  );
}
