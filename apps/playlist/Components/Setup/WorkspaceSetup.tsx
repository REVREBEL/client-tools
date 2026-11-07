"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  WorkspaceColorSetting,
  WorkspaceSetupData,
  WorkspaceTeamMember,
} from "../../app/lib/google-sheets";
import PlaylistHeader from "../Playlist/PlaylistHeader";
import PrioritySettings from "./PrioritySettings";
import ProjectIdentity from "./ProjectIdentity";
import StatusSettings from "./StatusSettings";
import TeamMembers from "./TeamMembers";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type SetupCell = { column: number; value: unknown };
type TeamValues = { fullName: string; email: string; emailOptIn: boolean };
type ColorValues = { label: string; backgroundColor: string; fontColor: string };

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export default function WorkspaceSetup({ data }: { data: WorkspaceSetupData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function updateSetup(rowNumber: number, cells: SetupCell[], successMessage: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`${BASE_PATH}/api/playlist/mutate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateSetupCells", rowNumber, cells }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || `Workspace Setup update failed (${response.status}).`);
      setNotice({ type: "success", message: successMessage });
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Workspace Setup could not be updated.",
      });
      throw error;
    } finally {
      setBusy(false);
    }
  }

  if (!data.configured || data.error) {
    return (
      <main className="playlist-page">
        <section className={`playlist-empty${data.error ? " playlist-empty--error" : ""}`}>
          <p className="playlist-eyebrow">Workspace Setup</p>
          <h1>{data.error ? "Setup connection error" : "Connect the Playlist Sheet"}</h1>
          <p>{data.error || "Workspace Setup uses the Setup tab in the Playlist spreadsheet."}</p>
        </section>
      </main>
    );
  }

  const columns = data.columns;

  async function saveProject(projectName: string, dashboardUrl: string) {
    await updateSetup(2, [{ column: columns.projectName, value: projectName }], "Project identity updated.");
    if (dashboardUrl !== data.dashboardUrl) {
      await updateSetup(5, [{ column: columns.projectName, value: dashboardUrl }], "Project identity updated.");
    }
  }

  function teamCells(values: TeamValues): SetupCell[] {
    const names = splitName(values.fullName);
    return [
      { column: columns.teamFirstName, value: names.firstName },
      { column: columns.teamLastName, value: names.lastName },
      { column: columns.teamFullName, value: values.fullName },
      { column: columns.teamEmail, value: values.email },
      { column: columns.teamEmailOptOut, value: !values.emailOptIn },
    ];
  }

  async function addTeamMember(values: TeamValues) {
    await updateSetup(data.nextTeamRow, teamCells(values), `${values.fullName} added to the project team.`);
  }

  async function saveTeamMember(member: WorkspaceTeamMember, values: TeamValues) {
    await updateSetup(member.rowNumber, teamCells(values), `${values.fullName} updated.`);
  }

  async function deleteTeamMember(member: WorkspaceTeamMember) {
    await updateSetup(
      member.rowNumber,
      [
        { column: columns.teamFirstName, value: "" },
        { column: columns.teamLastName, value: "" },
        { column: columns.teamFullName, value: "" },
        { column: columns.teamEmail, value: "" },
        { column: columns.teamEmailOptOut, value: "" },
      ],
      `${member.fullName} removed from the project team.`,
    );
  }

  function statusCells(values: ColorValues): SetupCell[] {
    return [
      { column: columns.statusName, value: values.label },
      { column: columns.statusBackground, value: values.backgroundColor },
      { column: columns.statusFont, value: values.fontColor },
    ];
  }

  async function addStatus(values: ColorValues) {
    await updateSetup(data.nextStatusRow, statusCells(values), `${values.label} status added.`);
  }

  async function saveStatus(setting: WorkspaceColorSetting, values: ColorValues) {
    await updateSetup(setting.rowNumber, statusCells(values), `${values.label} status updated.`);
  }

  async function deleteStatus(setting: WorkspaceColorSetting) {
    await updateSetup(
      setting.rowNumber,
      [
        { column: columns.statusName, value: "" },
        { column: columns.statusBackground, value: "" },
        { column: columns.statusFont, value: "" },
      ],
      `${setting.label} status removed.`,
    );
  }

  function priorityCells(values: ColorValues): SetupCell[] {
    return [
      { column: columns.priorityName, value: values.label },
      { column: columns.priorityBackground, value: values.backgroundColor },
      { column: columns.priorityFont, value: values.fontColor },
    ];
  }

  async function addPriority(values: ColorValues) {
    await updateSetup(data.nextPriorityRow, priorityCells(values), `${values.label} priority added.`);
  }

  async function savePriority(setting: WorkspaceColorSetting, values: ColorValues) {
    await updateSetup(setting.rowNumber, priorityCells(values), `${values.label} priority updated.`);
  }

  async function deletePriority(setting: WorkspaceColorSetting) {
    await updateSetup(
      setting.rowNumber,
      [
        { column: columns.priorityName, value: "" },
        { column: columns.priorityBackground, value: "" },
        { column: columns.priorityFont, value: "" },
      ],
      `${setting.label} priority removed.`,
    );
  }

  return (
    <main className="playlist-page">
      <div className="playlist-shell">
        <PlaylistHeader
          title="Workspace Setup"
          eyebrow="Global Configuration"
          syncedAt={data.syncedAt}
          rowCount={data.teamMembers.length}
          countLabel="team members"
          active="setup"
        />

        <p className="workspace-setup-intro">
          Manage global parameters, core team members, status color coding, and priorities used throughout The Playlist.
        </p>

        {notice ? (
          <div className="workspace-notice" data-type={notice.type} role="status">
            {notice.type === "success" ? <CheckCircle2 aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
            <span>{notice.message}</span>
          </div>
        ) : null}

        <section className="workspace-setup-grid">
          <div className="workspace-setup-column workspace-setup-column--main">
            <ProjectIdentity projectName={data.projectName} dashboardUrl={data.dashboardUrl} busy={busy} onSave={saveProject} />
            <TeamMembers members={data.teamMembers} busy={busy} onAdd={addTeamMember} onSave={saveTeamMember} onDelete={deleteTeamMember} />
          </div>

          <div className="workspace-setup-column workspace-setup-column--side">
            <StatusSettings settings={data.statuses} busy={busy} onAdd={addStatus} onSave={saveStatus} onDelete={deleteStatus} />
            <PrioritySettings settings={data.priorities} busy={busy} onAdd={addPriority} onSave={savePriority} onDelete={deletePriority} />
          </div>
        </section>
      </div>
    </main>
  );
}
