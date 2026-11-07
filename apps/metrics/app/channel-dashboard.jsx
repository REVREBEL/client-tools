"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ChevronDown, Filter, Layers } from "lucide-react";

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const BRAND = {
  blue: "#163666",
  teal: "#047C97",
  cyan: "#00A6B6",
  aqua: "#71C9C5",
  powder: "#B2D3DE",
  yellow: "#FACA78",
  orange: "#F37D59",
  red: "#E05047",
  purple: "#8E456A",
  frost: "#EFF5F6",
  white: "#fafafa",
};

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@700;800;900&family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-inconsolata { font-family: 'Inconsolata', monospace; font-variation-settings: "wdth" 87.5; }
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
  .hover-text-dynamic:hover { color: var(--hover-color) !important; }
`;

const safeString = (value) => value === null || value === undefined ? "" : String(value).trim();
const safeNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const text = safeString(value);
  if (!text) return 0;
  const negative = /^\(.*\)$/.test(text);
  const parsed = Number(text.replace(/[$,%()\s,]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
};
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
const formatCurrencyPrecise = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Math.round(value || 0));
const formatCompactUSD = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
const daysInMonth = (year, month) => new Date(Number(year), MONTH_ORDER.indexOf(month) + 1, 0).getDate();
const expectedPaceStatus = (year, month) => {
  if (month === "FULL_YEAR") return "ACTUAL_OTB";
  const today = new Date();
  const targetYear = Number(year);
  const targetMonthIndex = MONTH_ORDER.indexOf(month);
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  if (targetYear < currentYear) return "ACTUAL";
  if (targetYear > currentYear) return "OTB";
  if (targetMonthIndex < currentMonthIndex) return "ACTUAL";
  if (targetMonthIndex > currentMonthIndex) return "OTB";
  return "ACTUAL_OTB";
};
const varianceLabel = (value, currency = false) => {
  const formatted = currency ? formatCurrency(Math.abs(value)) : formatNumber(Math.abs(value));
  return `${value >= 0 ? "+" : "−"}${formatted}`;
};
const normalizePeriodKey = (value) =>
  safeString(value).toUpperCase().replace(/[\s-]+/g, "_");
const dateSortValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = safeString(value);
  if (!text) return 0;
  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric;
  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? timestamp : 0;
};
const sheetDateYear = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(Date.UTC(1899, 11, 30 + value)).getUTCFullYear();
  }
  const text = safeString(value);
  if (!text) return 0;
  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return new Date(Date.UTC(1899, 11, 30 + numeric)).getUTCFullYear();
  }
  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? new Date(timestamp).getUTCFullYear() : 0;
};

export default function ChannelDashboard({ data = [], metadataData = [], profileData = [] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedPeriod, setSelectedPeriod] = useState("YEAR");
  const [selectedPaceSource, setSelectedPaceSource] = useState("ALL");
  const [profileMetricType, setProfileMetricType] = useState("CHANNEL");
  const [selectedProfileMetric, setSelectedProfileMetric] = useState("ALL");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const parsed = useMemo(() => {
    const result = {
      rows: [],
      paceRows: [],
      pickupRows: [],
      profileRows: [],
      years: [],
      propertyName: "NOW NOW NOHO",
      rooms: 188,
    };

    const metadataHeaders = metadataData[0]?.row || [];
    const propertyIndex = metadataHeaders.findIndex((header) => safeString(header).toLowerCase() === "property");
    const roomsIndex = metadataHeaders.findIndex((header) => safeString(header).toLowerCase() === "rooms");
    const metadataRow = metadataData.slice(2).find((item) =>
      (propertyIndex >= 0 && item?.row?.[propertyIndex]) ||
      (roomsIndex >= 0 && safeNumber(item?.row?.[roomsIndex]) > 0)
    );
    if (metadataRow) {
      result.propertyName = safeString(metadataRow.row[propertyIndex]) || result.propertyName;
      result.rooms = safeNumber(metadataRow.row[roomsIndex]) || result.rooms;
    }

    const sourceHeaders = data[0]?.row || [];
    const sourceIndex = (name) =>
      sourceHeaders.findIndex((header) => safeString(header).toLowerCase() === name);
    const paceMap = {
      year: sourceIndex("pace_year"),
      month: sourceIndex("pace_stay_month"),
      periodStatus: sourceIndex("pace_period_status"),
      metricType: sourceIndex("pace_metric_type"),
      metric: sourceIndex("pace_metric"),
      sort: sourceIndex("pace_sort"),
      tyBookings: sourceIndex("pace_ty_bookings"),
      tyRevenue: sourceIndex("pace_ty_revenue"),
      stlyBookings: sourceIndex("pace_stly_bookings"),
      stlyRevenue: sourceIndex("pace_stly_revenue"),
      tyNights: sourceIndex("pace_ty_room_nights"),
      stlyNights: sourceIndex("pace_stly_room_nights"),
    };
    const pickupMap = {
      year: sourceIndex("pickup_year"),
      month: sourceIndex("pickup_stay_month"),
      breakoutType: sourceIndex("pickup_breakout_type"),
      breakout: sourceIndex("pickup_breakout"),
      metric: sourceIndex("pickup_metric"),
      current: sourceIndex("pickup_current"),
      day01: sourceIndex("pickup_01day_pu"),
      day03: sourceIndex("pickup_03day_pu"),
      day07: sourceIndex("pickup_07day_pu"),
      day14: sourceIndex("pickup_14day_pu"),
      day21: sourceIndex("pickup_21day_pu"),
      day30: sourceIndex("pickup_30day_pu"),
      day60: sourceIndex("pickup_60day_pu"),
      day90: sourceIndex("pickup_90day_pu"),
    };

    data.forEach((item, index) => {
      if (index <= 1 || !item?.row) return;
      const row = item.row;

      if (paceMap.year >= 0 && row[paceMap.year]) {
        const metricType = safeString(row[paceMap.metricType]).toUpperCase();
        if (["TOTAL", "SOURCE", "SUBSOURCE"].includes(metricType)) {
          result.paceRows.push({
            year: safeNumber(row[paceMap.year]),
            month: safeString(row[paceMap.month]).toUpperCase(),
            periodStatus: safeString(row[paceMap.periodStatus]).toUpperCase(),
            metricType,
            metric: safeString(row[paceMap.metric]).toUpperCase(),
            sort: safeNumber(row[paceMap.sort]),
            tyBookings: safeNumber(row[paceMap.tyBookings]),
            tyRevenue: safeNumber(row[paceMap.tyRevenue]),
            stlyBookings: safeNumber(row[paceMap.stlyBookings]),
            stlyRevenue: safeNumber(row[paceMap.stlyRevenue]),
            tyNights: safeNumber(row[paceMap.tyNights]),
            stlyNights: safeNumber(row[paceMap.stlyNights]),
          });
        }
      }

      if (pickupMap.year >= 0 && row[pickupMap.year]) {
        const breakoutType = safeString(row[pickupMap.breakoutType]).toUpperCase();
        if (breakoutType === "SOURCE") {
          result.pickupRows.push({
            year: safeNumber(row[pickupMap.year]),
            month: safeString(row[pickupMap.month]).toUpperCase(),
            breakoutType,
            breakout: safeString(row[pickupMap.breakout]).toUpperCase(),
            metric: safeString(row[pickupMap.metric]).toUpperCase(),
            current: safeNumber(row[pickupMap.current]),
            day01: safeNumber(row[pickupMap.day01]),
            day03: safeNumber(row[pickupMap.day03]),
            day07: safeNumber(row[pickupMap.day07]),
            day14: safeNumber(row[pickupMap.day14]),
            day21: safeNumber(row[pickupMap.day21]),
            day30: safeNumber(row[pickupMap.day30]),
            day60: safeNumber(row[pickupMap.day60]),
            day90: safeNumber(row[pickupMap.day90]),
          });
        }
      }
    });

    const headers = sourceHeaders;
    const findCol = (name) => headers.findIndex((header) => safeString(header).toLowerCase() === name);
    const map = {
      year: findCol("channel_year"),
      month: findCol("channel_stay_month"),
      metric: findCol("channel_metric"),
      code: findCol("channel_metric_code"),
      reservations: findCol("channel_no_resn"),
      nights: findCol("channel_nights"),
      adr: findCol("channel_adr"),
      revenue: findCol("channel_revenue"),
      alos: findCol("channel_alos"),
      leadDays: findCol("channel_lead_days"),
      sort: findCol("channel_sort"),
    };

    data.forEach((item, index) => {
      if (index <= 1 || !item?.row || map.year < 0) return;
      const year = safeNumber(item.row[map.year]);
      const month = safeString(item.row[map.month]).toUpperCase();
      const metric = safeString(item.row[map.metric]).toUpperCase();
      if (!year || !MONTH_ORDER.includes(month) || !metric) return;

      result.rows.push({
        year,
        month,
        metric,
        code: safeString(item.row[map.code]).toUpperCase(),
        reservations: safeNumber(item.row[map.reservations]),
        nights: safeNumber(item.row[map.nights]),
        adr: safeNumber(item.row[map.adr]),
        revenue: safeNumber(item.row[map.revenue]),
        alos: safeNumber(item.row[map.alos]),
        leadDays: safeNumber(item.row[map.leadDays]),
        sort: safeNumber(item.row[map.sort]),
      });
    });

    const profileHeaders = profileData[0]?.row || [];
    const profileIndex = (name) =>
      profileHeaders.findIndex((header) => safeString(header).toLowerCase() === name);
    const profileMap = {
      snapDate: profileIndex("profile_snap_date"),
      period: profileIndex("profile_period"),
      startDate: profileIndex("profile_start_date"),
      metricType: profileIndex("profile_metric_type"),
      metric: profileIndex("profile_metric"),
      profileType: profileIndex("profile_profile_type"),
      bucket: profileIndex("profile_profile_bucket"),
      reservations: profileIndex("profile_reservations"),
      pctReservations: profileIndex("profile_pct_reservations"),
      bucketSort: profileIndex("profile_bucket_sort"),
    };

    profileData.forEach((item, index) => {
      if (index <= 1 || !item?.row || profileMap.metricType < 0) return;
      const row = item.row;
      const metricType = safeString(row[profileMap.metricType]).toUpperCase();
      if (!["CHANNEL", "SOURCE", "SUBSOURCE"].includes(metricType)) return;
      result.profileRows.push({
        snapDate: dateSortValue(row[profileMap.snapDate]),
        period: normalizePeriodKey(row[profileMap.period]),
        startYear: sheetDateYear(row[profileMap.startDate]),
        metricType,
        metric: safeString(row[profileMap.metric]).toUpperCase(),
        profileType: safeString(row[profileMap.profileType]).toUpperCase(),
        bucket: safeString(row[profileMap.bucket]).toUpperCase(),
        reservations: safeNumber(row[profileMap.reservations]),
        pctReservations: safeNumber(row[profileMap.pctReservations]),
        bucketSort: safeNumber(row[profileMap.bucketSort]),
      });
    });

    result.years = Array.from(
      new Set([
        ...result.rows.map((row) => String(row.year)),
        ...result.paceRows.map((row) => String(row.year)),
      ]),
    ).filter((year) => year !== "0").sort().reverse();
    return result;
  }, [data, metadataData, profileData]);

  const activeYear = parsed.years.includes(selectedYear) ? selectedYear : parsed.years[0] || selectedYear;
  const activeMonths = useMemo(() => {
    if (selectedPeriod === "YEAR") return MONTH_ORDER;
    if (selectedPeriod === "YTD") return MONTH_ORDER.slice(0, new Date().getMonth() + 1);
    return [selectedPeriod];
  }, [selectedPeriod]);

  const channelOptions = useMemo(() => {
    const sortMap = new Map();
    parsed.rows.forEach((row) => {
      if (row.metric === "TOTAL") return;
      const existing = sortMap.get(row.metric);
      if (existing === undefined || (row.sort > 0 && row.sort < existing)) sortMap.set(row.metric, row.sort || 9999);
    });
    return Array.from(sortMap.keys()).sort((a, b) =>
      (sortMap.get(a) || 9999) - (sortMap.get(b) || 9999) || a.localeCompare(b)
    );
  }, [parsed.rows]);

  const metricName = "TOTAL";
  const totalFor = useCallback((year, months, metric) => {
    const rows = parsed.rows.filter((row) =>
      String(row.year) === String(year) &&
      months.includes(row.month) &&
      row.metric === metric
    );
    const reservations = rows.reduce((sum, row) => sum + row.reservations, 0);
    const nights = rows.reduce((sum, row) => sum + row.nights, 0);
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const leadWeight = rows.reduce((sum, row) => sum + (row.leadDays * (row.reservations || 1)), 0);
    return {
      reservations,
      nights,
      revenue,
      adr: nights > 0 ? revenue / nights : 0,
      alos: reservations > 0 ? nights / reservations : 0,
      leadDays: rows.length > 0 ? leadWeight / rows.reduce((sum, row) => sum + (row.reservations || 1), 0) : 0,
    };
  }, [parsed.rows]);

  const stats = useMemo(() => {
    const current = totalFor(activeYear, activeMonths, metricName);
    const prior = totalFor(String(Number(activeYear) - 1), activeMonths, metricName);
    const availableRoomNights = activeMonths.reduce(
      (sum, month) => sum + (parsed.rooms * daysInMonth(activeYear, month)),
      0,
    );
    const priorAvailableRoomNights = activeMonths.reduce(
      (sum, month) => sum + (parsed.rooms * daysInMonth(Number(activeYear) - 1, month)),
      0,
    );
    return {
      ...current,
      occupancy: availableRoomNights > 0 ? current.nights / availableRoomNights : 0,
      priorRevenue: prior.revenue,
      priorNights: prior.nights,
      priorAdr: prior.adr,
      priorAlos: prior.alos,
      priorOccupancy: priorAvailableRoomNights > 0 ? prior.nights / priorAvailableRoomNights : 0,
      priorLeadDays: prior.leadDays,
    };
  }, [activeMonths, activeYear, metricName, parsed.rooms, totalFor]);

  const monthly = useMemo(() => MONTH_ORDER.map((month) => {
    const total = totalFor(activeYear, [month], metricName);
    const available = parsed.rooms * daysInMonth(activeYear, month);
    return {
      month,
      ...total,
      occupancy: available > 0 ? total.nights / available : 0,
    };
  }), [activeYear, metricName, parsed.rooms, totalFor]);

  const channelBreakdown = useMemo(() => {
    const metrics = channelOptions;
    const totalRevenue = totalFor(activeYear, activeMonths, "TOTAL").revenue;
    return metrics.map((metric) => {
      const total = totalFor(activeYear, activeMonths, metric);
      const sort = Math.min(
        ...parsed.rows.filter((row) => row.metric === metric && row.sort > 0).map((row) => row.sort),
        9999,
      );
      const available = activeMonths.reduce(
        (sum, month) => sum + (parsed.rooms * daysInMonth(activeYear, month)),
        0,
      );
      return {
        metric,
        sort,
        ...total,
        occupancy: available > 0 ? total.nights / available : 0,
        mix: totalRevenue > 0 ? total.revenue / totalRevenue : 0,
      };
    }).sort((a, b) => a.sort - b.sort || a.metric.localeCompare(b.metric));
  }, [activeMonths, activeYear, channelOptions, parsed.rooms, parsed.rows, totalFor]);

  const paceSourceOptions = useMemo(() => {
    const sortMap = new Map();
    parsed.paceRows.forEach((row) => {
      if (row.metricType === "TOTAL" || !row.metric || row.metric === "TOTAL") return;
      const sort = row.sort > 0 ? row.sort : 9999;
      const current = sortMap.get(row.metric);
      if (current === undefined || sort < current) sortMap.set(row.metric, sort);
    });
    const options = Array.from(sortMap.keys()).sort(
      (a, b) => (sortMap.get(a) || 9999) - (sortMap.get(b) || 9999) || a.localeCompare(b),
    );
    return options.length > 0 ? options : channelOptions;
  }, [channelOptions, parsed.paceRows]);

  const filteredPaceRows = useMemo(() => {
    const targetMetric = selectedPaceSource === "ALL" ? "TOTAL" : selectedPaceSource.toUpperCase();
    const eligible = parsed.paceRows.filter((row) =>
      String(row.year) === String(activeYear) &&
      activeMonths.includes(row.month) &&
      (selectedPaceSource === "ALL"
        ? row.metricType === "TOTAL"
        : ["SOURCE", "SUBSOURCE"].includes(row.metricType)) &&
      row.metric === targetMetric &&
      row.periodStatus === expectedPaceStatus(activeYear, row.month)
    );
    const monthlyMap = new Map(
      activeMonths.map((month) => [month, {
        month,
        periodStatus: expectedPaceStatus(activeYear, month),
        tyBookings: 0,
        stlyBookings: 0,
        tyRevenue: 0,
        stlyRevenue: 0,
        tyNights: 0,
        stlyNights: 0,
      }]),
    );
    eligible.forEach((row) => {
      if (!monthlyMap.has(row.month)) return;
      const month = monthlyMap.get(row.month);
      month.tyBookings += row.tyBookings;
      month.stlyBookings += row.stlyBookings;
      month.tyRevenue += row.tyRevenue;
      month.stlyRevenue += row.stlyRevenue;
      month.tyNights += row.tyNights;
      month.stlyNights += row.stlyNights;
    });
    return activeMonths.map((month) => monthlyMap.get(month));
  }, [activeMonths, activeYear, parsed.paceRows, selectedPaceSource]);

  const fullYearPaceTotal = useMemo(() => {
    if (selectedPeriod !== "YEAR") return null;
    const targetMetric = selectedPaceSource === "ALL" ? "TOTAL" : selectedPaceSource.toUpperCase();
    const rows = parsed.paceRows.filter((row) =>
      String(row.year) === String(activeYear) &&
      row.month === "FULL_YEAR" &&
      row.periodStatus === "ACTUAL_OTB" &&
      (selectedPaceSource === "ALL"
        ? row.metricType === "TOTAL"
        : ["SOURCE", "SUBSOURCE"].includes(row.metricType)) &&
      row.metric === targetMetric
    );
    if (rows.length === 0) return null;
    return rows.reduce((total, row) => ({
      tyBookings: total.tyBookings + row.tyBookings,
      stlyBookings: total.stlyBookings + row.stlyBookings,
      tyRevenue: total.tyRevenue + row.tyRevenue,
      stlyRevenue: total.stlyRevenue + row.stlyRevenue,
      tyNights: total.tyNights + row.tyNights,
      stlyNights: total.stlyNights + row.stlyNights,
    }), { tyBookings: 0, stlyBookings: 0, tyRevenue: 0, stlyRevenue: 0, tyNights: 0, stlyNights: 0 });
  }, [activeYear, parsed.paceRows, selectedPaceSource, selectedPeriod]);

  const paceTotals = useMemo(() => {
    const totals = fullYearPaceTotal || filteredPaceRows.reduce((sum, row) => ({
      tyBookings: sum.tyBookings + row.tyBookings,
      stlyBookings: sum.stlyBookings + row.stlyBookings,
      tyRevenue: sum.tyRevenue + row.tyRevenue,
      stlyRevenue: sum.stlyRevenue + row.stlyRevenue,
      tyNights: sum.tyNights + row.tyNights,
      stlyNights: sum.stlyNights + row.stlyNights,
    }), { tyBookings: 0, stlyBookings: 0, tyRevenue: 0, stlyRevenue: 0, tyNights: 0, stlyNights: 0 });
    const revenueVariance = totals.tyRevenue - totals.stlyRevenue;
    const revenueVariancePct =
      totals.stlyRevenue > 0 ? (revenueVariance / totals.stlyRevenue) * 100 : 0;
    const tyAdr = totals.tyNights > 0 ? totals.tyRevenue / totals.tyNights : 0;
    const stlyAdr = totals.stlyNights > 0 ? totals.stlyRevenue / totals.stlyNights : 0;
    return {
      ...totals,
      revenueVariance,
      revenueVariancePct,
      tyAdr,
      stlyAdr,
      adrVariance: tyAdr - stlyAdr,
      bookingVariance: totals.tyBookings - totals.stlyBookings,
    };
  }, [filteredPaceRows, fullYearPaceTotal]);

  const pickupSeries = useMemo(() => {
    const eligible = parsed.pickupRows.filter((row) =>
      String(row.year) === String(activeYear) &&
      activeMonths.includes(row.month) &&
      row.breakoutType === "SOURCE"
    );
    const totalRows = eligible.filter((row) => row.breakout === "TOTAL");
    const baseRows =
      selectedPaceSource === "ALL"
        ? (totalRows.length > 0 ? totalRows : eligible.filter((row) => row.breakout !== "TOTAL"))
        : eligible.filter((row) => row.breakout === selectedPaceSource);
    const windows = [
      { days: 90, key: "day90" },
      { days: 60, key: "day60" },
      { days: 30, key: "day30" },
      { days: 21, key: "day21" },
      { days: 14, key: "day14" },
      { days: 7, key: "day07" },
      { days: 3, key: "day03" },
      { days: 1, key: "day01" },
      { days: 0, key: "current" },
    ];
    return windows.map(({ days, key }) => {
      const rooms = baseRows
        .filter((row) => row.metric === "ROOM_NIGHTS")
        .reduce((sum, row) => sum + row[key], 0);
      const revenue = baseRows
        .filter((row) => row.metric === "REVENUE")
        .reduce((sum, row) => sum + row[key], 0);
      return { days, rooms, revenue, adr: rooms > 0 ? revenue / rooms : 0 };
    });
  }, [activeMonths, activeYear, parsed.pickupRows, selectedPaceSource]);

  const profileMetricOptions = useMemo(() => {
    const values = parsed.profileRows
      .filter((row) => row.metricType === profileMetricType && row.metric && row.metric !== "TOTAL")
      .map((row) => row.metric);
    return Array.from(new Set(values)).sort();
  }, [parsed.profileRows, profileMetricType]);

  const activeProfileRows = useMemo(() => {
    const period = selectedPeriod === "YEAR" ? "FULL_YEAR" : normalizePeriodKey(selectedPeriod);
    let rows = parsed.profileRows.filter((row) =>
      row.metricType === profileMetricType &&
      row.period === period &&
      (!activeYear || !row.startYear || row.startYear === Number(activeYear))
    );
    rows = selectedProfileMetric === "ALL"
      ? rows.filter((row) => row.metric === "TOTAL")
      : rows.filter((row) => row.metric === selectedProfileMetric);
    const latestSnapDate = Math.max(...rows.map((row) => row.snapDate || 0), 0);
    return latestSnapDate > 0
      ? rows.filter((row) => (row.snapDate || 0) === latestSnapDate)
      : rows;
  }, [activeYear, parsed.profileRows, profileMetricType, selectedPeriod, selectedProfileMetric]);

  const profilePct = useCallback((profileType, buckets) => {
    const bucketNames = Array.isArray(buckets) ? buckets : [buckets];
    const row = activeProfileRows.find((item) =>
      item.profileType === profileType && bucketNames.includes(item.bucket)
    );
    const value = row?.pctReservations || 0;
    return value > 0 && value <= 1 ? value * 100 : value;
  }, [activeProfileRows]);

  const maxMonthlyRevenue = Math.max(...monthly.map((row) => row.revenue), 1);
  const periodLabel = selectedPeriod === "YEAR" ? "FULL YEAR" : selectedPeriod === "YTD" ? "YTD" : selectedPeriod;

  if (parsed.rows.length === 0) {
    return (
      <main className="sheet-gate">
        <p className="sheet-gate__eyebrow">CHANNEL DASHBOARD · SOURCE_DATASET</p>
        <h1>NO CHANNEL DATA</h1>
        <p className="sheet-gate__message">The channel fields could not be read from source_dataset.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-16 font-roboto" style={{ backgroundColor: BRAND.frost, color: BRAND.blue }}>
      <style>{fontStyles}</style>

      <header className="sticky top-[48px] z-40 border-b bg-white shadow-sm" style={{ borderColor: `${BRAND.aqua}33` }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex h-[35px] items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 174.8" className="h-full w-auto" role="img" aria-label="REVREBEL">
                <defs><style>{`.revrebel-wordmark{fill:#1c3766;}`}</style></defs>
                <path className="revrebel-wordmark" d="M634,41.5c.5,0,1,0,1.4,0,24.9,0,49.9,0,74.8,0,2.8,0,4.9-1.5,4.7-5.1-.2-10.4,0-20.4,0-30.8,0-2.2-1.3-3.5-3.5-3.6-41.6,0-83.3-.1-124.9,0-1.9,.3-2.9,1.4-3.1,3.2,0,27.5,0,54.9,0,82.4,0,27.5-.1,55,0,82.5,.2,1.7,1.4,2.8,3.1,3,41.7,0,83.5,0,125.2,0,2.2-.2,3.3-2.1,3.1-4.2,0-10.3,0-20.7,0-31,.3-3.3-1.9-4.5-4.9-4.2-25.4,0-50.7,0-76.1,0-1.3,0-1.6-.4-1.6-1.6,0-.3,0-.6,0-.9,0-7.8,0-15.7,0-23.5,0-1.5,.3-1.7,1.7-1.8,16.1,0,32.2,.2,48.3,0,2.1-.2,3.2-1.9,3-3.9,0-10.4,0-20.9,0-31.3,0-2-.9-3.6-3-3.9-15.7-.3-31.5,0-47.2-.1-.4,0-.8,0-1.3,0-1.3,0-1.5-.3-1.6-1.6,0-7.2,0-14.3,0-21.5,0-.2,0-.4,0-.6,0-1.3,.3-1.6,1.7-1.6Z" />
                <path className="revrebel-wordmark" d="M991.9,134c-26-.2-52,0-78,0-1.3,0-1.6-.4-1.7-1.6,0-7.9,0-15.8,0-23.7,0-1.2-.1-2.6,1.5-2.5,16.2-.1,32.4,.1,48.7,0,2.4-.2,3.3-2.3,3.1-4.5,0-10.1,0-20.1,0-30.2,.2-2.1-.6-4-2.9-4.3-16.2-.4-32.5,0-48.8-.2-1.7,0-1.5-1.4-1.5-2.6,0-6.6,0-13.3,0-19.9,0-2.8,0-2.8,2.8-2.8,25.4,0,50.7,.2,76.1,.2,2.9,0,4-2.1,3.8-4.7,0-10.6,.1-21.3,0-31.9-.2-2.4-2.5-3-4.6-3-41.2,0-82.3,0-123.5,0-2.1,.2-3.2,1.4-3.3,3.5,0,27.4,0,54.7,0,82.1,0,27,0,54,0,81,0,3.3,1.2,4.3,4.8,4.3,41,0,81.9,0,123,.4,2.8,0,3.9-2,3.7-4.5,0-10.1,0-20.2,0-30.4,.2-2.1-.7-4.3-3.1-4.4Z" />
                <path className="revrebel-wordmark" d="M195.9,41.1c24.9,0,49.7,0,74.6,0,4,.6,3.5-2.4,3.3-4.8,0-10,0-20,0-30,.3-3.3-1.3-5.1-4.6-4.8-39.6,0-79.3,0-118.9,0-3.6,0-4.6,1-4.6,4.7,0,27.1,0,54.2,0,81.3,0,27.6,0,55.1,0,82.7,.1,1.8,1.2,3,3,3.2,40.2,0,80.4,0,120.6,0,2.8,0,4.5-1.1,4.5-4.6-.1-10.1,0-20.2,0-30.3,0-3.3-1.3-4.6-4.6-4.6-24.8,0-49.5,0-74.3,0-1.4,0-1.6-.3-1.6-1.7,0-8.2,0-16.4,0-24.5,0-1.4,.2-1.6,1.6-1.7,15.7,0,31.5,.2,47.3,0,2.2-.2,3-2.3,2.8-4.3,0-10.2,0-20.4,0-30.6,.3-3.4-1.8-4.5-4.8-4.5-15.1,0-30.2,0-45.3,0-1.4,0-1.5-.2-1.6-1.5,0-7.1,0-14.2,0-21.3q0-2.6,2.7-2.6Z" />
                <path className="revrebel-wordmark" d="M432.6,2.3c-14.6-.6-29.4,0-44-.2-3-.2-4.6,1.1-5.1,3.9-8.6,34.4-16.3,69.2-25.5,103.4-.2,0-.4,0-.5,0-9.2-34.4-17.4-69.2-26.3-103.7-.7-2.8-1.8-3.6-4.7-3.6-15.1,.2-30.4-.4-45.5,.2-2.1,.4-2.5,2.5-1.8,4.2,17,54.6,34,109.1,51,163.7,.6,2.2,2.8,3.1,4.9,3.1,14.3,0,28.6,0,43,0,2.9,.2,4.6-1.5,5.2-4.1,17-54,34-108,51-162,.8-2,.9-4.4-1.6-5Z" />
                <path className="revrebel-wordmark" d="M1133.4,137.2c-.2-1.9-1.4-3-3.3-3.2-26.4,0-52.7,0-79.1,0q-2.9,0-2.9-2.9c0-41.6,0-83.3,0-124.9,0-2.8-1.3-4.1-4.2-4.1-13.5,0-27,0-40.6,0-2.8,0-4.1,1.3-4.1,4,0,27.1,0,54.3,0,81.4,0,27.5,0,55,0,82.5,.1,1.9,1.4,3.2,3.3,3.3,42.2,0,84.3,0,126.5,0,3,0,4.3-1.2,4.3-4.1,0-10.7,0-21.4,0-32.1Z" />
                <path className="revrebel-wordmark" d="M836.7,85.1c10.1-5.7,17.6-13.5,19.6-25,3.4-17.8-1.2-39.4-18.6-48.6-13.4-7.3-29-9.2-44.1-9.4-23.6-.1-47.1,0-70.7,0-2.3,.2-3.6,1.4-3.6,3.7,0,54.7,0,109.3,0,164,.1,2.3,1.4,3.5,3.7,3.6,23.8,0,47.7,0,71.5,0,15.7,0,31.7-2.8,45.3-10.8,17.5-9.5,22.9-30.2,19.4-48.5-2.5-14-10.3-22.2-22.5-29Zm-66.7-43.5c7.7,0,15.3,0,23,0,10.5,.2,18.2,5.3,16.2,16.5-1.3,8-10.5,10.3-17.6,10.3-7.2,0-14.4,0-21.5,0-1.7,0-1.9-.2-1.9-1.9,0-7.7,0-15.4,0-23,0-1.7,.2-1.9,1.9-1.9Zm40.8,82.4c-2.4,9.5-12.9,10.1-21.2,10-6.7,0-13.3,0-20,0-1.8,0-1.5-1.2-1.6-2.6,0-7.6,0-15.3,0-22.9,0-2.6,0-2.7,2.8-2.7,4.2,0,8.5,0,12.7,0,0,0,0,0,0-.1,4.5,.1,9,.2,13.5,.4,2.5,.1,4.9,.7,7.2,1.7,6.5,2.7,8.1,9.9,6.6,16.1Z" />
                <path className="revrebel-wordmark" d="M109.6,104.9c-.7-1.4-.5-1.8,.9-2.4,24.4-9,35.5-34.2,29.9-58.5C135.7,18,110,1.5,84.1,2.1c-26.4-.1-52.8,0-79.3,0C2.6,1.9,.5,2.6,.2,5.2c-.3,54.3,0,108.7-.1,163,0,2.4,.4,4.9,3.3,5.1,14.2,0,28.3,0,42.5,0,2.5-.3,3.3-2.4,3.1-4.6,0-19.9,0-39.9,0-59.8,.1-.9,.4-1.3,1.4-1.3,3.5,0,7.1,0,10.6,0,1.3,0,1.7,1.2,2.2,2.1,9.3,20.3,18.6,40.6,27.9,60.8,.9,1.9,2.3,2.8,4.3,2.8,14.6,0,29.2,0,43.7,0,2,0,4.3-1.1,3.5-3.4-10.6-21.8-22.1-43.3-33-65Zm-22.9-35.7c-3.4,2.3-7.3,3.3-11.4,3.3-3.9,0-7.8,0-11.7,0s-8.6,0-12.8,0c-1.7,0-2-.2-2-1.9,0-9.1,0-18.2,0-27.2,0-1.5,.3-1.8,1.9-1.8,8.5,0,17,0,25.5,0,4.7,0,8.9,1.7,12.5,4.9,5.8,5.2,6.7,16.9-2,22.7Z" />
                <path className="revrebel-wordmark" d="M580.4,169.8c-10.5-21.5-21.8-42.8-32.6-64.2-1.2-2.3-1.2-2.3,1.3-3.3,40.2-15.3,40.2-73.8,3.3-92.8-9.5-5.2-19.7-7.3-30.4-7.3-26.7-.1-53.5,0-80.2,0-3.2,.1-4,2.2-3.8,5.1,0,54.4,0,108.7,0,163.1,.2,2.3,2.3,3.4,4.5,3.1,13.3,0,26.5,0,39.8,0,2.3,.2,4.4-.8,4.5-3.2,0-20.3,0-40.6,0-60.9,0-1.3,.3-1.6,1.6-1.6,3.4,0,6.9,0,10.3,0,1.5-.1,1.9,1.2,2.4,2.3,9.3,20.2,18.6,40.4,27.8,60.6,.9,1.9,2.2,2.9,4.4,2.9,14.6,0,29.2,0,43.7,0,2.1,0,4.3-1.2,3.4-3.5Zm-49.4-111.8c-.6,10.1-9.7,14.5-18,14.5-8,0-16.1,0-24.1,0-.8,0-2.1,0-2.1-1-.1-9.3,0-18.6,0-27.9,0-1.9,.2-2.1,2.1-2.1,8.3,0,16.7,0,25,0,9.2,0,18,6.8,17.1,16.4Z" />
                <ellipse className="revrebel-wordmark" cx="1158.2" cy="150.5" rx="21.8" ry="21.1" />
              </svg>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === "pickup_pace" && (
                <label className="flex items-center border p-1.5 shadow-sm" style={{ backgroundColor: BRAND.frost, borderColor: `${BRAND.blue}33` }}>
                  <Layers size={14} className="ml-2" style={{ color: BRAND.cyan }} />
                  <span className="sr-only">Pace source</span>
                  <select
                    value={selectedPaceSource}
                    onChange={(event) => setSelectedPaceSource(event.target.value)}
                    className="cursor-pointer border-none bg-transparent py-1 pl-2 pr-8 font-khand text-xs font-bold uppercase tracking-wider"
                    style={{ color: BRAND.blue }}
                  >
                    <option value="ALL">ALL SOURCES</option>
                    {paceSourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
                  </select>
                </label>
              )}
              <label className="flex items-center border p-1.5 shadow-sm" style={{ backgroundColor: BRAND.frost, borderColor: `${BRAND.blue}33` }}>
                <Filter size={14} className="ml-2" style={{ color: BRAND.cyan }} />
                <span className="sr-only">Period</span>
                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(event.target.value)}
                  className="cursor-pointer border-none bg-transparent py-1 pl-2 pr-8 font-khand text-xs font-bold uppercase tracking-wider"
                  style={{ color: BRAND.blue }}
                >
                  <option value="YEAR">FULL YEAR</option>
                  <option value="YTD">YTD VIEW</option>
                  {MONTH_ORDER.map((month) => <option key={month} value={month}>{month} VIEW</option>)}
                </select>
              </label>
              <label className="border p-1.5 shadow-sm" style={{ backgroundColor: BRAND.frost, borderColor: `${BRAND.blue}33` }}>
                <span className="sr-only">Year</span>
                <select
                  value={activeYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="cursor-pointer border-none bg-transparent py-1 pl-2 pr-8 font-khand text-xs font-bold"
                  style={{ color: BRAND.blue }}
                >
                  {parsed.years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t pt-4 sm:flex-row sm:items-end">
            <h1 className="pt-[2px] font-khand text-4xl font-bold uppercase tracking-tight">
              METRIC CHANNELS | {parsed.propertyName.toUpperCase()}
            </h1>
            <div className="font-khand text-2xl font-bold uppercase tracking-wider text-slate-400">{parsed.rooms} Rooms</div>
          </div>

          <div className="inline-flex flex-wrap border-[2px] bg-white p-1" style={{ borderColor: BRAND.blue }}>
            {[
              { id: "overview", label: "overview" },
              { id: "pickup_pace", label: "pickup & pace" },
              { id: "stay_profiles", label: "stay profiles" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 pb-2 pt-[10px] font-khand text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab.id ? "" : "text-slate-500 hover-text-dynamic"
                }`}
                style={activeTab === tab.id ? { backgroundColor: BRAND.blue, color: BRAND.powder } : { "--hover-color": BRAND.blue }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
        {activeTab === "overview" && (
          <>
        <section className="grid w-full select-none grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="REVENUE" value={formatCompactUSD(stats.revenue)} diff={varianceLabel(stats.revenue - stats.priorRevenue, true)} negative={stats.revenue < stats.priorRevenue} bg={BRAND.blue} color={BRAND.powder} labelColor={`${BRAND.powder}B3`} />
          <KpiCard label="OCCUPANCY" value={`${(stats.occupancy * 100).toFixed(1)}%`} diff={`${Math.abs((stats.occupancy - stats.priorOccupancy) * 100).toFixed(1)}%`} negative={stats.occupancy < stats.priorOccupancy} bg={BRAND.teal} color={BRAND.frost} labelColor={`${BRAND.frost}B3`} />
          <KpiCard label="NIGHTS" value={formatNumber(stats.nights)} diff={varianceLabel(stats.nights - stats.priorNights)} negative={stats.nights < stats.priorNights} bg={BRAND.aqua} color={BRAND.teal} labelColor={`${BRAND.teal}B3`} />
          <KpiCard label="ADR" value={formatCurrencyPrecise(stats.adr)} diff={varianceLabel(stats.adr - stats.priorAdr, true)} negative={stats.adr < stats.priorAdr} bg={BRAND.cyan} color={BRAND.yellow} labelColor={`${BRAND.yellow}B3`} />
          <div className="flex h-44 flex-col items-center justify-center rounded-none border border-black/5 p-5 text-center shadow-md transition-transform hover:scale-[1.02]" style={{ backgroundColor: BRAND.powder }}>
            <h3 className="font-khand text-8xl font-bold leading-none tracking-tight" style={{ color: BRAND.blue }}>
              {Math.round(stats.leadDays)}
            </h3>
            <p className="mt-1 font-khand text-xs font-bold uppercase tracking-wider sm:text-sm" style={{ color: BRAND.blue }}>
              LEAD DAYS
            </p>
          </div>
        </section>

            <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="border-[3px] bg-white lg:col-span-2" style={{ borderColor: BRAND.blue }}>
                <SectionHeader title="Performance Summary" badge={`${activeYear} ${periodLabel}`} />
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b-[3px] bg-slate-50 font-khand text-[11px] uppercase tracking-widest text-slate-500" style={{ borderColor: `${BRAND.blue}22` }}>
                      <tr>
                        <th className="px-5 py-4">Stay Month</th>
                        <th className="px-5 py-4">Occupancy</th>
                        <th className="px-5 py-4">Nights</th>
                        <th className="px-5 py-4">ADR</th>
                        <th className="px-5 py-4">Revenue</th>
                        <th className="px-5 py-4 text-right">ALOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.filter((row) => activeMonths.includes(row.month)).map((row) => (
                        <tr key={row.month} className="border-b text-sm" style={{ borderColor: `${BRAND.blue}12` }}>
                          <td className="px-5 py-4 font-bold">{row.month}</td>
                          <td className="px-5 py-4"><span className="inline-flex bg-[#163666] p-2 text-xs font-bold text-[#B2D3DE]">{(row.occupancy * 100).toFixed(1)}%</span></td>
                          <td className="px-5 py-4">{formatNumber(row.nights)}</td>
                          <td className="px-5 py-4 font-bold" style={{ color: BRAND.cyan }}>{formatCurrencyPrecise(row.adr)}</td>
                          <td className="px-5 py-4">{formatCurrency(row.revenue)}</td>
                          <td className="px-5 py-4 text-right text-slate-500">{row.alos.toFixed(1)}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ChannelRevenueMix data={channelBreakdown.slice(0, 8)} />
            </section>

            <section className="border-[3px] bg-white p-7" style={{ borderColor: BRAND.blue }}>
              <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h3 className="font-khand text-xl font-bold uppercase tracking-wider">Monthly Channel Revenue</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">TOTAL CHANNEL REVENUE BY STAY MONTH</p>
                </div>
                <span className="font-khand text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.cyan }}>{activeYear}</span>
              </div>
              <div className="grid min-h-64 grid-cols-12 items-end gap-2">
                {monthly.map((row) => (
                  <div key={row.month} className="flex h-full min-w-0 flex-col justify-end gap-2 text-center">
                    <span className="hidden font-inconsolata text-[10px] font-bold text-slate-500 md:block">{formatCompactUSD(row.revenue)}</span>
                    <div
                      className="mx-auto w-full max-w-12"
                      style={{
                        height: `${Math.max(2, (row.revenue / maxMonthlyRevenue) * 190)}px`,
                        backgroundColor: activeMonths.includes(row.month) ? BRAND.cyan : BRAND.powder,
                      }}
                    />
                    <span className="font-khand text-[10px] font-bold">{row.month}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === "pickup_pace" && (
          <div className="space-y-3">
            <section className="grid w-full select-none grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <KpiCard
                label="PACE VARIANCE"
                value={formatCompactUSD(paceTotals.revenueVariance)}
                diff={`${paceTotals.revenueVariancePct.toFixed(1)}%`}
                negative={paceTotals.revenueVariance < 0}
                bg={BRAND.blue}
                color={BRAND.powder}
                labelColor={`${BRAND.powder}B3`}
              />
              <KpiCard
                label="ADR CHANGE"
                value={formatCurrencyPrecise(paceTotals.adrVariance)}
                diff={paceTotals.stlyAdr > 0 ? `${((paceTotals.adrVariance / paceTotals.stlyAdr) * 100).toFixed(1)}%` : "0.0%"}
                negative={paceTotals.adrVariance < 0}
                bg={BRAND.teal}
                color={BRAND.frost}
                labelColor={`${BRAND.frost}B3`}
              />
              <KpiCard
                label="REVENUE"
                value={formatCompactUSD(paceTotals.tyRevenue)}
                diff={formatCompactUSD(Math.abs(paceTotals.revenueVariance))}
                negative={paceTotals.revenueVariance < 0}
                bg={BRAND.cyan}
                color={BRAND.yellow}
                labelColor={`${BRAND.yellow}B3`}
              />
              <KpiCard
                label="BOOKINGS"
                value={formatNumber(paceTotals.tyBookings)}
                diff={varianceLabel(paceTotals.bookingVariance)}
                negative={paceTotals.bookingVariance < 0}
                bg={BRAND.aqua}
                color={BRAND.teal}
                labelColor={`${BRAND.teal}B3`}
              />
              <div className="flex h-44 flex-col items-center justify-center rounded-none border border-black/5 p-5 text-center shadow-md transition-transform hover:scale-[1.02]" style={{ backgroundColor: BRAND.powder }}>
                <h3 className="font-khand text-8xl font-bold leading-none tracking-tight" style={{ color: BRAND.blue }}>
                  {Math.round(stats.leadDays)}
                </h3>
                <p className="mt-1 font-khand text-sm font-bold uppercase tracking-wider" style={{ color: BRAND.blue }}>
                  LEAD DAYS
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="border-[3px] bg-white p-7 shadow-md" style={{ borderColor: BRAND.blue }}>
                <h3 className="mb-4 font-khand text-xl font-bold uppercase tracking-wider">
                  Revenue Pace ({activeYear} vs. {Number(activeYear) - 1})
                  {selectedPaceSource !== "ALL" ? ` · ${selectedPaceSource}` : ""}
                </h3>
                <PaceComparisonChart data={filteredPaceRows} selectedYear={activeYear} roomsConfig={parsed.rooms} />
              </div>
              <div className="border-[3px] bg-white p-7 shadow-md" style={{ borderColor: BRAND.blue }}>
                <h3 className="mb-4 font-khand text-xl font-bold uppercase tracking-wider">
                  Booking Window Pickup Velocity
                </h3>
                <PickupVelocityChart data={pickupSeries} />
              </div>
            </section>

            <section className="overflow-hidden border-[3px] bg-white shadow-md" style={{ borderColor: BRAND.blue }}>
              <SectionHeader title="Monthly Breakdown" badge={`${activeYear} ${periodLabel} CALENDAR PACING`} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b-[2px] bg-slate-50 font-khand uppercase tracking-widest text-slate-500" style={{ borderColor: `${BRAND.blue}22` }}>
                    <tr>
                      <th className="px-5 py-4">Stay Month</th>
                      <th className="px-4 py-4 text-right">BKGS</th>
                      <th className="px-4 py-4 text-right">STLY BKGS</th>
                      <th className="px-4 py-4 text-right">BKGS +/-</th>
                      <th className="px-4 py-4 text-right">NTS</th>
                      <th className="px-4 py-4 text-right">STLY NTS</th>
                      <th className="px-4 py-4 text-right">NTS +/-</th>
                      <th className="px-4 py-4 text-right">ADR</th>
                      <th className="px-4 py-4 text-right">STLY ADR</th>
                      <th className="px-4 py-4 text-right">ADR +/-</th>
                      <th className="px-4 py-4 text-right">REV</th>
                      <th className="px-4 py-4 text-right">STLY REV</th>
                      <th className="px-4 py-4 text-right">REV +/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaceRows.map((row) => {
                      const bookingsVariance = row.tyBookings - row.stlyBookings;
                      const nightsVariance = row.tyNights - row.stlyNights;
                      const tyAdr = row.tyNights > 0 ? row.tyRevenue / row.tyNights : 0;
                      const stlyAdr = row.stlyNights > 0 ? row.stlyRevenue / row.stlyNights : 0;
                      const adrVariance = tyAdr - stlyAdr;
                      const revenueVariance = row.tyRevenue - row.stlyRevenue;
                      return (
                        <tr key={row.month} className="border-b" style={{ borderColor: `${BRAND.blue}12` }}>
                          <td className="px-5 py-4 font-bold">{row.month}</td>
                          <td className="px-4 py-4 text-right">{formatNumber(row.tyBookings)}</td>
                          <td className="px-4 py-4 text-right text-slate-500">{formatNumber(row.stlyBookings)}</td>
                          <VarianceCell value={bookingsVariance} />
                          <td className="px-4 py-4 text-right">{formatNumber(row.tyNights)}</td>
                          <td className="px-4 py-4 text-right text-slate-500">{formatNumber(row.stlyNights)}</td>
                          <VarianceCell value={nightsVariance} />
                          <td className="px-4 py-4 text-right">{formatCurrencyPrecise(tyAdr)}</td>
                          <td className="px-4 py-4 text-right text-slate-500">{formatCurrencyPrecise(stlyAdr)}</td>
                          <VarianceCell value={adrVariance} currency precise />
                          <td className="px-4 py-4 text-right">{formatCurrency(row.tyRevenue)}</td>
                          <td className="px-4 py-4 text-right text-slate-500">{formatCurrency(row.stlyRevenue)}</td>
                          <VarianceCell value={revenueVariance} currency />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "stay_profiles" && (
          <div className="space-y-3">
            <section className="flex flex-wrap items-center justify-between gap-4 border-[3px] bg-white p-6 shadow-md" style={{ borderColor: BRAND.blue }}>
              <div>
                <h3 className="font-khand text-xl font-bold uppercase tracking-wider">Source Metric</h3>
                <p className="mt-1 text-xs text-slate-500">Distributions update from the selected channel, source, or sub source profile.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex border-[2px] bg-white p-1" style={{ borderColor: BRAND.blue }}>
                  {["CHANNEL", "SOURCE", "SUBSOURCE"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setProfileMetricType(type);
                        setSelectedProfileMetric("ALL");
                      }}
                      className={`px-4 pb-1.5 pt-[8px] font-khand text-xs font-bold uppercase tracking-wider ${
                        profileMetricType === type ? "" : "text-slate-500 hover-text-dynamic"
                      }`}
                      style={profileMetricType === type
                        ? { backgroundColor: BRAND.blue, color: BRAND.powder }
                        : { "--hover-color": BRAND.blue }}
                    >
                      {type === "SUBSOURCE" ? "SUB SOURCE" : type}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen((open) => !open)}
                    className="flex w-[280px] items-center justify-between gap-2 border-[2px] bg-white px-4 pb-2 pt-[10px] font-khand text-sm font-bold uppercase"
                    style={{ borderColor: BRAND.blue, color: BRAND.blue }}
                  >
                    <span className="truncate">{profileMetricType}: {selectedProfileMetric}</span>
                    <ChevronDown size={16} />
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 max-h-56 w-full overflow-y-auto border-[2px] bg-white shadow-xl" style={{ borderColor: BRAND.blue }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProfileMetric("ALL");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left font-khand text-xs font-bold uppercase hover:bg-[#EFF5F6]"
                      >
                        ALL {profileMetricType === "SUBSOURCE" ? "SUB SOURCES" : `${profileMetricType}S`}
                      </button>
                      {profileMetricOptions.map((metric) => (
                        <button
                          key={metric}
                          type="button"
                          onClick={() => {
                            setSelectedProfileMetric(metric);
                            setIsProfileDropdownOpen(false);
                          }}
                          className="block w-full truncate px-4 py-2 text-left font-khand text-xs font-bold uppercase hover:bg-[#EFF5F6]"
                        >
                          {metric}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-12 border-[3px] bg-white p-8 shadow-md md:p-12" style={{ borderColor: BRAND.blue }}>
              {activeProfileRows.length === 0 && (
                <div className="border border-amber-200 bg-amber-50 p-3 font-khand text-xs font-bold uppercase tracking-wider text-amber-800">
                  No profile rows were found for {selectedProfileMetric} during {activeYear} {periodLabel}.
                </div>
              )}
              <ProfileDistribution
                title="Length of Stay"
                data={[
                  { label: "1 NIGHT", value: profilePct("LENGTH_OF_STAY", "1 NIGHT"), style: { backgroundColor: BRAND.blue, color: "#b9c3d1" } },
                  { label: "2 NIGHTS", value: profilePct("LENGTH_OF_STAY", "2 NIGHTS"), style: { backgroundColor: BRAND.teal, color: "#b4d8e0" } },
                  { label: "3 NIGHTS", value: profilePct("LENGTH_OF_STAY", "3 NIGHTS"), style: { backgroundColor: BRAND.cyan, color: "#b3e4e9" } },
                  { label: "4 NIGHTS", value: profilePct("LENGTH_OF_STAY", "4 NIGHTS"), style: { backgroundColor: BRAND.aqua, color: BRAND.blue } },
                  { label: "5 NIGHTS", value: profilePct("LENGTH_OF_STAY", "5 NIGHTS"), style: { backgroundColor: BRAND.powder, color: BRAND.teal } },
                  { label: "6 NIGHTS", value: profilePct("LENGTH_OF_STAY", "6 NIGHTS"), style: { backgroundColor: BRAND.frost, border: `2px solid ${BRAND.cyan}`, color: BRAND.cyan } },
                  { label: "7+ NIGHTS", value: profilePct("LENGTH_OF_STAY", "7+ NIGHTS"), style: { backgroundColor: BRAND.white, border: `2px solid ${BRAND.aqua}`, color: BRAND.aqua } },
                ]}
              />
              <ProfileDistribution
                title="Lead Days"
                data={[
                  { label: "0-3 DAYS", value: profilePct("LEAD_DAYS", "0-3 DAYS"), style: { backgroundColor: BRAND.yellow, color: "#feefd7" } },
                  { label: "4-6 DAYS", value: profilePct("LEAD_DAYS", "4-6 DAYS"), style: { backgroundColor: "#ff914d", color: "#ffdeca" } },
                  { label: "7-14 DAYS", value: profilePct("LEAD_DAYS", "7-14 DAYS"), style: { backgroundColor: BRAND.orange, color: "#fbd8cd" } },
                  { label: "15-29 DAYS", value: profilePct("LEAD_DAYS", "15-29 DAYS"), style: { backgroundColor: BRAND.red, color: BRAND.yellow } },
                  { label: "30-60 DAYS", value: profilePct("LEAD_DAYS", ["30-60 DAYS", "30-45 DAYS"]), style: { backgroundColor: "#cf3b4b", color: "#ff914d" } },
                  { label: "61-90 DAYS", value: profilePct("LEAD_DAYS", "61-90 DAYS"), style: { backgroundColor: "#b4126d", color: BRAND.orange } },
                  { label: "91+ DAYS", value: profilePct("LEAD_DAYS", "91+ DAYS"), style: { backgroundColor: BRAND.purple, color: BRAND.red } },
                ]}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, diff, negative, bg, color, labelColor }) {
  return (
    <div className="flex h-44 flex-col justify-between rounded-none border border-black/5 p-5 shadow-md transition-transform hover:scale-[1.02]" style={{ backgroundColor: bg }}>
      <span className="font-khand text-lg font-bold uppercase tracking-wider" style={{ color: labelColor }}>
        {label}
      </span>
      <div className="-mt-4 flex flex-col gap-0.5">
        <span className="font-khand text-4xl font-bold uppercase leading-none tracking-normal md:text-5xl" style={{ color }}>
          {value}
        </span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <ChangeIndicator isNegative={negative} color={color} background={bg} />
          <span className="font-roboto text-sm font-medium tracking-normal" style={{ color }}>
            {diff} VS STLY
          </span>
        </div>
      </div>
    </div>
  );
}

function ChangeIndicator({ isNegative, color, background }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: color }}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ transform: isNegative ? "rotate(180deg)" : "rotate(0deg)" }} aria-hidden="true">
        <path d="M 12 3 L 5 11 H 8.5 V 21 H 15.5 V 11 H 19 Z" fill={background} />
      </svg>
    </div>
  );
}

function ChannelRevenueMix({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="border-[3px] bg-white p-7" style={{ borderColor: BRAND.blue }}>
      <h3 className="mb-7 font-khand text-xl font-bold uppercase tracking-wider">Channel Revenue Mix</h3>
      <div className="space-y-5">
        {data.map((row, index) => {
          const color = [BRAND.blue, BRAND.teal, BRAND.cyan, BRAND.aqua, BRAND.purple, BRAND.orange][index % 6];
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={row.metric}
              className="relative outline-none"
              tabIndex={0}
              aria-label={`${row.metric}: ${formatNumber(row.nights)} nights, ${formatCurrency(row.revenue)} revenue, ${formatCurrencyPrecise(row.adr)} ADR, ${(row.mix * 100).toFixed(1)} percent revenue mix`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
            >
              <div className="mb-1 flex items-end justify-between gap-3">
                <span className="truncate font-khand text-xs font-bold uppercase tracking-wide">{row.metric}</span>
                <span className="font-inconsolata text-sm font-bold">{(row.mix * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3" style={{ backgroundColor: BRAND.frost }}>
                <div
                  className="h-full transition-[width,filter] duration-150"
                  style={{
                    width: `${Math.max(1, row.mix * 100)}%`,
                    backgroundColor: color,
                    filter: isHovered ? "brightness(1.08)" : "none",
                  }}
                />
              </div>
              {isHovered && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-30 min-w-[205px] border-[2px] bg-white/95 p-3 text-left shadow-xl"
                  style={{ borderColor: color }}
                >
                  <p className="mb-2 border-b border-slate-100 pb-1 font-khand text-xs font-bold uppercase" style={{ color: BRAND.blue }}>
                    {row.metric}
                  </p>
                  <div className="space-y-1.5 font-roboto text-xs">
                    <TooltipRow label="Nights" value={formatNumber(row.nights)} />
                    <TooltipRow label="Revenue" value={formatCurrency(row.revenue)} valueColor={BRAND.cyan} />
                    <TooltipRow label="ADR" value={formatCurrencyPrecise(row.adr)} />
                    <TooltipRow label="Revenue Mix" value={`${(row.mix * 100).toFixed(1)}%`} valueColor={color} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TooltipRow({ label, value, varianceValue, variancePositive = true, valueColor = BRAND.blue }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-slate-500">{label}:</span>
      <span className="text-right">
        <strong style={{ color: valueColor }}>{value}</strong>
        {varianceValue !== undefined && (
          <span
            className="ml-1 text-[11px] font-bold"
            style={{ color: variancePositive ? BRAND.cyan : BRAND.red }}
          >
            ({variancePositive ? "+" : "−"}{varianceValue})
          </span>
        )}
      </span>
    </div>
  );
}

function PaceComparisonChart({ data, selectedYear, roomsConfig = 188 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const maxRevenue = Math.max(
    ...data.map((row) => Math.max(row.tyRevenue, row.stlyRevenue)),
    1,
  );
  const hasData = data.some((row) => row.tyRevenue || row.stlyRevenue);
  const hoveredRow = hoveredIndex === null ? null : data[hoveredIndex];
  const tooltipData = hoveredRow ? (() => {
    const capacity = daysInMonth(selectedYear, hoveredRow.month) * roomsConfig;
    const tyAdr = hoveredRow.tyNights > 0 ? hoveredRow.tyRevenue / hoveredRow.tyNights : 0;
    const stlyAdr = hoveredRow.stlyNights > 0 ? hoveredRow.stlyRevenue / hoveredRow.stlyNights : 0;
    const tyOccupancy = capacity > 0 ? (hoveredRow.tyNights / capacity) * 100 : 0;
    const stlyOccupancy = capacity > 0 ? (hoveredRow.stlyNights / capacity) * 100 : 0;
    return {
      ...hoveredRow,
      tyAdr,
      stlyAdr,
      tyOccupancy,
      stlyOccupancy,
    };
  })() : null;
  const tooltipStatusLabel = tooltipData?.periodStatus === "ACTUAL"
    ? "ACTUAL"
    : tooltipData?.periodStatus === "ACTUAL_OTB"
      ? "ACTUAL + OTB"
      : "OTB";

  if (!hasData) {
    return (
      <div className="flex min-h-64 items-center justify-center font-khand text-xs font-bold uppercase tracking-widest text-slate-400">
        No source pace data found
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <div className="flex min-h-72 min-w-[720px] items-end gap-3 border-b px-2 pt-6" style={{ borderColor: `${BRAND.blue}22` }}>
        {data.map((row, index) => (
          <div
            key={row.month}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2 outline-none"
            tabIndex={0}
            aria-label={`${row.month} OTB versus STLY pacing`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
          >
            <span className="font-inconsolata text-[9px] font-bold text-slate-500">
              {formatCompactUSD(row.tyRevenue)}
            </span>
            <div className="flex h-48 w-full items-end justify-center gap-1">
              <div
                className="w-[38%] min-w-3"
                style={{
                  height: `${Math.max(2, (row.tyRevenue / maxRevenue) * 190)}px`,
                  backgroundColor: BRAND.teal,
                  outline: hoveredIndex === index ? `1px solid ${BRAND.blue}` : "none",
                }}
              />
              <div
                className="w-[38%] min-w-3"
                style={{
                  height: `${Math.max(2, (row.stlyRevenue / maxRevenue) * 190)}px`,
                  backgroundColor: BRAND.aqua,
                  outline: hoveredIndex === index ? `1px solid ${BRAND.blue}` : "none",
                }}
              />
            </div>
            <span className="font-khand text-[11px] font-bold uppercase">{row.month}</span>
          </div>
        ))}
        </div>
      </div>
      {tooltipData && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-3 z-30 min-w-[230px] -translate-x-1/2 border-[2px] bg-white/95 p-3 text-left shadow-xl"
          style={{
            borderColor: BRAND.teal,
            left: `${Math.min(Math.max(((hoveredIndex + 0.5) / data.length) * 100, 20), 78)}%`,
          }}
        >
          <p className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-1 font-khand text-xs font-bold uppercase" style={{ color: BRAND.blue }}>
            <span>{tooltipData.month} PACING ({selectedYear})</span>
            <span className="bg-[#047C97] px-1.5 py-0.5 text-[10px] text-white">{tooltipStatusLabel} VS STLY</span>
          </p>
          <div className="space-y-1.5 font-roboto text-xs">
            <TooltipRow
              label={`Occupancy ${tooltipStatusLabel}`}
              value={`${tooltipData.tyOccupancy.toFixed(1)}%`}
              varianceValue={`${Math.abs(tooltipData.tyOccupancy - tooltipData.stlyOccupancy).toFixed(1)}%`}
              variancePositive={tooltipData.tyOccupancy - tooltipData.stlyOccupancy >= 0}
            />
            <TooltipRow
              label={`Nights ${tooltipStatusLabel}`}
              value={formatNumber(tooltipData.tyNights)}
              varianceValue={formatNumber(Math.abs(tooltipData.tyNights - tooltipData.stlyNights))}
              variancePositive={tooltipData.tyNights - tooltipData.stlyNights >= 0}
            />
            <TooltipRow
              label={`ADR ${tooltipStatusLabel}`}
              value={formatCurrencyPrecise(tooltipData.tyAdr)}
              varianceValue={formatCurrencyPrecise(Math.abs(tooltipData.tyAdr - tooltipData.stlyAdr))}
              variancePositive={tooltipData.tyAdr - tooltipData.stlyAdr >= 0}
            />
            <TooltipRow
              label={`Revenue ${tooltipStatusLabel}`}
              value={formatCurrency(tooltipData.tyRevenue)}
              valueColor={BRAND.teal}
              varianceValue={formatCurrency(Math.abs(tooltipData.tyRevenue - tooltipData.stlyRevenue))}
              variancePositive={tooltipData.tyRevenue - tooltipData.stlyRevenue >= 0}
            />
          </div>
        </div>
      )}
      <div className="mt-4 flex justify-center gap-6 font-khand text-xs font-bold uppercase">
        <span className="flex items-center gap-2"><i className="h-3 w-3" style={{ backgroundColor: BRAND.teal }} />Current Revenue</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3" style={{ backgroundColor: BRAND.aqua }} />STLY Revenue</span>
      </div>
    </div>
  );
}

function PickupVelocityChart({ data }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const width = 620;
  const height = 270;
  const padding = { left: 44, right: 26, top: 24, bottom: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxRooms = Math.max(...data.map((row) => row.rooms), 1);
  const maxRevenue = Math.max(...data.map((row) => row.revenue), 1);
  const hasData = data.some((row) => row.rooms || row.revenue);
  const points = data.map((row, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const roomsY = padding.top + chartHeight - (row.rooms / maxRooms) * chartHeight;
    const revenueY = padding.top + chartHeight - (row.revenue / maxRevenue) * chartHeight;
    const previous = index > 0 ? data[index - 1] : null;
    const realizedRooms = data[data.length - 1]?.rooms || maxRooms;
    return {
      ...row,
      x,
      roomsY,
      revenueY,
      pickupPct: realizedRooms > 0 ? (row.rooms / realizedRooms) * 100 : 0,
      roomsChange: previous ? row.rooms - previous.rooms : 0,
      revenueChange: previous ? row.revenue - previous.revenue : 0,
      adrChange: previous ? row.adr - previous.adr : 0,
    };
  });
  const pathFor = (key) =>
    points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point[key]}`).join(" ");
  const activePoint = hoveredPoint ? points[hoveredPoint.index] : null;

  if (!hasData) {
    return (
      <div className="flex min-h-64 items-center justify-center font-khand text-xs font-bold uppercase tracking-widest text-slate-400">
        No source pickup data found
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label="Booking-window room nights and revenue pickup">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#dbe4e8" strokeDasharray="4 4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="9" fill={BRAND.cyan}>{Math.round(ratio * 100)}%</text>
              <text x={width - padding.right + 5} y={y + 4} textAnchor="start" fontSize="9" fill={BRAND.orange}>{formatCompactUSD(maxRevenue * ratio)}</text>
            </g>
          );
        })}
        <path d={pathFor("roomsY")} fill="none" stroke={BRAND.cyan} strokeWidth="4" />
        <path d={pathFor("revenueY")} fill="none" stroke={BRAND.orange} strokeWidth="4" />
        {points.map((point, index) => (
          <g key={point.days}>
            <circle
              cx={point.x}
              cy={point.roomsY}
              r={hoveredPoint?.index === index && hoveredPoint.type === "rooms" ? 8 : 5}
              fill={BRAND.cyan}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="cursor-pointer outline-none transition-all"
              tabIndex={0}
              aria-label={`${point.days} days out: ${formatNumber(point.rooms)} room nights`}
              onMouseEnter={() => setHoveredPoint({ index, type: "rooms" })}
              onMouseLeave={() => setHoveredPoint(null)}
              onFocus={() => setHoveredPoint({ index, type: "rooms" })}
              onBlur={() => setHoveredPoint(null)}
            />
            <circle
              cx={point.x}
              cy={point.revenueY}
              r={hoveredPoint?.index === index && hoveredPoint.type === "revenue" ? 8 : 5}
              fill={BRAND.orange}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="cursor-pointer outline-none transition-all"
              tabIndex={0}
              aria-label={`${point.days} days out: ${formatCurrency(point.revenue)} revenue`}
              onMouseEnter={() => setHoveredPoint({ index, type: "revenue" })}
              onMouseLeave={() => setHoveredPoint(null)}
              onFocus={() => setHoveredPoint({ index, type: "revenue" })}
              onBlur={() => setHoveredPoint(null)}
            />
            <text x={point.x} y={height - 14} textAnchor="middle" fontSize="10" fontWeight="700" fill={BRAND.blue}>
              {point.days === 0 ? "OTB" : `${point.days}D`}
            </text>
          </g>
        ))}
      </svg>
      {activePoint && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-30 min-w-[205px] -translate-x-1/2 border-[2px] bg-white/95 p-3 text-left shadow-xl"
          style={{
            borderColor: hoveredPoint.type === "rooms" ? BRAND.cyan : BRAND.orange,
            left: `${Math.min(Math.max((activePoint.x / width) * 100, 18), 80)}%`,
            top: `${Math.min(Math.max((((hoveredPoint.type === "rooms" ? activePoint.roomsY : activePoint.revenueY) / height) * 100) - 38, 2), 48)}%`,
          }}
        >
          <p className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-1 font-khand text-xs font-bold uppercase" style={{ color: BRAND.blue }}>
            <span>{activePoint.days === 0 ? "SAME DAY (0D)" : `${activePoint.days} DAYS OUT`}</span>
            <span
              className="px-1.5 py-0.5 text-[10px] text-white"
              style={{ backgroundColor: hoveredPoint.type === "rooms" ? BRAND.cyan : BRAND.orange }}
            >
              {hoveredPoint.type === "rooms" ? "ROOM NIGHTS" : "REVENUE"}
            </span>
          </p>
          <div className="space-y-1.5 font-roboto text-xs">
            {hoveredPoint.type === "rooms" ? (
              <>
                <TooltipRow label="Pickup %" value={`${activePoint.pickupPct.toFixed(1)}%`} valueColor={BRAND.cyan} />
                <TooltipRow label="Room Nights" value={formatNumber(activePoint.rooms)} />
                <TooltipRow
                  label="Nights Pickup"
                  value={`${activePoint.roomsChange >= 0 ? "+" : "−"}${formatNumber(Math.abs(activePoint.roomsChange))}`}
                  valueColor={activePoint.roomsChange >= 0 ? BRAND.cyan : BRAND.red}
                />
              </>
            ) : (
              <>
                <TooltipRow label="Revenue" value={formatCurrency(activePoint.revenue)} valueColor={BRAND.orange} />
                <TooltipRow
                  label="Revenue Pickup"
                  value={`${activePoint.revenueChange >= 0 ? "+" : "−"}${formatCurrency(Math.abs(activePoint.revenueChange))}`}
                  valueColor={activePoint.revenueChange >= 0 ? BRAND.cyan : BRAND.red}
                />
                <TooltipRow label="ADR" value={formatCurrencyPrecise(activePoint.adr)} />
                <TooltipRow
                  label="ADR Change"
                  value={`${activePoint.adrChange >= 0 ? "+" : "−"}${formatCurrencyPrecise(Math.abs(activePoint.adrChange))}`}
                  valueColor={activePoint.adrChange >= 0 ? BRAND.cyan : BRAND.red}
                />
              </>
            )}
          </div>
        </div>
      )}
      <div className="mt-2 flex justify-center gap-6 font-khand text-xs font-bold uppercase">
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: BRAND.cyan }} />Room Nights</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: BRAND.orange }} />Revenue</span>
      </div>
    </div>
  );
}

function VarianceCell({ value, currency = false, precise = false }) {
  const absolute = Math.abs(value);
  const formatted = currency
    ? (precise ? formatCurrencyPrecise(absolute) : formatCurrency(absolute))
    : formatNumber(absolute);
  return (
    <td className="px-4 py-4 text-right font-bold" style={{ color: value >= 0 ? BRAND.cyan : BRAND.red }}>
      {value >= 0 ? `+${formatted}` : `(${formatted})`}
    </td>
  );
}

function ProfileDistribution({ title, data }) {
  return (
    <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-10 last:border-b-0 last:pb-0 lg:flex-row lg:items-center">
      <h4 className="w-full shrink-0 font-khand text-xl font-bold uppercase tracking-wider lg:max-w-xs" style={{ color: BRAND.blue }}>
        {title}
      </h4>
      <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
        {data.map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="mb-1 whitespace-nowrap font-khand text-xs font-bold uppercase sm:text-sm" style={{ color: BRAND.blue }}>
              {item.label}
            </span>
            <div className="flex aspect-square w-full items-center justify-center shadow-sm transition-transform hover:scale-105" style={item.style}>
              <span className="font-khand text-2xl font-bold leading-none md:text-3xl" style={{ color: item.style.color }}>
                {item.value.toFixed(0).padStart(2, "0")}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-[3px] p-6" style={{ borderColor: BRAND.blue }}>
      <h3 className="font-khand text-lg font-bold uppercase tracking-wider">{title}</h3>
      <span className="px-3 pb-1 pt-[6px] font-khand text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: BRAND.cyan, color: BRAND.yellow }}>{badge}</span>
    </div>
  );
}
