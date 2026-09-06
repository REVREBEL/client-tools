"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import dashboardSource from "../dashboard.jsx?raw";
import channelDashboardSource from "../channel-dashboard.jsx?raw";
import authShellSource from "../auth-shell.tsx?raw";
import clerkAuthSource from "../clerk-auth.ts?raw";
import globalsSource from "../globals.css?raw";
import googleSheetsSource from "../lib/google-sheets.ts?raw";
import loadSheetSource from "../lib/load-sheet.ts?raw";
import layoutSource from "../layout.tsx?raw";
import pageSource from "../page.tsx?raw";
import permissionsSource from "../permissions.ts?raw";
import requestAccessSource from "../request-access/[[...request-access]]/page.tsx?raw";
import signInSource from "../sign-in/[[...sign-in]]/page.tsx?raw";
import signUpSource from "../sign-up/[[...sign-up]]/page.tsx?raw";
import sheetRouteSource from "../api/sheet/route.ts?raw";
import sheetDashboardSource from "../sheet-dashboard.tsx?raw";
import proxySource from "../../proxy.ts?raw";

const FILES = [
  { name: "app/sheet-dashboard.tsx", source: sheetDashboardSource },
  { name: "app/api/sheet/route.ts", source: sheetRouteSource },
  { name: "app/lib/google-sheets.ts", source: googleSheetsSource },
  { name: "app/lib/load-sheet.ts", source: loadSheetSource },
  { name: "app/dashboard.jsx", source: dashboardSource },
  { name: "app/channel-dashboard.jsx", source: channelDashboardSource },
  { name: "app/page.tsx", source: pageSource },
  { name: "app/layout.tsx", source: layoutSource },
  { name: "app/auth-shell.tsx", source: authShellSource },
  { name: "app/clerk-auth.ts", source: clerkAuthSource },
  { name: "app/permissions.ts", source: permissionsSource },
  { name: "app/sign-in/[[...sign-in]]/page.tsx", source: signInSource },
  { name: "app/sign-up/[[...sign-up]]/page.tsx", source: signUpSource },
  { name: "app/request-access/[[...request-access]]/page.tsx", source: requestAccessSource },
  { name: "proxy.ts", source: proxySource },
  { name: "app/globals.css", source: globalsSource },
];

const storageKey = (name: string) => `segment-dashboard-code-draft:${name}`;

export default function CodeCanvas() {
  const [activeName, setActiveName] = useState(FILES[0].name);
  const activeFile = useMemo(() => FILES.find((file) => file.name === activeName) || FILES[0], [activeName]);

  return (
    <main className="code-canvas">
      <header className="code-canvas__header">
        <div>
          <p className="code-canvas__eyebrow">SEGMENT METRICS DASHBOARD</p>
          <h1>Code Canvas</h1>
          <p>View the published source and prepare browser-local edits before they are reviewed and deployed.</p>
        </div>
        <Link href="/" className="code-canvas__back">Back to dashboard</Link>
      </header>

      <aside className="code-canvas__publish-note" aria-label="How to publish Code Canvas changes">
        <div>
          <span>LOCAL DRAFT ONLY</span>
          <strong>Saving here does not update the live dashboard.</strong>
        </div>
        <p>
          To make a change live, select <b>Copy publish request</b> and paste it into the ChatGPT
          conversation that manages this site. The change can then be validated and deployed as a new version.
        </p>
      </aside>

      <section className="code-canvas__workspace">
        <nav className="code-canvas__files" aria-label="Source files">
          <span>Source files</span>
          {FILES.map((file) => (
            <button
              type="button"
              className={file.name === activeFile.name ? "is-active" : ""}
              key={file.name}
              onClick={() => setActiveName(file.name)}
            >
              {file.name}
            </button>
          ))}
        </nav>

        <CodeEditor key={activeFile.name} activeFile={activeFile} />
      </section>
    </main>
  );
}

function CodeEditor({ activeFile }: { activeFile: (typeof FILES)[number] }) {
  const [draft, setDraft] = useState(() =>
    typeof window === "undefined"
      ? activeFile.source
      : window.localStorage.getItem(storageKey(activeFile.name)) ?? activeFile.source,
  );
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const saveDraft = () => {
    window.localStorage.setItem(storageKey(activeFile.name), draft);
    setSaved(true);
  };

  const resetDraft = () => {
    window.localStorage.removeItem(storageKey(activeFile.name));
    setDraft(activeFile.source);
    setSaved(false);
  };

  const downloadDraft = () => {
    const blob = new Blob([draft], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeFile.name.split("/").at(-1) || "source.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyPublishRequest = async () => {
    const extension = activeFile.name.split(".").at(-1) || "text";
    const request = [
      `Update ${activeFile.name} with this Code Canvas draft, validate the site, and publish it live:`,
      "",
      `\`\`\`${extension}`,
      draft,
      "```",
    ].join("\n");

    await navigator.clipboard.writeText(request);
    setCopied(true);
  };

  return (
    <div className="code-canvas__editor">
          <div className="code-canvas__toolbar">
            <strong>{activeFile.name}</strong>
            <div>
              <button type="button" onClick={resetDraft}>Reset to live</button>
              <button type="button" onClick={() => void navigator.clipboard.writeText(draft)}>Copy code</button>
              <button type="button" onClick={downloadDraft}>Download</button>
              <button type="button" onClick={saveDraft}>{saved ? "Saved locally" : "Save local draft"}</button>
              <button type="button" className="is-primary" onClick={() => void copyPublishRequest()}>
                {copied ? "Request copied" : "Copy publish request"}
              </button>
            </div>
          </div>
          <p className="code-canvas__editor-status" aria-live="polite">
            {copied
              ? "Publish request copied. Paste it into the ChatGPT conversation for this site."
              : saved
                ? "Draft saved in this browser. It is not live."
                : "Editing a local draft. The live dashboard is unchanged."}
          </p>
          <textarea
            aria-label={`Editing ${activeFile.name}`}
            spellCheck={false}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaved(false);
              setCopied(false);
            }}
          />
    </div>
  );
}
