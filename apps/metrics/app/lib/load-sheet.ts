import {
  getConfiguredMetricsSheetConfig,
  getConfiguredSpreadsheetId,
  loadGoogleSheetValues,
} from "./google-sheets";

export type DashboardRow = {
  index_: number;
  row: (string | number)[];
};

const HEADER_ALIASES: Record<string, string> = {
  dow_month: "dow_stay_month",
  sort_year: "pace_year",
  sort_stay_month: "pace_stay_month",
  sort_metric_type: "pace_metric_type",
  sort_metric: "pace_metric",
  sort_ty_revenue: "pace_ty_revenue",
  sort_stly_revenue: "pace_stly_revenue",
  sort_ty_room_nights: "pace_ty_room_nights",
  sort_stly_room_nights: "pace_stly_room_nights",
  budget_month: "budget_stay_month",
  forecast_month: "forecast_stay_month",
};

function normalizeHeaders(records: string[][]) {
  if (records.length === 0) return records;
  const headers = records[0].map((header) => {
    const clean = header.trim().toLowerCase();
    return HEADER_ALIASES[clean] || clean;
  });
  return [headers, ...records.slice(1)];
}

async function loadSheetTab(gid: string, range = "") {
  try {
    const values = await loadGoogleSheetValues({
      spreadsheetId: getConfiguredSpreadsheetId(),
      gid,
      range,
    });
    const records = normalizeHeaders(values);
    const rows: DashboardRow[] = records.map((row, index_) => ({ index_, row }));
    return {
      rows,
      rowCount: rows.length,
      syncedAt: rows.length >= 3 ? new Date().toISOString() : null,
    };
  } catch {
    return {
      rows: [] as DashboardRow[],
      rowCount: 0,
      syncedAt: null,
    };
  }
}

export async function loadInitialSheetData() {
  const { segmentGid, sourceGid } = getConfiguredMetricsSheetConfig();
  const [segment, source] = await Promise.all([
    loadSheetTab(segmentGid),
    loadSheetTab(sourceGid),
  ]);

  return {
    ...segment,
    sourceRows: source.rows,
    sourceRowCount: source.rowCount,
    sourceSyncedAt: source.syncedAt,
    channelRows: source.rows,
  };
}
