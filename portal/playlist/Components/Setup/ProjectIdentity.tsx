"use client";

import { ExternalLink, FileText, Save } from "lucide-react";
import { useEffect, useState } from "react";

type ProjectIdentityProps = {
  projectName: string;
  dashboardUrl: string;
  busy: boolean;
  onSave: (projectName: string, dashboardUrl: string) => Promise<void>;
};

export default function ProjectIdentity({ projectName, dashboardUrl, busy, onSave }: ProjectIdentityProps) {
  const [name, setName] = useState(projectName);
  const [url, setUrl] = useState(dashboardUrl);

  useEffect(() => setName(projectName), [projectName]);
  useEffect(() => setUrl(dashboardUrl), [dashboardUrl]);

  const dirty = name !== projectName || url !== dashboardUrl;

  return (
    <section className="workspace-card" aria-labelledby="workspace-project-heading">
      <header className="workspace-card__header">
        <div className="workspace-card__icon"><FileText aria-hidden="true" /></div>
        <div>
          <p>Global Parameters</p>
          <h2 id="workspace-project-heading">Project Identity</h2>
        </div>
      </header>

      <div className="workspace-form-grid">
        <label className="workspace-field workspace-field--wide">
          <span>Project Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" />
        </label>

        <label className="workspace-field workspace-field--wide">
          <span>Dashboard URL</span>
          <div className="workspace-input-action">
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" inputMode="url" />
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" aria-label="Open dashboard URL">
                <ExternalLink aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </label>
      </div>

      <div className="workspace-card__footer">
        <p>Used by Playlist emails, summaries, and project links.</p>
        <button
          className="workspace-button workspace-button--primary"
          type="button"
          disabled={busy || !dirty || !name.trim()}
          onClick={() => onSave(name.trim(), url.trim())}
        >
          <Save aria-hidden="true" />
          Save Project
        </button>
      </div>
    </section>
  );
}
