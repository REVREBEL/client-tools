import SheetDashboard from "./sheet-dashboard";
import { getConfiguredMetricsSheetConfig } from "./lib/google-sheets";
import { loadInitialSheetData } from "./lib/load-sheet";

export const dynamic = "force-dynamic";

export default async function Home() {
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
}
