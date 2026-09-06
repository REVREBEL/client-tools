import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getConfiguredSpreadsheetId, loadGoogleSheetValues } from "../../lib/google-sheets";
import {
  GOOGLE_SHEET_URL_PERMISSION,
  GOOGLE_SHEET_URL_PERMISSION_UNSCOPED,
} from "../../permissions";

export const dynamic = "force-dynamic";

const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1MD-PF0GScwSG3m9wTwAzTHjl2kownwFNEppz3VmuyK0/edit";
const DEFAULT_SHEET_GID = "1941800013";
const SOURCE_DATASET_GID = "1319180770";

function extractSheetId(value: string) {
  const standard = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (standard?.[1]) return standard[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(value)) return value;
  return null;
}

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

function normalizeDashboardRows(records: string[][]) {
  if (records.length === 0) return records;

  const normalizedHeaders = records[0].map((header) => {
    const clean = header.trim().toLowerCase();
    return HEADER_ALIASES[clean] || clean;
  });

  const normalizedRecords = [normalizedHeaders, ...records.slice(1)];
  const indexOf = (name: string) => normalizedHeaders.indexOf(name);
  const dowIndexes = {
    year: indexOf("dow_year"),
    month: indexOf("dow_stay_month"),
    metric: indexOf("dow_metric"),
    sun: indexOf("dow_sun"),
    mon: indexOf("dow_mon"),
    tue: indexOf("dow_tue"),
    wed: indexOf("dow_wed"),
    thu: indexOf("dow_thu"),
    fri: indexOf("dow_fri"),
    sat: indexOf("dow_sat"),
  };

  if (Object.values(dowIndexes).some((index) => index < 0)) {
    return normalizedRecords;
  }

  const groups = new Map<string, { totals?: string[]; available?: string[] }>();
  normalizedRecords.slice(1).forEach((row) => {
    const year = row[dowIndexes.year];
    const month = row[dowIndexes.month];
    const metric = String(row[dowIndexes.metric] || "").toUpperCase();
    if (!year || !month || !metric) return;
    const key = `${year}|${month}`;
    const group = groups.get(key) || {};
    if (metric === "DOW_TOTALS") group.totals = row;
    if (metric === "RMS_AVAILABLE") group.available = row;
    groups.set(key, group);
  });

  const dayIndexes = [
    dowIndexes.sun,
    dowIndexes.mon,
    dowIndexes.tue,
    dowIndexes.wed,
    dowIndexes.thu,
    dowIndexes.fri,
    dowIndexes.sat,
  ];
  const cleanedRecords = normalizedRecords.map((row, rowIndex) => {
    if (rowIndex === 0 || !row[dowIndexes.metric]) return row;
    const copy = [...row];
    [dowIndexes.year, dowIndexes.month, dowIndexes.metric, ...dayIndexes].forEach((index) => {
      copy[index] = "";
    });
    return copy;
  });

  groups.forEach((group) => {
    if (!group.totals || !group.available) return;
    const row = normalizedHeaders.map(() => "");
    row[dowIndexes.year] = group.totals[dowIndexes.year] || "";
    row[dowIndexes.month] = group.totals[dowIndexes.month] || "";
    row[dowIndexes.metric] = "TOTAL";
    dayIndexes.forEach((index) => {
      const sold = Number(group.totals?.[index]) || 0;
      const available = Number(group.available?.[index]) || 0;
      row[index] = available > 0 ? String(Math.round((sold / available) * 1000) / 10) : "0";
    });
    cleanedRecords.push(row);
  });

  return cleanedRecords;
}

export async function GET(request: NextRequest) {
  const { has, userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to access the dashboard data." }, { status: 401 });
  }

  const requestedUrl =
    request.nextUrl.searchParams.get("url") ||
    process.env.GOOGLE_SHEET_URL ||
    DEFAULT_SHEET_URL;
  const gid =
    request.nextUrl.searchParams.get("gid") ||
    process.env.GOOGLE_SHEET_GID ||
    DEFAULT_SHEET_GID;
  const requestedRange = request.nextUrl.searchParams.get("range") || "";
  const range = /^[A-Z]+(?::[A-Z]+)?$/.test(requestedRange) ? requestedRange : "";
  const spreadsheetId = extractSheetId(requestedUrl) || getConfiguredSpreadsheetId();

  if (!spreadsheetId || !/^\d+$/.test(gid)) {
    return NextResponse.json({ error: "Use a valid Google Sheet URL and numeric tab GID." }, { status: 400 });
  }

  const configuredSpreadsheetId =
    getConfiguredSpreadsheetId() || extractSheetId(DEFAULT_SHEET_URL);
  const isStandardDashboardRead =
    spreadsheetId === configuredSpreadsheetId &&
    range === "" &&
    (gid === DEFAULT_SHEET_GID || gid === SOURCE_DATASET_GID);
  const canChangeSheetSource =
    has({ permission: GOOGLE_SHEET_URL_PERMISSION }) ||
    has({ permission: GOOGLE_SHEET_URL_PERMISSION_UNSCOPED });

  if (
    !isStandardDashboardRead &&
    !canChangeSheetSource
  ) {
    return NextResponse.json(
      { error: "You do not have permission to change the Google Sheet source." },
      { status: 403 },
    );
  }

  try {
    const records = await loadGoogleSheetValues({ spreadsheetId, gid, range });
    const normalizedRecords = normalizeDashboardRows(records);
    const rows = normalizedRecords.map((row, index_) => ({ index_, row }));
    return NextResponse.json(
      {
        rows,
        rowCount: rows.length,
        spreadsheetId,
        gid,
        source: "google-sheets-api",
        syncedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Google Sheet could not be reached.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
