import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Filter, 
  ChevronRight, 
  Calendar,
  Layers
} from 'lucide-react';

export default function App({ data = [] }) {
  // Brand Color Palette Constants
  const BRAND_COLORS = {
    primary: "#163666",
    teal: "#047C97",
    cyan: "#00A6B6",
    aqua: "#71C9C5",
    powder: "#B2D3DE",
    yellow: "#FACA78",
    orange: "#F37D59",
    red: "#E05047",
    purple: "#8E456A",
    frost: "#EFF5F6",
    white: "#fafafa"
  };

  const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Inline CSS Font Imports and Custom Class Definitions
  const fontStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@700;800;900&family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
    .font-inconsolata { font-family: 'Inconsolata', monospace; font-variation-settings: "wdth" 87.5; }
    .font-khand { font-family: 'Khand', sans-serif; }
    .font-roboto { font-family: 'Roboto', sans-serif; }
    .group:hover .group-hover-text-dynamic { color: var(--group-hover-color); }
    .hover-bg-dynamic:hover { background-color: var(--hover-bg-color); }
    .hover-text-dynamic:hover { color: var(--hover-color) !important; }
  `;

  // Inline Utility Functions
  const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
  const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Math.round(val || 0));
  const formatPreciseCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  const formatCompact = (val) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val || 0);
  const formatCompactUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(val || 0);

  // State Management
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('YEAR');
  const [dowSegmentFilter, setDowSegmentFilter] = useState('TOTAL');
  const [dowMonthFilter, setDowMonthFilter] = useState('YEAR');
  const [selectedBehaviorSegment, setSelectedBehaviorSegment] = useState('ALL');
  const [hoveredDay, setHoveredDay] = useState(null);

  // Dataset Parsing Hook
  const parsedData = useMemo(() => {
    const result = {
      rows: [],
      segmentRows: [],
      profileRows: [],
      years: ['2026', '2025'],
      roomsConfig: 188,
      propertyName: "REBEL HOTEL",
      parsedDOW: [],
      paceRows: []
    };

    if (!data || !Array.isArray(data) || data.length === 0) return result;

    const headers = data[0]?.row || [];
    const findCol = (str) => headers.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());
    const findProfileCol = (patterns) => headers.findIndex(h => {
      const clean = safeString(h).toLowerCase().replace(/[^a-z0-9]/g, '_');
      return patterns.some(p => clean.includes(p));
    });

    const map = {
      property: findCol("PROPERTY"),
      rooms: findCol("ROOMS"),
      segmentYear: findCol("segment_year"),
      segmentMonth: findCol("segment_stay_month"),
      segmentMetric: findCol("segment_metric"),
      segmentResn: findCol("segment_no_resn"),
      segmentNights: findCol("segment_nights"),
      segmentRev: findCol("segment_revenue"),
      segmentADR: findCol("segment_adr"),
      segmentALOS: findCol("segment_alos"),
      segmentLead: findCol("segment_lead_days"),
      paceYear: findCol("pace_year"),
      paceMonth: findCol("pace_stay_month"),
      paceMetricType: findCol("pace_metric_type"),
      paceMetric: findCol("pace_metric"),
      paceTYRev: findCol("pace_ty_revenue"),
      paceSTLYRev: findCol("pace_stly_revenue"),
      dowYear: findCol("dow_year"),
      dowMonth: findCol("dow_stay_month"),
      dowMetric: findCol("dow_metric"),
      dowSun: findCol("dow_sun"), dowMon: findCol("dow_mon"), dowTue: findCol("dow_tue"),
      dowWed: findCol("dow_wed"), dowThu: findCol("dow_thu"), dowFri: findCol("dow_fri"), dowSat: findCol("dow_sat"),
      profileYear: findProfileCol(["profile_year"]),
      profileMonth: findProfileCol(["profile_stay_month", "profile_month"]),
      profileMetricType: findProfileCol(["profile_metric_type"]),
      profileMetric: findProfileCol(["profile_metric"]),
      profileStay1: findProfileCol(["profile_stay_1_night", "profile_stay_1"]),
      profileStay2: findProfileCol(["profile_stay_2_nights", "profile_stay_2"]),
      profileStay3: findProfileCol(["profile_stay_3_nights", "profile_stay_3"]),
      profileStay4: findProfileCol(["profile_stay_4_nights", "profile_stay_4"]),
      profileStay5: findProfileCol(["profile_stay_5_nights", "profile_stay_5"]),
      profileStay6: findProfileCol(["profile_stay_6_nights", "profile_stay_6"]),
      profileStay7Plus: findProfileCol(["profile_stay_7_plus_nights", "profile_stay_7"]),
      profileLead0_3: findProfileCol(["profile_lead_0_3_days", "profile_lead_0_3"]),
      profileLead4_6: findProfileCol(["profile_lead_4_6_days", "profile_lead_4_6"]),
      profileLead7_14: findProfileCol(["profile_lead_7_14_days", "profile_lead_7_14"]),
      profileLead15_29: findProfileCol(["profile_lead_15_29_days", "profile_lead_15_29"]),
      profileLead30_45: findProfileCol(["profile_lead_30_45_days", "profile_lead_30_45"]),
      profileLead61_90: findProfileCol(["profile_lead_61_90_days", "profile_lead_61_90"]),
      profileLead91Plus: findProfileCol(["profile_lead_91_plus_days", "profile_lead_91"])
    };

    if (data[2]?.row) {
      if (map.property !== -1 && data[2].row[map.property]) result.propertyName = safeString(data[2].row[map.property]);
      if (map.rooms !== -1 && !isNaN(Number(data[2].row[map.rooms]))) result.roomsConfig = Number(data[2].row[map.rooms]);
    }

    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (!r) return;

      if (map.segmentYear !== -1 && r[map.segmentYear]) {
        const yr = Number(r[map.segmentYear]);
        if (!isNaN(yr) && yr > 2000) {
          const entry = {
            year: yr,
            month: safeString(r[map.segmentMonth]).toUpperCase(),
            metric: safeString(r[map.segmentMetric]).toUpperCase() || 'TOTAL',
            resn: Number(r[map.segmentResn]) || 0,
            nights: Number(r[map.segmentNights]) || 0,
            revenue: Number(r[map.segmentRev]) || 0,
            adr: Number(r[map.segmentADR]) || 0,
            alos: Number(r[map.segmentALOS]) || 0,
            lead: Number(r[map.segmentLead]) || 0
          };
          result.rows.push(entry);
          result.segmentRows.push(entry);
        }
      }

      if (map.profileYear !== -1 && r[map.profileYear]) {
        const yr = Number(r[map.profileYear]);
        if (!isNaN(yr) && yr > 2000) {
          result.profileRows.push({
            year: yr,
            month: safeString(r[map.profileMonth]).toUpperCase(),
            metricType: safeString(r[map.profileMetricType]).toUpperCase(),
            metric: safeString(r[map.profileMetric]).toUpperCase(),
            stay1: Number(r[map.profileStay1]) || 0, stay2: Number(r[map.profileStay2]) || 0,
            stay3: Number(r[map.profileStay3]) || 0, stay4: Number(r[map.profileStay4]) || 0,
            stay5: Number(r[map.profileStay5]) || 0, stay6: Number(r[map.profileStay6]) || 0,
            stay7Plus: Number(r[map.profileStay7Plus]) || 0,
            lead0_3: Number(r[map.profileLead0_3]) || 0, lead4_6: Number(r[map.profileLead4_6]) || 0,
            lead7_14: Number(r[map.profileLead7_14]) || 0, lead15_29: Number(r[map.profileLead15_29]) || 0,
            lead30_45: Number(r[map.profileLead30_45]) || 0, lead61_90: Number(r[map.profileLead61_90]) || 0,
            lead91Plus: Number(r[map.profileLead91Plus]) || 0
          });
        }
      }

      if (map.paceYear !== -1 && r[map.paceYear]) {
        const yr = Number(r[map.paceYear]);
        if (!isNaN(yr) && yr > 2000) {
          result.paceRows.push({
            year: yr,
            month: safeString(r[map.paceMonth]).toUpperCase(),
            metricType: safeString(r[map.paceMetricType]).toUpperCase(),
            metric: safeString(r[map.paceMetric]).toUpperCase(),
            ty: Number(r[map.paceTYRev]) || 0,
            stly: Number(r[map.paceSTLYRev]) || 0
          });
        }
      }

      if (map.dowYear !== -1 && r[map.dowYear]) {
        const yr = Number(r[map.dowYear]);
        if (!isNaN(yr) && yr > 2000) {
          result.parsedDOW.push({
            year: yr,
            month: safeString(r[map.dowMonth]).toUpperCase(),
            metric: safeString(r[map.dowMetric]).toUpperCase(),
            sun: Number(r[map.dowSun]) || 0, mon: Number(r[map.dowMon]) || 0, tue: Number(r[map.dowTue]) || 0,
            wed: Number(r[map.dowWed]) || 0, thu: Number(r[map.dowThu]) || 0, fri: Number(r[map.dowFri]) || 0, sat: Number(r[map.dowSat]) || 0
          });
        }
      }
    });

    const yrSet = new Set(result.rows.map(r => String(r.year)));
    if (yrSet.size > 0) result.years = Array.from(yrSet).sort().reverse();

    return result;
  }, [data]);

  const { rows, segmentRows, profileRows, years, roomsConfig, propertyName, parsedDOW, paceRows } = parsedData;

  useEffect(() => {
    if (years.length > 0 && (!selectedYear || !years.includes(selectedYear))) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const activeMonthsList = useMemo(() => {
    if (selectedMonth === 'YEAR') return MONTH_ORDER;
    if (selectedMonth === 'YTD') return ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
    return [selectedMonth];
  }, [selectedMonth]);

  // Aggregate Top KPI Card Statistics
  const monthlyTotals = useMemo(() => {
    return rows
      .filter(r => String(r.year) === selectedYear && r.metric === 'TOTAL')
      .map(r => {
        let days = 30;
        if (["JAN", "MAR", "MAY", "JUL", "AUG", "OCT", "DEC"].includes(r.month)) days = 31;
        else if (r.month === "FEB") days = 28;
        return { ...r, occupancy: (days > 0 && roomsConfig > 0) ? (r.nights / (days * roomsConfig)) : 0 };
      })
      .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
  }, [rows, selectedYear, roomsConfig]);

  const stlyData = useMemo(() => {
    const prevYear = String(Number(selectedYear) - 1);
    return rows
      .filter(r => String(r.year) === prevYear && r.metric === 'TOTAL')
      .map(r => {
        let days = 30;
        if (["JAN", "MAR", "MAY", "JUL", "AUG", "OCT", "DEC"].includes(r.month)) days = 31;
        else if (r.month === "FEB") days = 28;
        return { ...r, occupancy: (days > 0 && roomsConfig > 0) ? (r.nights / (days * roomsConfig)) : 0 };
      });
  }, [rows, selectedYear, roomsConfig]);

  const stats = useMemo(() => {
    const activeData = monthlyTotals.filter(m => activeMonthsList.includes(m.month));
    const totalRev = activeData.reduce((acc, d) => acc + d.revenue, 0);
    const totalNights = activeData.reduce((acc, d) => acc + d.nights, 0);
    const avgADR = totalNights > 0 ? totalRev / totalNights : 0;
    const totalLead = activeData.length > 0 ? activeData.reduce((acc, d) => acc + d.lead, 0) / activeData.length : 0;

    const daysInPeriod = activeMonthsList.reduce((acc, m) => acc + (m === "FEB" ? 28 : ["JAN", "MAR", "MAY", "JUL", "AUG", "OCT", "DEC"].includes(m) ? 31 : 30), 0);
    const occupancy = (daysInPeriod > 0 && roomsConfig > 0) ? (totalNights / (daysInPeriod * roomsConfig)) : 0;

    const activeStly = stlyData.filter(m => activeMonthsList.includes(m.month));
    const stlyRev = activeStly.reduce((acc, d) => acc + d.revenue, 0);
    const stlyNights = activeStly.reduce((acc, d) => acc + d.nights, 0);
    const stlyADR = stlyNights > 0 ? stlyRev / stlyNights : 0;
    const stlyOccupancy = (daysInPeriod > 0 && roomsConfig > 0) ? (stlyNights / (daysInPeriod * roomsConfig)) : 0;

    return { totalRev, stlyRev, totalNights, stlyNights, avgADR, stlyADR, occupancy, stlyOccupancy, totalLead };
  }, [monthlyTotals, stlyData, activeMonthsList, roomsConfig]);

  // Day of Week Occupancy Computations
  const dynamicSegments = useMemo(() => {
    const set = new Set();
    parsedDOW.forEach(d => { if (d.metric && d.metric.toUpperCase() !== 'TOTAL') set.add(d.metric); });
    if (set.size === 0) segmentRows.forEach(s => { if (s.metric && s.metric.toUpperCase() !== 'TOTAL') set.add(s.metric); });
    return Array.from(set).sort();
  }, [parsedDOW, segmentRows]);

  const computedDOW = useMemo(() => {
    let activeDowRows = parsedDOW.filter(d => String(d.year) === String(selectedYear));
    if (dowMonthFilter !== 'YEAR') activeDowRows = activeDowRows.filter(d => String(d.month).toUpperCase() === String(dowMonthFilter).toUpperCase());
    if (dowSegmentFilter === 'TOTAL') activeDowRows = activeDowRows.filter(d => String(d.metric).toUpperCase() === 'TOTAL');
    else activeDowRows = activeDowRows.filter(d => String(d.metric).toUpperCase().includes(String(dowSegmentFilter).toUpperCase()));

    if (activeDowRows.length > 0) {
      const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const sums = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };
      activeDowRows.forEach(row => days.forEach(day => sums[day] += (row[day] || 0)));
      const count = activeDowRows.length;
      return {
        SUN: Math.round(sums.sun / count), MON: Math.round(sums.mon / count), TUE: Math.round(sums.tue / count),
        WED: Math.round(sums.wed / count), THU: Math.round(sums.thu / count), FRI: Math.round(sums.fri / count), SAT: Math.round(sums.sat / count)
      };
    }
    return { SUN: 46, MON: 44, TUE: 53, WED: 54, THU: 50, FRI: 58, SAT: 62 };
  }, [parsedDOW, dowSegmentFilter, dowMonthFilter, selectedYear]);

  // Pace vs STLY Computations
  const displayPaceSegments = useMemo(() => {
    const segmentMap = {};
    const filteredPace = paceRows.filter(r => activeMonthsList.includes(r.month) && r.metric && r.metric.toUpperCase() !== 'TOTAL');

    if (filteredPace.length > 0) {
      filteredPace.forEach(r => {
        if (!segmentMap[r.metric]) segmentMap[r.metric] = { name: r.metric, actual: 0, stly: 0 };
        segmentMap[r.metric].actual += (r.ty || 0);
        segmentMap[r.metric].stly += (r.stly || 0);
      });
    }

    return Object.values(segmentMap).map(s => ({
      name: s.name, actual: s.actual, variance: s.stly > 0 ? ((s.actual - s.stly) / s.stly) * 100 : 0
    })).sort((a, b) => b.actual - a.actual);
  }, [paceRows, activeMonthsList]);

  // Segment Revenue Mix Computations
  const aggregatedSegments = useMemo(() => {
    const filtered = rows.filter(r => 
      String(r.year) === selectedYear && 
      r.metric !== 'TOTAL' && r.metric !== 'COMPLIMENTARY' &&
      activeMonthsList.includes(r.month)
    );

    const segmentMap = {};
    filtered.forEach(row => {
      const key = row.metric;
      if (!segmentMap[key]) segmentMap[key] = { metric: key, revenue: 0, nights: 0 };
      segmentMap[key].revenue += (row.revenue || 0);
      segmentMap[key].nights += (row.nights || 0);
    });

    return Object.values(segmentMap).sort((a, b) => b.revenue - a.revenue);
  }, [rows, selectedYear, activeMonthsList]);

  // Guest Behavior Profiles - RESTORED ORIGINAL COLOR PALETTES
  const activeBehaviorSet = useMemo(() => {
    let dataset = profileRows.length > 0 ? profileRows : [];
    let list = dataset.filter(r => String(r.year) === String(selectedYear) && activeMonthsList.includes(r.month));

    if (selectedBehaviorSegment === 'ALL') {
      const totalsOnly = list.filter(r => r.metricType === 'TOTAL' || r.metric === 'TOTAL');
      if (totalsOnly.length > 0) return totalsOnly;
      return list;
    } else {
      const target = selectedBehaviorSegment.toUpperCase();
      return list.filter(r => (r.metricType === 'SEGMENT' || !r.metricType) && (r.metric.toUpperCase() === target || r.metric.toUpperCase().includes(target)));
    }
  }, [profileRows, selectedYear, activeMonthsList, selectedBehaviorSegment]);

  const behaviorSegmentOptions = useMemo(() => {
    const set = new Set();
    profileRows.forEach(r => { if (r.metric && r.metric.toUpperCase() !== 'TOTAL' && r.metric.toUpperCase() !== 'COMPLIMENTARY') set.add(r.metric); });
    if (set.size === 0) segmentRows.forEach(r => { if (r.metric && r.metric.toUpperCase() !== 'TOTAL' && r.metric.toUpperCase() !== 'COMPLIMENTARY') set.add(r.metric); });
    return Array.from(set).sort();
  }, [profileRows, segmentRows]);

  // Restored LOS Style Palette
  const losData = useMemo(() => {
    const losStyles = [
      { key: "1 NIGHT", style: { backgroundColor: BRAND_COLORS.primary, color: '#b9c3d1' } },
      { key: "2 NIGHTS", style: { backgroundColor: BRAND_COLORS.teal, color: '#b4d8e0' } },
      { key: "3 NIGHTS", style: { backgroundColor: BRAND_COLORS.cyan, color: '#b3e4e9' } },
      { key: "4 NIGHTS", style: { backgroundColor: BRAND_COLORS.aqua, color: BRAND_COLORS.primary } },
      { key: "5 NIGHTS", style: { backgroundColor: BRAND_COLORS.powder, color: BRAND_COLORS.teal } },
      { key: "6 NIGHTS", style: { backgroundColor: BRAND_COLORS.frost, border: `2px solid ${BRAND_COLORS.cyan}`, color: BRAND_COLORS.cyan } },
      { key: "7+ NIGHTS", style: { backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.aqua}`, color: BRAND_COLORS.aqua } }
    ];

    const sums = { stay1: 0, stay2: 0, stay3: 0, stay4: 0, stay5: 0, stay6: 0, stay7Plus: 0 };
    activeBehaviorSet.forEach(r => Object.keys(sums).forEach(k => sums[k] += (r[k] || 0)));
    const total = Object.values(sums).reduce((a, b) => a + b, 0);

    const keys = ['stay1', 'stay2', 'stay3', 'stay4', 'stay5', 'stay6', 'stay7Plus'];
    if (total === 0) {
      const fallbackPcts = [28, 22, 21, 12, 7, 4, 6];
      return losStyles.map((item, i) => ({ ...item, pct: fallbackPcts[i] }));
    }

    return losStyles.map((item, i) => ({
      ...item,
      pct: Math.round((sums[keys[i]] / total) * 100)
    }));
  }, [activeBehaviorSet, BRAND_COLORS]);

  // Restored Lead Days Style Palette
  const leadData = useMemo(() => {
    const leadStyles = [
      { key: "0-3 DAYS", style: { backgroundColor: BRAND_COLORS.yellow, color: '#feefd7' }, labelStyle: { color: BRAND_COLORS.yellow } },
      { key: "4-6 DAYS", style: { backgroundColor: '#ff914d', color: '#ffdeca' }, labelStyle: { color: '#ff914d' } },
      { key: "7-14 DAYS", style: { backgroundColor: BRAND_COLORS.orange, color: '#fbd8cd' }, labelStyle: { color: BRAND_COLORS.orange } },
      { key: "15-29 DAYS", style: { backgroundColor: BRAND_COLORS.red, color: BRAND_COLORS.yellow }, labelStyle: { color: BRAND_COLORS.red } },
      { key: "30-45 DAYS", style: { backgroundColor: '#cf3b4b', color: '#ff914d' }, labelStyle: { color: '#cf3b4b' } },
      { key: "61-90 DAYS", style: { backgroundColor: '#b4126d', color: BRAND_COLORS.orange }, labelStyle: { color: '#b4126d' } },
      { key: "91+ DAYS", style: { backgroundColor: BRAND_COLORS.purple, color: BRAND_COLORS.red }, labelStyle: { color: BRAND_COLORS.purple } }
    ];

    const sums = { lead0_3: 0, lead4_6: 0, lead7_14: 0, lead15_29: 0, lead30_45: 0, lead61_90: 0, lead91Plus: 0 };
    activeBehaviorSet.forEach(r => Object.keys(sums).forEach(k => sums[k] += (r[k] || 0)));
    const total = Object.values(sums).reduce((a, b) => a + b, 0);

    const keys = ['lead0_3', 'lead4_6', 'lead7_14', 'lead15_29', 'lead30_45', 'lead61_90', 'lead91Plus'];
    if (total === 0) {
      const fallbackPcts = [18, 5, 9, 34, 23, 10, 1];
      return leadStyles.map((item, i) => ({ ...item, pct: fallbackPcts[i] }));
    }

    return leadStyles.map((item, i) => ({
      ...item,
      pct: Math.round((sums[keys[i]] / total) * 100)
    }));
  }, [activeBehaviorSet, BRAND_COLORS]);

  const scopeTitle = selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth);
  const periodLabel = `${selectedYear || '2026'} ${scopeTitle}`;

  return (
    <div className="min-h-screen font-roboto pb-12" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />

      {/* HEADER BLOCK WITH SVG LOGO */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: `${BRAND_COLORS.aqua}33` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center h-[35px]">
              <h1 className="text-4xl font-bold tracking-tight font-khand uppercase pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                REVREBEL|
              </h1>

              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center p-1.5 border shadow-sm bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <Filter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    <option value="YEAR">FULL YEAR</option>
                    <option value="YTD">YTD VIEW</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>

                <div className="flex items-center p-1.5 border shadow-sm bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-t pt-4">
              <h1 className="text-4xl font-bold tracking-tight font-khand uppercase pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                OVERVIEW DASHBOARD | {propertyName.toUpperCase()}
              </h1>
              <div className="text-2xl font-bold font-khand uppercase tracking-wider text-slate-400">
                {roomsConfig} Rooms
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">

        {/* SECTION 1: TOP 5 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full select-none">
          <div className="p-5 flex flex-col justify-between h-44 shadow-md rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.primary }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider" style={{ color: `${BRAND_COLORS.powder}B3` }}>REVENUE</span>
            <div className="flex flex-col gap-0.5 -mt-4">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase leading-none" style={{ color: BRAND_COLORS.powder }}>
                {formatCompactUSD(stats.totalRev)}
              </span>
              <span className="text-sm font-roboto font-medium" style={{ color: BRAND_COLORS.powder }}>
                {stats.totalRev - stats.stlyRev < 0 ? `(${formatCompact(Math.abs(stats.totalRev - stats.stlyRev)).toLowerCase()})` : `${formatCompact(stats.totalRev - stats.stlyRev).toLowerCase()}`}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between h-44 shadow-md rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.teal }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider" style={{ color: `${BRAND_COLORS.frost}B3` }}>OCCUPANCY</span>
            <div className="flex flex-col gap-0.5 -mt-4">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase leading-none" style={{ color: BRAND_COLORS.frost }}>
                {`${(stats.occupancy * 100).toFixed(1)}%`}
              </span>
              <span className="text-sm font-roboto font-medium" style={{ color: BRAND_COLORS.frost }}>
                {`${Math.abs((stats.occupancy - stats.stlyOccupancy) * 100).toFixed(1)}%`}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between h-44 shadow-md rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.cyan }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider" style={{ color: `${BRAND_COLORS.yellow}B3` }}>AVG RATE</span>
            <div className="flex flex-col gap-0.5 -mt-4">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase leading-none" style={{ color: BRAND_COLORS.yellow }}>
                {formatPreciseCurrency(stats.avgADR)}
              </span>
              <span className="text-sm font-roboto font-medium" style={{ color: BRAND_COLORS.yellow }}>
                {`($${Math.abs(stats.avgADR - stats.stlyADR).toFixed(2)})`}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between h-44 shadow-md rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.aqua }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider" style={{ color: `${BRAND_COLORS.teal}B3` }}>ROOMS SOLD</span>
            <div className="flex flex-col gap-0.5 -mt-4">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase leading-none" style={{ color: BRAND_COLORS.teal }}>
                {formatNumber(stats.totalNights)}
              </span>
              <span className="text-sm font-roboto font-medium" style={{ color: BRAND_COLORS.teal }}>
                {formatNumber(Math.abs(stats.totalNights - stats.stlyNights))}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-center items-center text-center h-44 shadow-md rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.powder }}>
            <h3 className="text-8xl font-khand font-bold tracking-tight leading-none" style={{ color: BRAND_COLORS.primary }}>
              {Math.round(stats.totalLead)}
            </h3>
            <p className="text-sm sm:text-sm font-khand font-bold uppercase tracking-wider mt-1" style={{ color: BRAND_COLORS.primary }}>
              LEAD DAYS
            </p>
          </div>
        </div>

        {/* SECTION 2: DAY OF WEEK OCCUPANCY & PACE VS STLY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 bg-[#fafafa] border-[3px] p-6 flex flex-col h-full relative rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[3px] pb-5 mb-6 gap-4" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
              <div>
                <h3 className="font-khand text-xl font-bold uppercase tracking-wider" style={{ color: BRAND_COLORS.primary }}>DAY OF WEEK OCCUPANCY</h3>
                <p className="text-xs font-medium tracking-wide uppercase" style={{ color: `${BRAND_COLORS.primary}99` }}>HISTORICAL TREND FOR SELECTED PERIOD</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 border rounded-none text-xs bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <Layers size={12} className="ml-1" style={{ color: BRAND_COLORS.cyan }} />
                  <select value={dowSegmentFilter} onChange={(e) => setDowSegmentFilter(e.target.value)} className="bg-transparent border-none py-0.5 pl-1.5 pr-6 text-[10px] font-bold tracking-wider uppercase cursor-pointer">
                    <option value="TOTAL">ALL SEGMENTS</option>
                    {dynamicSegments.map(seg => <option key={seg} value={seg}>{seg}</option>)}
                  </select>
                </div>
                <div className="flex items-center p-1 border rounded-none text-xs bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <Calendar size={12} className="ml-1" style={{ color: BRAND_COLORS.cyan }} />
                  <select value={dowMonthFilter} onChange={(e) => setDowMonthFilter(e.target.value)} className="bg-transparent border-none py-0.5 pl-1.5 pr-6 text-[10px] font-khand font-bold tracking-wider uppercase cursor-pointer">
                    <option value="YEAR">FULL YEAR</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3 flex-1 items-end pt-12 pb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => {
                const val = computedDOW[day];
                const isHovered = hoveredDay === day;
                return (
                  <div key={day} className="flex flex-col items-center group cursor-pointer relative h-full justify-end" onMouseEnter={() => setHoveredDay(day)} onMouseLeave={() => setHoveredDay(null)}>
                    {isHovered && (
                      <div className="absolute -top-7 text-white text-[10px] font-bold px-2 py-1 shadow-md pointer-events-none z-10" style={{ backgroundColor: BRAND_COLORS.primary }}>
                        {val}%
                      </div>
                    )}
                    <div className="w-full border-2 aspect-[1/3.5] flex flex-col justify-end p-0.5" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}1A` }}>
                      <div className="w-full transition-all duration-500" style={{ height: `${val}%`, backgroundColor: BRAND_COLORS.cyan }} />
                    </div>
                    <span className="text-xs font-khand font-bold uppercase mt-3">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#fafafa] border-[3px] p-6 flex flex-col h-full justify-between rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <div>
              <div className="flex justify-between items-start border-b-[3px] pb-5 mb-6" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
                <div>
                  <h3 className="font-khand text-xl font-bold uppercase tracking-wider" style={{ color: BRAND_COLORS.primary }}>PACE VS STLY</h3>
                  <p className="text-xs font-medium tracking-wide uppercase" style={{ color: `${BRAND_COLORS.primary}99` }}>HISTORICAL REVENUE COMPARISON</p>
                </div>
                <TrendingUp className="w-5 h-5 mt-1" style={{ color: BRAND_COLORS.cyan }} />
              </div>
              <div className="space-y-4">
                {displayPaceSegments.map((seg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                    <span className="font-khand font-bold text-xs uppercase">{seg.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs">{formatCurrency(seg.actual)}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: seg.variance < 0 ? `${BRAND_COLORS.red}1A` : `${BRAND_COLORS.cyan}1A`, color: seg.variance < 0 ? BRAND_COLORS.red : BRAND_COLORS.teal }}>
                        {seg.variance >= 0 ? '+' : ''}{seg.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4 mt-6 flex justify-between text-[10px] font-bold uppercase" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
              <span>STLY COMPARISON</span>
              <span>{periodLabel}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: PERFORMANCE SUMMARY MATRIX & SEGMENT REVENUE MIX */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full">
          <div className="lg:col-span-2 bg-[#fafafa] border-[3px] shadow-md rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <div className="p-6 border-b-[3px] bg-[#fafafa] flex justify-between items-center" style={{ borderColor: BRAND_COLORS.primary }}>
              <h3 className="font-khand uppercase font-bold tracking-wider text-lg">Performance Summary</h3>
              <div className="text-xs font-bold text-white px-3 pt-[6px] pb-1 uppercase tracking-widest rounded-none font-khand" style={{ backgroundColor: BRAND_COLORS.cyan }}>{periodLabel}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[11px] font-khand uppercase tracking-widest border-b-[3px]" style={{ color: `${BRAND_COLORS.primary}99`, backgroundColor: `${BRAND_COLORS.frost}80`, borderColor: `${BRAND_COLORS.primary}1A` }}>
                  <tr>
                    <th className="px-6 py-4">Stay Month</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4">Occupancy</th>
                    <th className="px-6 py-4">Nights</th>
                    <th className="px-6 py-4">ADR</th>
                    <th className="px-6 py-4 text-right">ALOS</th>
                  </tr>
                </thead>
                <tbody className="font-roboto">
                  {monthlyTotals.filter(m => activeMonthsList.includes(m.month)).map((m, idx) => (
                    <tr key={idx} className="transition-colors group hover-bg-dynamic" style={{'--hover-bg-color': `${BRAND_COLORS.primary}0D`}}>
                      <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.primary }}>{m.month}</td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(m.revenue)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center p-2 rounded-none text-xs font-bold" style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder }}>
                          {(m.occupancy * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ color: `${BRAND_COLORS.primary}CC` }}>{formatNumber(m.nights)}</td>
                      <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.cyan }}>{formatPreciseCurrency(m.adr)}</td>
                      <td className="px-6 py-4 text-right" style={{ color: `${BRAND_COLORS.primary}99` }}>{(m.alos || 0).toFixed(1)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#fafafa] p-8 flex flex-col h-full border-[3px] shadow-md rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold tracking-widest text-lg mb-8">Segment Revenue Mix</h3>
            <div className="space-y-6 flex-1">
              {aggregatedSegments.slice(0, 7).map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
                    <span className="uppercase truncate pr-4" style={{ color: `${BRAND_COLORS.primary}CC` }}>{s.metric}</span>
                    <span className="font-khand text-sm" style={{ color: BRAND_COLORS.cyan }}>{formatCompact(s.revenue)}</span>
                  </div>
                  <div className="w-full h-2 overflow-hidden border rounded-none" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.aqua}1A` }}>
                    <div className="h-full transition-all duration-1000 ease-out rounded-none" style={{ width: `${stats.totalRev > 0 ? (s.revenue / stats.totalRev) * 100 : 0}%`, backgroundColor: BRAND_COLORS.cyan }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: GUEST BEHAVIOR PROFILES (RESTORED DYNAMIC COLORS) */}
        <div className="bg-[#fafafa] border-[3px] p-8 md:p-10 w-full space-y-10 shadow-sm rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-[3px] gap-4" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
            <div>
              <h3 className="font-khand text-2xl font-bold uppercase tracking-wider" style={{ color: BRAND_COLORS.primary }}>GUEST BEHAVIOR PROFILES</h3>
              <p className="text-xs font-medium tracking-wide uppercase" style={{ color: `${BRAND_COLORS.primary}99` }}>LENGTH OF STAY AND BOOKING WINDOW DISTRIBUTIONS</p>
            </div>
            
            <div className="flex items-center p-1.5 border rounded-none text-xs bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
              <Layers size={14} className="ml-1" style={{ color: BRAND_COLORS.cyan }} />
              <select value={selectedBehaviorSegment} onChange={(e) => setSelectedBehaviorSegment(e.target.value)} className="bg-transparent border-none py-0.5 pl-2 pr-8 text-xs font-khand font-bold tracking-wider uppercase cursor-pointer focus:ring-0 rounded-none" style={{ color: BRAND_COLORS.primary }}>
                <option value="ALL">ALL SEGMENTS</option>
                {behaviorSegmentOptions.map(seg => <option key={seg} value={seg}>{seg}</option>)}
              </select>
            </div>
          </div>

          {/* LENGTH OF STAY - RESTORED UNIQUE TILE COLORS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <h4 className="lg:col-span-3 font-khand uppercase font-bold text-xl">LENGTH OF STAY</h4>
            <div className="lg:col-span-9 grid grid-cols-3 sm:grid-cols-7 gap-2.5">
              {losData.map((item, idx) => (
                <div key={idx} className="flex flex-col space-y-2">
                  <div className="aspect-square flex items-center justify-center font-khand font-bold text-3xl md:text-4xl shadow-sm rounded-none transition-transform hover:scale-105" style={item.style}>
                    {String(item.pct).padStart(2, '0')}%
                  </div>
                  <span className="text-[10px] font-khand uppercase font-bold text-center tracking-wider block" style={{ color: `${BRAND_COLORS.primary}99` }}>
                    {item.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LEAD DAYS - RESTORED UNIQUE HEAT-MAP TILE COLORS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-8 border-t" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
            <h4 className="lg:col-span-3 font-khand uppercase font-bold text-xl">LEAD DAYS</h4>
            <div className="lg:col-span-9 grid grid-cols-3 sm:grid-cols-7 gap-2.5">
              {leadData.map((item, idx) => (
                <div key={idx} className="flex flex-col space-y-2">
                  <div className="aspect-square flex items-center justify-center font-khand font-bold text-3xl md:text-4xl shadow-sm rounded-none transition-transform hover:scale-105" style={item.style}>
                    {String(item.pct).padStart(2, '0')}%
                  </div>
                  <span className="text-[10px] font-khand font-bold uppercase text-center tracking-wider block leading-none" style={item.labelStyle}>
                    {item.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex justify-between items-center text-[9px] font-khand font-bold uppercase tracking-widest opacity-80">
        <span>METRICS BY REVREBEL</span>
        <span>SELECTED PERIOD: {periodLabel}</span>
      </footer>
    </div>
  );
}