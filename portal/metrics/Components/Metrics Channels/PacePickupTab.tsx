import React, { useState, useMemo, useEffect } from 'react';

const BRAND_COLORS = {
  primary: "#163666",
  teal: "#047C97",
  cyan: "#00A6B6",
  aqua: "#71C9C5",
  powder: "#B2D3DE",
  yellow: "#FACA78",
  orange: "#F37D59",
  red: "#E05047",
  frost: "#EFF5F6",
  white: "#fafafa"
};

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
  .hover-bg-dynamic:hover { background-color: var(--hover-bg-color); }
  .hover-text-dynamic:hover { color: var(--hover-color); }
`;

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatCompact = (val) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val || 0);
const formatCompactUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(val || 0);

function IconFilter({ size = 16, className = "", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ChangeIndicator({ isNeg, textColor, bgColor }) {
  return (
    <div 
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm"
      style={{ backgroundColor: textColor }}
    >
      <svg 
        viewBox="0 0 24 24" 
        className="w-5 h-5 transition-transform duration-300"
        style={{ transform: isNeg ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        <path 
          d="M 12 3 L 5 11 H 8.5 V 21 H 15.5 V 11 H 19 Z" 
          fill={bgColor} 
        />
      </svg>
    </div>
  );
}

function PaceComparisonChart({ data, selectedYear }) {
  if (!data || !data.length) return null;

  const width = 600;
  const height = 280;
  const paddingLeft = 60;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.ty || 0, d.stly || 0)), 100) * 1.15;

  const groupWidth = chartW / data.length;
  const barWidth = Math.max(8, (groupWidth * 0.35));

  const tyYearLabel = selectedYear || "2026";
  const stlyYearLabel = selectedYear ? String(Number(selectedYear) - 1) : "2025";

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const val = maxVal * ratio;
          const y = paddingTop + chartH - (ratio * chartH);
          return (
            <g key={ratio}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="font-roboto" fontSize="10" fill="#64748b">
                {formatCompactUSD(val)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const groupX = paddingLeft + (i * groupWidth) + (groupWidth - (barWidth * 2 + 4)) / 2;
          const tyH = (d.ty / maxVal) * chartH;
          const stlyH = (d.stly / maxVal) * chartH;

          const tyY = paddingTop + chartH - tyH;
          const stlyY = paddingTop + chartH - stlyH;

          return (
            <g key={d.month || i}>
              <rect x={groupX} y={tyY} width={barWidth} height={tyH} fill={BRAND_COLORS.cyan} />
              <rect x={groupX + barWidth + 4} y={stlyY} width={barWidth} height={stlyH} fill={BRAND_COLORS.primary} />
              <text
                x={groupX + barWidth + 2}
                y={height - 12}
                textAnchor="middle"
                className="font-khand font-bold uppercase"
                fontSize="11"
                fill={BRAND_COLORS.primary}
              >
                {String(d.month).substring(0, 3).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2 text-xs font-khand font-bold uppercase">
          <div className="w-3 h-3" style={{ backgroundColor: BRAND_COLORS.cyan }}></div>
          <span className="pt-[2px]">{tyYearLabel} OTB REVENUE</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-khand font-bold uppercase">
          <div className="w-3 h-3" style={{ backgroundColor: BRAND_COLORS.primary }}></div>
          <span className="pt-[2px]">{stlyYearLabel} STLY REVENUE</span>
        </div>
      </div>
    </div>
  );
}

function PickupPatternChart({ leadDays }) {
  const width = 600;
  const height = 260;
  const paddingLeft = 50;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const x0 = leadDays || 15;
  const k = 0.08;
  const generatePickup = (d) => 100 / (1 + Math.exp(k * (d - x0)));

  const points = [];
  for (let d = 90; d >= 0; d -= 2) {
    const pct = generatePickup(d);
    const px = paddingLeft + ((90 - d) / 90) * chartW;
    const py = paddingTop + chartH - (pct / 100) * chartH;
    points.push({ x: px, y: py, d, pct });
  }

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');

  const markerX = paddingLeft + ((90 - x0) / 90) * chartW;
  const markerPct = generatePickup(x0);
  const markerY = paddingTop + chartH - (markerPct / 100) * chartH;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = paddingTop + chartH - (pct / 100) * chartH;
          return (
            <g key={pct}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="font-roboto" fontSize="10" fill="#64748b">
                {`${pct}%`}
              </text>
            </g>
          );
        })}

        {[90, 60, 30, 0].map((d) => {
          const x = paddingLeft + ((90 - d) / 90) * chartW;
          return (
            <text key={d} x={x} y={height - 12} textAnchor="middle" className="font-roboto" fontSize="10" fill={BRAND_COLORS.primary}>
              {`${d}D`}
            </text>
          );
        })}

        <path d={pathD} fill="none" stroke={BRAND_COLORS.cyan} strokeWidth="4" />
        <circle cx={markerX} cy={markerY} r="6" fill={BRAND_COLORS.yellow} stroke={BRAND_COLORS.primary} strokeWidth="2" />
      </svg>
    </div>
  );
}

export default function PacePickupTab({ data = [] }) {
  const [selectedMonth, setSelectedMonth] = useState('YTD');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPaceSource, setSelectedPaceSource] = useState('ALL');

  // Deep Parsing for Pace & Baseline Channel Metrics
  const parsedData = useMemo(() => {
    const result = {
      years: [],
      roomsConfig: 188,
      propertyName: "REBEL HOTEL",
      channelRows: [],
      paceRows: []
    };

    if (!data || !data.length) return result;

    const headers = data[0]?.row || [];
    const findCol = (str) => headers.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());

    const map = {
      property: findCol("PROPERTY"),
      rooms: findCol("ROOMS"),

      // Channel columns
      channelYear: findCol("channel_year"),
      channelMonth: findCol("channel_stay_month"),
      channelMetric: findCol("channel_metric"),
      channelMetricCode: findCol("channel_metric_code"),
      channelResn: findCol("channel_no_resn"),
      channelNights: findCol("channel_nights"),
      channelRev: findCol("channel_revenue"),
      channelADR: findCol("channel_adr"),
      channelALOS: findCol("channel_alos"),
      channelLead: findCol("channel_lead_days"),

      // Pace columns
      paceYear: findCol("pace_year"),
      paceMonth: findCol("pace_stay_month"),
      paceMetricType: findCol("pace_metric_type"),
      paceMetric: findCol("pace_metric"),
      paceTYRev: findCol("pace_ty_revenue"),
      paceSTLYRev: findCol("pace_stly_revenue"),
      paceTYNights: findCol("pace_ty_room_nights"),
      paceSTLYNights: findCol("pace_stly_room_nights")
    };

    if (data[2]) {
      if (map.property !== -1) result.propertyName = safeString(data[2].row[map.property]) || result.propertyName;
      if (map.rooms !== -1) result.roomsConfig = Number(data[2].row[map.rooms]) || result.roomsConfig;
    }

    data.forEach((item, idx) => {
      if (idx <= 1) return; // Skip raw headers
      const r = item.row;
      if (!r) return;

      // Channel Rows Parsing
      if (map.channelYear !== -1 && r[map.channelYear]) {
        const yr = Number(r[map.channelYear]);
        if (!isNaN(yr)) {
          const metricVal = safeString(r[map.channelMetric] !== undefined ? r[map.channelMetric] : r[map.channelMetricCode]);
          result.channelRows.push({
            year: yr,
            month: safeString(r[map.channelMonth]).toUpperCase(),
            channel: metricVal,
            resn: Number(r[map.channelResn]) || 0,
            nights: Number(r[map.channelNights]) || 0,
            revenue: Number(r[map.channelRev]) || 0,
            adr: Number(r[map.channelADR]) || 0,
            alos: Number(r[map.channelALOS]) || 0,
            lead: Number(r[map.channelLead]) || 0
          });
        }
      }

      // Pace Rows Parsing
      if (map.paceYear !== -1 && r[map.paceYear]) {
        const yr = Number(r[map.paceYear]);
        if (!isNaN(yr)) {
          result.paceRows.push({
            year: yr,
            month: safeString(r[map.paceMonth]).toUpperCase(),
            metricType: map.paceMetricType !== -1 ? safeString(r[map.paceMetricType]).toUpperCase() : '',
            metric: map.paceMetric !== -1 ? safeString(r[map.paceMetric]) : '',
            ty: Number(r[map.paceTYRev]) || 0,
            stly: Number(r[map.paceSTLYRev]) || 0,
            tyNights: Number(r[map.paceTYNights]) || 0,
            stlyNights: Number(r[map.paceSTLYNights]) || 0
          });
        }
      }
    });

    const yrSet = new Set(
      result.channelRows.map(r => String(r.year))
        .concat(result.paceRows.map(r => String(r.year)))
    );

    result.years = yrSet.size > 0 ? Array.from(yrSet).sort().reverse() : ["2026", "2025"];
    return result;
  }, [data]);

  const { years, roomsConfig, propertyName, channelRows, paceRows } = parsedData;

  useEffect(() => {
    if (years.length > 0 && (!selectedYear || !years.includes(selectedYear))) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const activeMonthsList = useMemo(() => {
    if (selectedMonth === 'YEAR') return MONTH_ORDER;
    if (selectedMonth === 'YTD') return MONTH_ORDER.slice(0, 7);
    return [selectedMonth];
  }, [selectedMonth]);

  const channelOnlyData = useMemo(() => {
    return channelRows.filter(d => d.channel && String(d.channel).toUpperCase() !== 'TOTAL');
  }, [channelRows]);

  const paceSourcesList = useMemo(() => {
    const sRows = paceRows.filter(r => r.metricType === 'SOURCE' || (r.metric && r.metric.toUpperCase() !== 'TOTAL'));
    const set = new Set(sRows.map(r => r.metric).filter(Boolean));
    return Array.from(set).sort();
  }, [paceRows]);

  // Aggregate KPI Performance Baseline Statistics
  const kpiStats = useMemo(() => {
    const yrNum = Number(selectedYear) || (years[0] ? Number(years[0]) : 2026);
    const currentSet = channelOnlyData.filter(d => d.year === yrNum && activeMonthsList.includes(d.month));
    
    const totalRev = currentSet.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalNights = currentSet.reduce((sum, d) => sum + (d.nights || 0), 0);
    const totalRes = currentSet.reduce((sum, d) => sum + (d.resn || 0), 0);
    const avgADR = totalNights > 0 ? totalRev / totalNights : 0;
    const avgALOS = totalRes > 0 ? totalNights / totalRes : 0;
    const avgLead = currentSet.length > 0 ? (currentSet.reduce((sum, d) => sum + (d.lead || 0), 0) / currentSet.length) : 15;

    const priorSet = channelOnlyData.filter(d => d.year === yrNum - 1 && activeMonthsList.includes(d.month));
    const stlyRev = priorSet.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const stlyNights = priorSet.reduce((sum, d) => sum + (d.nights || 0), 0);
    const stlyADR = stlyNights > 0 ? stlyRev / stlyNights : 0;
    const stlyRes = priorSet.reduce((sum, d) => sum + (d.resn || 0), 0);
    const stlyALOS = stlyRes > 0 ? stlyNights / stlyRes : 0;

    return {
      totalRev, stlyRev,
      totalNights, stlyNights,
      avgADR, stlyADR,
      totalRes, stlyRes,
      avgALOS, stlyALOS,
      avgLead
    };
  }, [channelOnlyData, selectedYear, activeMonthsList, years]);

  // Dynamic Pacing Matrix Filtered Set
  const filteredPaceRows = useMemo(() => {
    const yrNum = Number(selectedYear) || 2026;
    let baseRows = paceRows.filter(r => (r.year === yrNum || !r.year) && activeMonthsList.includes(r.month));

    const hasSourceRows = baseRows.some(r => r.metricType === 'SOURCE' || (r.metric && r.metric.toUpperCase() !== 'TOTAL'));

    if (hasSourceRows) {
      if (selectedPaceSource !== 'ALL') {
        baseRows = baseRows.filter(r => 
          (r.metricType === 'SOURCE' || !r.metricType) && 
          safeString(r.metric).toUpperCase() === selectedPaceSource.toUpperCase()
        );
      } else {
        const totalRows = baseRows.filter(r => r.metricType === 'TOTAL' || safeString(r.metric).toUpperCase() === 'TOTAL');
        if (totalRows.length > 0) {
          baseRows = totalRows;
        } else {
          const sRows = baseRows.filter(r => r.metricType === 'SOURCE' || !r.metricType);
          const monthMap = {};
          sRows.forEach(r => {
            if (!monthMap[r.month]) {
              monthMap[r.month] = { year: r.year, month: r.month, ty: 0, stly: 0, tyNights: 0, stlyNights: 0 };
            }
            monthMap[r.month].ty += r.ty || 0;
            monthMap[r.month].stly += r.stly || 0;
            monthMap[r.month].tyNights += r.tyNights || 0;
            monthMap[r.month].stlyNights += r.stlyNights || 0;
          });
          baseRows = MONTH_ORDER.filter(m => activeMonthsList.includes(m)).map(m => monthMap[m] || { year: yrNum, month: m, ty: 0, stly: 0, tyNights: 0, stlyNights: 0 });
        }
      }
    }

    return baseRows;
  }, [paceRows, selectedYear, activeMonthsList, selectedPaceSource]);

  const paceTotals = useMemo(() => {
    const totalTY = filteredPaceRows.reduce((sum, d) => sum + (d.ty || 0), 0);
    const totalSTLY = filteredPaceRows.reduce((sum, d) => sum + (d.stly || 0), 0);
    const paceVar = totalTY - totalSTLY;
    const paceVarPct = totalSTLY > 0 ? (paceVar / totalSTLY) * 100 : 0;
    return { totalTY, totalSTLY, paceVar, paceVarPct };
  }, [filteredPaceRows]);

  const scopeTitle = selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth);
  const sourceScopeLabel = selectedPaceSource !== 'ALL' ? ` | ${selectedPaceSource}` : '';
  const periodLabel = `${selectedYear || '2026'} ${scopeTitle}${sourceScopeLabel}`;

  return (
    <div className="min-h-screen font-roboto select-none" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />

      {/* Header Block */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: `${BRAND_COLORS.aqua}33` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">

            {/* Row 1: Brand Header Logo & Filters */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center h-[35px]">
                <svg id="a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1180 174.8" className="h-full w-auto">
                  <defs><style>{`.b{fill:#1c3766;}`}</style></defs>
                  <path className="b" d="M634,41.5c.5,0,1,0,1.4,0,24.9,0,49.9,0,74.8,0,2.8,0,4.9-1.5,4.7-5.1-.2-10.4,0-20.4,0-30.8,0-2.2-1.3-3.5-3.5-3.6-41.6,0-83.3-.1-124.9,0-1.9,.3-2.9,1.4-3.1,3.2,0,27.5,0,54.9,0,82.4,0,27.5-.1,55,0,82.5,.2,1.7,1.4,2.8,3.1,3,41.7,0,83.5,0,125.2,0,2.2-.2,3.3-2.1,3.1-4.2,0-10.3,0-20.7,0-31,.3-3.3-1.9-4.5-4.9-4.2-25.4,0-50.7,0-76.1,0-1.3,0-1.6-.4-1.6-1.6,0-.3,0-.6,0-.9,0-7.8,0-15.7,0-23.5,0-1.5,.3-1.7,1.7-1.8,16.1,0,32.2,.2,48.3,0,2.1-.2,3.2-1.9,3-3.9,0-10.4,0-20.9,0-31.3,0-2-.9-3.6-3-3.9-15.7-.3-31.5,0-47.2-.1-.4,0-.8,0-1.3,0-1.3,0-1.5-.3-1.6-1.6,0-7.2,0-14.3,0-21.5,0-.2,0-.4,0-.6,0-1.3,.3-1.6,1.7-1.6Z" />
                  <path className="b" d="M991.9,134c-26-.2-52,0-78,0-1.3,0-1.6-.4-1.7-1.6,0-7.9,0-15.8,0-23.7,0-1.2-.1-2.6,1.5-2.5,16.2-.1,32.4,.1,48.7,0,2.4-.2,3.3-2.3,3.1-4.5,0-10.1,0-20.1,0-30.2,.2-2.1-.6-4-2.9-4.3-16.2-.4-32.5,0-48.8-.2-1.7,0-1.5-1.4-1.5-2.6,0-6.6,0-13.3,0-19.9,0-2.8,0-2.8,2.8-2.8,25.4,0,50.7,.2,76.1,.2,2.9,0,4-2.1,3.8-4.7,0-10.6,.1-21.3,0-31.9-.2-2.4-2.5-3-4.6-3-41.2,0-82.3,0-123.5,0-2.1,.2-3.2,1.4-3.3,3.5,0,27.4,0,54.7,0,82.1,0,27,0,54,0,81,0,3.3,1.2,4.3,4.8,4.3,41,0,81.9,0,123,.4,2.8,0,3.9-2,3.7-4.5,0-10.1,0-20.2,0-30.4,.2-2.1-.7-4.3-3.1-4.4Z" />
                  <path className="b" d="M195.9,41.1c24.9,0,49.7,0,74.6,0,4,.6,3.5-2.4,3.3-4.8,0-10,0-20,0-30,.3-3.3-1.3-5.1-4.6-4.8-39.6,0-79.3,0-118.9,0-3.6,0-4.6,1-4.6,4.7,0,27.1,0,54.2,0,81.3,0,27.6,0,55.1,0,82.7,.1,1.8,1.2,3,3,3.2,40.2,0,80.4,0,120.6,0,2.8,0,4.5-1.1,4.5-4.6-.1-10.1,0-20.2,0-30.3,0-3.3-1.3-4.6-4.6-4.6-24.8,0-49.5,0-74.3,0-1.4,0-1.6-.3-1.6-1.7,0-8.2,0-16.4,0-24.5,0-1.4,.2-1.6,1.6-1.7,15.7,0,31.5,.2,47.3,0,2.2-.2,3-2.3,2.8-4.3,0-10.2,0-20.4,0-30.6,.3-3.4-1.8-4.5-4.8-4.5-15.1,0-30.2,0-45.3,0-1.4,0-1.5-.2-1.6-1.5,0-7.1,0-14.2,0-21.3q0-2.6,2.7-2.6Z" />
                  <path className="b" d="M432.6,2.3c-14.6-.6-29.4,0-44-.2-3-.2-4.6,1.1-5.1,3.9-8.6,34.4-16.3,69.2-25.5,103.4-.2,0-.4,0-.5,0-9.2-34.4-17.4-69.2-26.3-103.7-.7-2.8-1.8-3.6-4.7-3.6-15.1,.2-30.4-.4-45.5,.2-2.1,.4-2.5,2.5-1.8,4.2,17,54.6,34,109.1,51,163.7,.6,2.2,2.8,3.1,4.9,3.1,14.3,0,28.6,0,43,0,2.9,.2,4.6-1.5,5.2-4.1,17-54,34-108,51-162,.8-2,.9-4.4-1.6-5Z" />
                  <path className="b" d="M1133.4,137.2c-.2-1.9-1.4-3-3.3-3.2-26.4,0-52.7,0-79.1,0q-2.9,0-2.9-2.9c0-41.6,0-83.3,0-124.9,0-2.8-1.3-4.1-4.2-4.1-13.5,0-27,0-40.6,0-2.8,0-4.1,1.3-4.1,4,0,27.1,0,54.3,0,81.4,0,27.5,0,55,0,82.5,.1,1.9,1.4,3.2,3.3,3.3,42.2,0,84.3,0,126.5,0,3,0,4.3-1.2,4.3-4.1,0-10.7,0-21.4,0-32.1Z" />
                  <path className="b" d="M836.7,85.1c10.1-5.7,17.6-13.5,19.6-25,3.4-17.8-1.2-39.4-18.6-48.6-13.4-7.3-29-9.2-44.1-9.4-23.6-.1-47.1,0-70.7,0-2.3,.2-3.6,1.4-3.6,3.7,0,54.7,0,109.3,0,164,.1,2.3,1.4,3.5,3.7,3.6,23.8,0,47.7,0,71.5,0,15.7,0,31.7-2.8,45.3-10.8,17.5-9.5,22.9-30.2,19.4-48.5-2.5-14-10.3-22.2-22.5-29Zm-66.7-43.5c7.7,0,15.3,0,23,0,10.5,.2,18.2,5.3,16.2,16.5-1.3,8-10.5,10.3-17.6,10.3-7.2,0-14.4,0-21.5,0-1.7,0-1.9-.2-1.9-1.9,0-7.7,0-15.4,0-23,0-1.7,.2-1.9,1.9-1.9Zm40.8,82.4c-2.4,9.5-12.9,10.1-21.2,10-6.7,0-13.3,0-20,0-1.8,0-1.5-1.2-1.6-2.6,0-7.6,0-15.3,0-22.9,0-2.6,0-2.7,2.8-2.7,4.2,0,8.5,0,12.7,0,0,0,0,0,0-.1,4.5,.1,9,.2,13.5,.4,2.5,.1,4.9,.7,7.2,1.7,6.5,2.7,8.1,9.9,6.6,16.1Z" />
                  <path className="b" d="M109.6,104.9c-.7-1.4-.5-1.8,.9-2.4,24.4-9,35.5-34.2,29.9-58.5C135.7,18,110,1.5,84.1,2.1c-26.4-.1-52.8,0-79.3,0C2.6,1.9,.5,2.6,.2,5.2c-.3,54.3,0,108.7-.1,163,0,2.4,.4,4.9,3.3,5.1,14.2,0,28.3,0,42.5,0,2.5-.3,3.3-2.4,3.1-4.6,0-19.9,0-39.9,0-59.8,.1-.9,.4-1.3,1.4-1.3,3.5,0,7.1,0,10.6,0,1.3,0,1.7,1.2,2.2,2.1,9.3,20.3,18.6,40.6,27.9,60.8,.9,1.9,2.3,2.8,4.3,2.8,14.6,0,29.2,0,43.7,0,2,0,4.3-1.1,3.5-3.4-10.6-21.8-22.1-43.3-33-65Zm-22.9-35.7c-3.4,2.3-7.3,3.3-11.4,3.3-3.9,0-7.8,0-11.7,0s-8.6,0-12.8,0c-1.7,0-2-.2-2-1.9,0-9.1,0-18.2,0-27.2,0-1.5,.3-1.8,1.9-1.8,8.5,0,17,0,25.5,0,4.7,0,8.9,1.7,12.5,4.9,5.8,5.2,6.7,16.9-2,22.7Z" />
                  <path className="b" d="M580.4,169.8c-10.5-21.5-21.8-42.8-32.6-64.2-1.2-2.3-1.2-2.3,1.3-3.3,40.2-15.3,40.2-73.8,3.3-92.8-9.5-5.2-19.7-7.3-30.4-7.3-26.7-.1-53.5,0-80.2,0-3.2,.1-4,2.2-3.8,5.1,0,54.4,0,108.7,0,163.1,.2,2.3,2.3,3.4,4.5,3.1,13.3,0,26.5,0,39.8,0,2.3,.2,4.4-.8,4.5-3.2,0-20.3,0-40.6,0-60.9,0-1.3,.3-1.6,1.6-1.6,3.4,0,6.9,0,10.3,0,1.5-.1,1.9,1.2,2.4,2.3,9.3,20.2,18.6,40.4,27.8,60.6,.9,1.9,2.2,2.9,4.4,2.9,14.6,0,29.2,0,43.7,0,2.1,0,4.3-1.2,3.4-3.5Zm-49.4-111.8c-.6,10.1-9.7,14.5-18,14.5-8,0-16.1,0-24.1,0-.8,0-2.1,0-2.1-1-.1-9.3,0-18.6,0-27.9,0-1.9,.2-2.1,2.1-2.1,8.3,0,16.7,0,25,0,9.2,0,18,6.8,17.1,16.4Z" />
                  <ellipse className="b" cx="1158.2" cy="150.5" rx="21.8" ry="21.1" />
                </svg>
              </div>

              {/* Dynamic Header Filters */}
              <div className="flex items-center gap-3">
                {/* Source Filter */}
                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <IconFilter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                  <select
                    value={selectedPaceSource}
                    onChange={(e) => setSelectedPaceSource(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    <option value="ALL">ALL SOURCES</option>
                    {paceSourcesList.map(s => (
                      <option key={s} value={s}>{s.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Month View Filter */}
                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <IconFilter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
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

                {/* Year Filter */}
                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider"
                    style={{ color: BRAND_COLORS.primary }}
                  >
                    {years.length > 0 ? (
                      years.map(y => <option key={y} value={y}>{y}</option>)
                    ) : (
                      <option value="2026">2026</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Title & Room Count Badge */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 border-t pt-4" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
              <div>
                <h1 className="text-3xl sm:text-4xl font-khand font-bold uppercase tracking-wide leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                  METRIC SOURCES | {propertyName || "HOTEL DASHBOARD"}
                </h1>
              </div>
              <div className="text-xl sm:text-2xl font-khand font-bold uppercase tracking-wider opacity-60 pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                {roomsConfig ? `${roomsConfig} ROOMS` : "188 ROOMS"}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* RESTORED: TOP 5 KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          
          {/* Card 1: Pace Variance */}
          <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.primary }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: `${BRAND_COLORS.powder}B3` }}>
              Pace Variance
            </span>
            <div className="flex flex-col gap-0.5 -mt-6">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: BRAND_COLORS.powder }}>
                {paceTotals.paceVar >= 0 ? `+$${formatCompact(paceTotals.paceVar)}` : `-$${formatCompact(Math.abs(paceTotals.paceVar))}`}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChangeIndicator isNeg={paceTotals.paceVar < 0} textColor={BRAND_COLORS.powder} bgColor={BRAND_COLORS.primary} />
                <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: BRAND_COLORS.powder }}>
                  {paceTotals.paceVarPct.toFixed(1)}% YOY
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: ADR CHG */}
          <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.teal }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider text-white/70 pt-[2px]">
              ADR CHG
            </span>
            <div className="flex flex-col gap-0.5 -mt-6">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none text-white pt-[2px]">
                {kpiStats.avgADR - kpiStats.stlyADR >= 0 ? `+$${(kpiStats.avgADR - kpiStats.stlyADR).toFixed(2)}` : `-$${Math.abs(kpiStats.avgADR - kpiStats.stlyADR).toFixed(2)}`}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChangeIndicator isNeg={kpiStats.avgADR - kpiStats.stlyADR < 0} textColor="#FFFFFF" bgColor={BRAND_COLORS.teal} />
                <span className="text-sm font-roboto font-medium tracking-normal text-white">
                  {kpiStats.stlyADR > 0 ? `${(((kpiStats.avgADR - kpiStats.stlyADR) / kpiStats.stlyADR) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: OTB Revenue */}
          <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.cyan }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: `${BRAND_COLORS.yellow}B3` }}>
              OTB Revenue
            </span>
            <div className="flex flex-col gap-0.5 -mt-6">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: BRAND_COLORS.yellow }}>
                ${formatCompact(paceTotals.totalTY || kpiStats.totalRev)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChangeIndicator isNeg={paceTotals.paceVar < 0} textColor={BRAND_COLORS.yellow} bgColor={BRAND_COLORS.cyan} />
                <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: BRAND_COLORS.yellow }}>
                  (${formatCompact(Math.abs(paceTotals.paceVar))})
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Avg LOS */}
          <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.aqua }}>
            <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: `${BRAND_COLORS.teal}B3` }}>
              Avg LOS
            </span>
            <div className="flex flex-col gap-0.5 -mt-6">
              <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: BRAND_COLORS.teal }}>
                {(kpiStats.avgALOS || 0).toFixed(1)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChangeIndicator isNeg={kpiStats.avgALOS - kpiStats.stlyALOS < 0} textColor={BRAND_COLORS.teal} bgColor={BRAND_COLORS.aqua} />
                <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: BRAND_COLORS.teal }}>
                  {Math.abs(kpiStats.avgALOS - kpiStats.stlyALOS).toFixed(1)} Nights
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Lead Days */}
          <div className="p-5 flex flex-col justify-center items-center text-center h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.powder }}>
            <h3 className="text-6xl font-khand font-bold tracking-tight leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
              {Math.round(kpiStats.avgLead || 0)}
            </h3>
            <p className="text-sm font-khand font-bold uppercase tracking-wider mt-1 pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
              LEAD DAYS
            </p>
          </div>

        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 border-[3px] rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold tracking-wider text-xl mb-4 pt-[2px]">
              Revenue OTB Pace ({selectedYear || '2026'} vs. {selectedYear ? Number(selectedYear) - 1 : '2025'}){selectedPaceSource !== 'ALL' ? ` - ${selectedPaceSource}` : ''}
            </h3>
            {filteredPaceRows.length > 0 ? (
              <PaceComparisonChart data={filteredPaceRows} selectedYear={selectedYear} />
            ) : (
              <div className="text-center py-12 text-slate-400 font-khand uppercase text-xs pt-[2px]">No Pace Data Found</div>
            )}
          </div>

          <div className="bg-white p-8 border-[3px] rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold tracking-wider text-xl mb-4 pt-[2px]">
              Occupancy Booking Window Pickup Velocity
            </h3>
            <PickupPatternChart leadDays={kpiStats.avgLead} />
          </div>
        </div>

        {/* MONTHLY MATRIX TABLE */}
        <div className="bg-white border-[3px] rounded-none overflow-hidden" style={{ borderColor: BRAND_COLORS.primary }}>
          <div className="p-6 border-b-[3px] bg-slate-50 flex justify-between items-center" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold tracking-wider text-lg pt-[2px]">
              Monthly Matrix Breakdown
            </h3>
            <span className="text-xs font-khand font-bold uppercase tracking-widest text-white px-3 pt-[6px] pb-1" style={{ backgroundColor: BRAND_COLORS.cyan }}>
              {periodLabel} CALENDAR PACING
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[11px] font-khand uppercase tracking-widest border-b-[2px]" style={{ color: `${BRAND_COLORS.primary}99`, backgroundColor: `${BRAND_COLORS.frost}80`, borderColor: `${BRAND_COLORS.primary}1A` }}>
                <tr>
                  <th className="px-6 py-4 pt-[18px] pb-[14px]">Stay Month</th>
                  <th className="px-6 py-4 pt-[18px] pb-[14px] text-right">{selectedYear || '2026'} OTB Revenue</th>
                  <th className="px-6 py-4 pt-[18px] pb-[14px] text-right">{selectedYear ? Number(selectedYear) - 1 : '2025'} STLY Revenue</th>
                  <th className="px-6 py-4 pt-[18px] pb-[14px] text-right">Absolute Var</th>
                  <th className="px-6 py-4 pt-[18px] pb-[14px] text-right">% Var</th>
                </tr>
              </thead>
              <tbody className="divide-y font-roboto text-sm" style={{ divideColor: `${BRAND_COLORS.primary}1A` }}>
                {filteredPaceRows.map((m, idx) => {
                  const absoluteVar = m.ty - m.stly;
                  const pctVar = m.stly > 0 ? (absoluteVar / m.stly) * 100 : 0;
                  return (
                    <tr key={idx} className="transition-colors hover-bg-dynamic" style={{ '--hover-bg-color': `${BRAND_COLORS.primary}0D` }}>
                      <td className="px-6 py-4 font-bold uppercase font-khand pt-[2px]" style={{ color: BRAND_COLORS.primary }}>{m.month}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(m.ty)}</td>
                      <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(m.stly)}</td>
                      <td className="px-6 py-4 text-right font-bold" style={{ color: absoluteVar >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>
                        {absoluteVar >= 0 ? `+${formatCurrency(absoluteVar)}` : `(${formatCurrency(Math.abs(absoluteVar))})`}
                      </td>
                      <td className="px-6 py-4 text-right font-bold" style={{ color: pctVar >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>
                        {pctVar >= 0 ? `+${pctVar.toFixed(1)}%` : `(${Math.abs(pctVar).toFixed(1)}%)`}
                      </td>
                    </tr>
                  );
                })}
                {filteredPaceRows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-xs font-khand uppercase tracking-widest text-slate-400 pt-[2px]">
                      No pacing entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex justify-between items-center text-[9px] font-khand font-bold uppercase tracking-widest" style={{ color: `${BRAND_COLORS.primary}80` }}>
        <span className="pt-[2px]">METRICS BY REVREBEL</span>
        <span className="pt-[2px]">BASED ON SELECTED PERIOD: {periodLabel}</span>
      </div>
    </div>
  );
}