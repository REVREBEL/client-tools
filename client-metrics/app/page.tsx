import SheetDashboard from "./sheet-dashboard";
import { loadInitialSheetData } from "./lib/load-sheet";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await loadInitialSheetData();
  return (
    <SheetDashboard
      initialData={initial.rows}
      initialRowCount={initial.rowCount}
      initialSyncedAt={initial.syncedAt}
      initialSourceData={initial.sourceRows}
      initialSourceRowCount={initial.sourceRowCount}
      initialChannelData={initial.channelRows}
    />
  );
}
