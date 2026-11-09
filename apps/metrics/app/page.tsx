import SheetDashboard from "./sheet-dashboard";
import { getConfiguredMetricsSheetConfig } from "./lib/google-sheets";
import { loadInitialSheetData } from "./lib/load-sheet";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const config = getConfiguredMetricsSheetConfig();
    const initial = await loadInitialSheetData();

    return (
      <SheetDashboard
        defaultConnection={{ url: config.sheetUrl, gid: config.segmentGid }}
        sourceDatasetGid={config.sourceGid}
        initialData={initial.rows}
        initialRowCount={initial.rowCount}
        initialSyncedAt={initial.syncedAt}
        initialSourceData={initial.sourceRows}
        initialSourceRowCount={initial.sourceRowCount}
        initialChannelData={initial.channelRows}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The Metrics data connection could not be initialized.";

    console.error("[Metrics] Initial server render failed:", error);

    return (
      <main className="sheet-gate">
        <div className="sheet-gate__mark">REVREBEL.</div>
        <p className="sheet-gate__eyebrow">METRIC SEGMENTS · NOW NOW NOHO</p>
        <h1>DATA CONNECTION ERROR</h1>
        <p className="sheet-gate__message">{message}</p>
      </main>
    );
  }
}
