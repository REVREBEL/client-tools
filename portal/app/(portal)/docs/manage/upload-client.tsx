"use client";

import { FormEvent, useState } from "react";

type UploadResult = {
  key: string;
  sourceRef: string;
  href: string;
  size: number;
  contentType: string;
};

type MigrationResult = {
  folder: "resources" | "photos";
  imported: Array<{ fileName: string; key: string; bytes: number }>;
  failed: Array<{ fileName: string; error: string }>;
  done: boolean;
  nextOffset: number | null;
  total: number;
  error?: string;
};

export default function DocsUploadClient() {
  const [folder, setFolder] = useState("resources");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [migration, setMigration] = useState<{ folder: string; imported: number; total: number; failed: string[] } | null>(null);
  const [migrating, setMigrating] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      formData.set("folder", folder);
      const response = await fetch("/api/docs/upload", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => null)) as (UploadResult & { error?: string }) | null;
      if (!response.ok || !payload) throw new Error(payload?.error || "The upload failed.");
      setResult(payload);
      form.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copySourceRef() {
    if (!result) return;
    await navigator.clipboard.writeText(result.sourceRef);
    setCopied(true);
  }

  async function migrateExisting(target: "resources" | "photos") {
    setMigrating(true);
    setError("");
    setMigration({ folder: target, imported: 0, total: 0, failed: [] });
    let offset = 0;
    let imported = 0;
    let total = 0;
    const failed: string[] = [];

    try {
      while (true) {
        const response = await fetch("/api/docs/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: target, offset }),
        });
        const payload = (await response.json().catch(() => null)) as MigrationResult | null;
        if (!response.ok || !payload) throw new Error(payload?.error || "The migration failed.");

        imported += payload.imported.length;
        total = payload.total;
        failed.push(...payload.failed.map((item) => `${item.fileName}: ${item.error}`));
        setMigration({ folder: target, imported, total, failed: [...failed] });

        if (payload.done || payload.nextOffset === null) break;
        offset = payload.nextOffset;
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The migration failed.");
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <section style={{ padding: 28, background: "#fff", border: "2px solid #163666" }}>
        <p style={{ margin: "0 0 8px", color: "#047c97", fontFamily: "Khand, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
          One-time migration
        </p>
        <h2 style={{ margin: "0 0 12px", fontFamily: "Khand, sans-serif", fontSize: 36, lineHeight: 1, textTransform: "uppercase" }}>Import the files already in GitHub</h2>
        <p style={{ margin: "0 0 20px", lineHeight: 1.6, color: "rgba(22,54,102,.72)" }}>
          These actions copy the current PDFs or gallery images from the repository into Webflow Object Storage in small batches. They are safe to rerun and replace the same storage keys.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" disabled={migrating} onClick={() => void migrateExisting("resources")} style={actionButtonStyle}>
            Import Existing PDFs
          </button>
          <button type="button" disabled={migrating} onClick={() => void migrateExisting("photos")} style={secondaryButtonStyle}>
            Import Existing Photos
          </button>
        </div>
        {migration && (
          <div style={{ marginTop: 18, padding: 16, background: "#eff5f6", border: "1px solid #163666" }}>
            <strong style={{ fontFamily: "Khand, sans-serif", textTransform: "uppercase" }}>
              {migrating ? "Importing" : "Import complete"}: {migration.folder}
            </strong>
            <div style={{ marginTop: 5 }}>{migration.imported} of {migration.total || "…"} files copied.</div>
            {migration.failed.length > 0 && <div style={{ marginTop: 7, color: "#e05047" }}>{migration.failed.length} file(s) need attention.</div>}
          </div>
        )}
      </section>

      <form onSubmit={submit} style={{ display: "grid", gap: 18, padding: 28, background: "#fff", border: "2px solid #163666" }}>
        <div style={{ display: "grid", gap: 7 }}>
          <label htmlFor="docs-upload-folder" style={labelStyle}>Storage Folder</label>
          <select id="docs-upload-folder" value={folder} onChange={(event) => setFolder(event.target.value)} style={inputStyle}>
            <option value="resources">Resources / PDFs</option>
            <option value="photos">Photos / Images</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 7 }}>
          <label htmlFor="docs-upload-file" style={labelStyle}>PDF or Image</label>
          <input id="docs-upload-file" name="file" type="file" accept="application/pdf,image/*" required style={{ ...inputStyle, padding: 12 }} />
          <span style={{ fontSize: 12, color: "rgba(22,54,102,.65)" }}>Maximum file size: 25 MB.</span>
        </div>

        <button type="submit" disabled={busy || migrating} style={actionButtonStyle}>
          {busy ? "Uploading…" : "Upload to Client Storage"}
        </button>
      </form>

      {error && <div role="alert" style={{ padding: 18, border: "2px solid #e05047", background: "#fff", color: "#e05047" }}>{error}</div>}

      {result && (
        <section style={{ padding: 28, background: "#faca78", border: "2px solid #163666" }}>
          <p style={{ margin: "0 0 7px", fontFamily: "Khand, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Upload Complete</p>
          <h2 style={{ margin: "0 0 14px", fontFamily: "Khand, sans-serif", fontSize: 36, lineHeight: 1, textTransform: "uppercase" }}>Connect it to the Resource Sheet</h2>
          <p style={{ margin: "0 0 18px", lineHeight: 1.55 }}>
            Paste this storage reference into the Resource URL field for the corresponding row. Docs Hub turns it into an authenticated file URL automatically.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10 }}>
            <code style={{ padding: "14px 16px", overflowWrap: "anywhere", background: "#fff", border: "1px solid #163666" }}>{result.sourceRef}</code>
            <button type="button" onClick={() => void copySourceRef()} style={actionButtonStyle}>{copied ? "Copied" : "Copy"}</button>
          </div>
        </section>
      )}
    </div>
  );
}

const labelStyle = {
  fontFamily: "Khand, sans-serif",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: ".08em",
};

const inputStyle = {
  minHeight: 48,
  padding: "0 14px",
  border: "2px solid #163666",
  borderRadius: 0,
  background: "#fff",
  color: "#163666",
};

const actionButtonStyle = {
  minHeight: 50,
  padding: "0 20px",
  border: "2px solid #163666",
  borderRadius: 0,
  background: "#163666",
  color: "#b2d3de",
  fontFamily: "Khand, sans-serif",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: ".08em",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...actionButtonStyle,
  background: "#fff",
  color: "#163666",
};
