"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OrganizationSwitcher,
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Dashboard from "./dashboard";
import ChannelDashboard from "./channel-dashboard";
import {
  CODE_EDITOR_PERMISSION,
  CODE_EDITOR_PERMISSION_UNSCOPED,
  GOOGLE_SHEET_URL_PERMISSION,
  GOOGLE_SHEET_URL_PERMISSION_UNSCOPED,
} from "./permissions";

type SheetRow = { index_: number; row: (string | number)[] };

type SheetConnection = {
  url: string;
  gid: string;
  range?: string;
};

const STORAGE_KEY = "revrebel-segment-dashboard-sheet";
const DEFAULT_CONNECTION: SheetConnection = {
  url: "https://docs.google.com/spreadsheets/d/1MD-PF0GScwSG3m9wTwAzTHjl2kownwFNEppz3VmuyK0/edit",
  gid: "1941800013",
};
const SOURCE_DATASET_GID = "1319180770";

export default function SheetDashboard({
  initialData = [],
  initialRowCount = 0,
  initialSyncedAt = null,
  initialSourceData = [],
  initialSourceRowCount = 0,
  initialChannelData = [],
}: {
  initialData?: SheetRow[];
  initialRowCount?: number;
  initialSyncedAt?: string | null;
  initialSourceData?: SheetRow[];
  initialSourceRowCount?: number;
  initialChannelData?: SheetRow[];
}) {
  const hasInitialData = initialData.length >= 3;
  const [data, setData] = useState<SheetRow[]>(initialData);
  const [sourceData, setSourceData] = useState<SheetRow[]>(initialSourceData);
  const [channelData, setChannelData] = useState<SheetRow[]>(initialChannelData);
  const [dashboardMode, setDashboardMode] = useState<"segments" | "channels">("segments");
  const [connection, setConnection] = useState<SheetConnection | null>(DEFAULT_CONNECTION);
  const [draftUrl, setDraftUrl] = useState(DEFAULT_CONNECTION.url);
  const [draftGid, setDraftGid] = useState(DEFAULT_CONNECTION.gid);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(
    initialSyncedAt ? new Date(initialSyncedAt) : null,
  );
  const [source, setSource] = useState<"loading" | "sheet">(
    hasInitialData ? "sheet" : "loading",
  );
  const [rowCount, setRowCount] = useState(initialRowCount || initialData.length);
  const [sourceRowCount, setSourceRowCount] = useState(
    initialSourceRowCount || initialSourceData.length,
  );

  const loadSheet = useCallback(async (active: SheetConnection | null) => {
    setIsLoading(true);
    setError("");

    try {
      if (!active) throw new Error("No Google Sheet is configured.");

      const loadTab = async (connection: SheetConnection) => {
        const query =
          `?url=${encodeURIComponent(connection.url)}` +
          `&gid=${encodeURIComponent(connection.gid || "0")}` +
          `${connection.range ? `&range=${encodeURIComponent(connection.range)}` : ""}` +
          `&refresh=${Date.now()}`;
        const response = await fetch(`/api/sheet${query}`, { cache: "no-store" });

        if (!response.ok) {
          const detail = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(detail?.error || "The secure Google Sheet connection could not be loaded.");
        }

        return (await response.json()) as {
          rows?: SheetRow[];
          rowCount?: number;
          syncedAt?: string;
        };
      };

      const [segmentResult, sourceResult] = await Promise.all([
        loadTab(active),
        loadTab({ ...active, gid: SOURCE_DATASET_GID }),
      ]);

      if (!segmentResult.rows || segmentResult.rows.length < 3) {
        throw new Error("The segment_dataset tab loaded, but it does not contain dashboard rows.");
      }
      const segmentHeaders =
        segmentResult.rows[0]?.row.map((value) => String(value).toLowerCase()) || [];
      if (!segmentHeaders.includes("segment_year") || !segmentHeaders.includes("segment_revenue")) {
        throw new Error("The selected tab does not contain the segment dashboard fields.");
      }

      if (!sourceResult.rows || sourceResult.rows.length < 3) {
        throw new Error("The source_dataset tab loaded, but it does not contain dashboard rows.");
      }
      const sourceHeaders =
        sourceResult.rows[0]?.row.map((value) => String(value).toLowerCase()) || [];
      if (
        !sourceHeaders.includes("profile_metric_type") ||
        !sourceHeaders.includes("profile_profile_type") ||
        !sourceHeaders.includes("profile_pct_reservations")
      ) {
        throw new Error("The source_dataset tab does not contain the guest profile fields.");
      }

      const channelHeaders =
        sourceResult.rows[0]?.row.map((value) => String(value).toLowerCase()) || [];
      if (
        !channelHeaders.includes("channel_year") ||
        !channelHeaders.includes("channel_metric") ||
        !channelHeaders.includes("channel_revenue")
      ) {
        throw new Error("The source_dataset tab does not contain the channel dashboard fields.");
      }

      setData(segmentResult.rows);
      setSourceData(sourceResult.rows);
      setChannelData(sourceResult.rows);
      setSource("sheet");
      setRowCount(segmentResult.rowCount || segmentResult.rows.length);
      setSourceRowCount(sourceResult.rowCount || sourceResult.rows.length);
      setLastSync(segmentResult.syncedAt ? new Date(segmentResult.syncedAt) : new Date());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The Sheet could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setConnection(DEFAULT_CONNECTION);
      setDraftUrl(DEFAULT_CONNECTION.url);
      setDraftGid(DEFAULT_CONNECTION.gid);
      void loadSheet(DEFAULT_CONNECTION);
    });
  }, [loadSheet]);

  const statusText = useMemo(() => {
    if (isLoading) return "SYNCING";
    if (source === "sheet") {
      const time = lastSync?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const totalRows = rowCount + sourceRowCount;
      return `LIVE · 2 TABS · ${totalRows.toLocaleString()} ROWS${time ? ` · ${time}` : ""}`;
    }
    return "CONNECTING";
  }, [isLoading, lastSync, rowCount, source, sourceRowCount]);

  const connect = async () => {
    if (!draftUrl.trim()) {
      setError("Paste the Google Sheet URL to connect it.");
      return;
    }

    const nextConnection = { url: draftUrl.trim(), gid: draftGid.trim() || "0" };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConnection));
    setConnection(nextConnection);
    await loadSheet(nextConnection);
    setIsOpen(false);
  };

  const disconnect = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setConnection(DEFAULT_CONNECTION);
    setDraftUrl(DEFAULT_CONNECTION.url);
    setDraftGid(DEFAULT_CONNECTION.gid);
    setLastSync(null);
    setError("");
    setIsOpen(false);
    void loadSheet(DEFAULT_CONNECTION);
  };

  if (data.length === 0) {
    return (
      <main className="sheet-gate">
        <div className="sheet-gate__mark">REVREBEL.</div>
        <p className="sheet-gate__eyebrow">METRIC SEGMENTS · NOW NOW NOHO</p>
        <h1>{error ? "DATA CONNECTION ERROR" : "LOADING LIVE METRICS"}</h1>
        <p className="sheet-gate__message">
          {error || "Reading segment_dataset and source_dataset from Google Sheets…"}
        </p>
        {error ? (
          <button type="button" className="sheet-button sheet-button--primary" onClick={() => void loadSheet(DEFAULT_CONNECTION)}>
            Retry Sheet
          </button>
        ) : (
          <div className="sheet-gate__progress" aria-label="Loading Google Sheet">
            <span />
          </div>
        )}
      </main>
    );
  }

  return (
    <>
      <nav className="dashboard-mode-nav" aria-label="Dashboard views">
        <div className="dashboard-mode-nav__inner">
          <span>METRICS</span>
          <div className="dashboard-mode-nav__actions">
            <div className="dashboard-mode-nav__tabs">
              <button
                type="button"
                className={dashboardMode === "segments" ? "is-active" : ""}
                aria-current={dashboardMode === "segments" ? "page" : undefined}
                onClick={() => setDashboardMode("segments")}
              >
                Segments
              </button>
              <button
                type="button"
                className={dashboardMode === "channels" ? "is-active" : ""}
                aria-current={dashboardMode === "channels" ? "page" : undefined}
                onClick={() => setDashboardMode("channels")}
              >
                Channels
              </button>
            </div>
            <div className="dashboard-mode-nav__account">
              <Show when="signed-out">
                <SignInButton mode="redirect">
                  <button type="button">Sign In</button>
                </SignInButton>
                <Link href="/request-access">Request Access</Link>
              </Show>
              <Show when="signed-in">
                <OrganizationSwitcher
                  hidePersonal
                  afterSelectOrganizationUrl="/"
                  appearance={{
                    elements: {
                      rootBox: { display: "flex", alignItems: "center" },
                      organizationSwitcherTrigger: {
                        color: "#f4fbfd",
                        minHeight: "30px",
                      },
                      organizationSwitcherTriggerIcon: {
                        color: "#f4fbfd",
                      },
                      organizationPreviewTextContainer: {
                        color: "#f4fbfd",
                      },
                      organizationPreviewMainIdentifier: {
                        color: "#f4fbfd",
                      },
                      organizationPreviewSecondaryIdentifier: {
                        color: "#b2d3de",
                      },
                    },
                  }}
                />
                <UserButton
                  userProfileMode="navigation"
                  userProfileUrl="https://accounts.revrebel.io/user"
                  appearance={{
                    elements: {
                      avatarBox: { width: "30px", height: "30px" },
                    },
                  }}
                />
              </Show>
            </div>
          </div>
        </div>
      </nav>

      {dashboardMode === "segments" ? (
        <Dashboard data={data} sourceData={data} />
      ) : (
        <ChannelDashboard data={channelData} metadataData={data} profileData={sourceData} />
      )}

      <div className="sheet-controls" aria-live="polite">
        <span className={`sheet-status sheet-status--${source}`}>
          <span className="sheet-status__dot" />
          {statusText}
        </span>
        <button
          type="button"
          className="sheet-action"
          onClick={() => {
            if (connection) void loadSheet(connection);
            else setIsOpen(true);
          }}
          disabled={isLoading}
        >
          {connection ? "Refresh Sheet" : "Connect Google Sheet"}
        </button>
        {connection && (
          <Show
            when={(has) =>
              has({ permission: GOOGLE_SHEET_URL_PERMISSION }) ||
              has({ permission: GOOGLE_SHEET_URL_PERMISSION_UNSCOPED })
            }
          >
            <div className="sheet-admin-controls">
              <button type="button" className="sheet-settings" onClick={() => setIsOpen(true)} aria-label="Open Sheet settings">
                Settings
              </button>
            </div>
          </Show>
        )}
        <Show
          when={(has) =>
            has({ permission: CODE_EDITOR_PERMISSION }) ||
            has({ permission: CODE_EDITOR_PERMISSION_UNSCOPED })
          }
        >
          <div className="sheet-admin-controls">
            <Link className="sheet-settings sheet-code-link" href="/code">
              Code Canvas
            </Link>
          </div>
        </Show>
      </div>

      {error && <div className="sheet-error">{error}</div>}

      {isOpen && (
        <div className="sheet-modal" role="dialog" aria-modal="true" aria-labelledby="sheet-dialog-title">
          <button className="sheet-modal__backdrop" type="button" onClick={() => setIsOpen(false)} aria-label="Close settings" />
          <section className="sheet-modal__card">
            <p className="sheet-modal__eyebrow">LIVE DATA SOURCE</p>
            <h2 id="sheet-dialog-title">Connect Google Sheets</h2>
            <p className="sheet-modal__intro">
              The dashboard reads this Sheet securely through its Google service account. The
              matching source_dataset tab is connected automatically, and the Sheet does not need
              public link access.
            </p>

            <label htmlFor="sheet-url">Google Sheet URL</label>
            <input
              id="sheet-url"
              type="url"
              value={draftUrl}
              onChange={(event) => setDraftUrl(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />

            <label htmlFor="sheet-gid">Segment Dataset GID</label>
            <input
              id="sheet-gid"
              inputMode="numeric"
              value={draftGid}
              onChange={(event) => setDraftGid(event.target.value)}
              placeholder="0"
            />
            <p className="sheet-modal__hint">
              The source_dataset tab uses GID {SOURCE_DATASET_GID}.
            </p>

            {error && <p className="sheet-modal__error">{error}</p>}

            <div className="sheet-modal__actions">
              {connection && (
                <button type="button" className="sheet-button sheet-button--secondary" onClick={disconnect}>
                  Reset Default Sheet
                </button>
              )}
              <button type="button" className="sheet-button sheet-button--ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="sheet-button sheet-button--primary" onClick={() => void connect()} disabled={isLoading}>
                {isLoading ? "Connecting…" : "Connect Sheet"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
