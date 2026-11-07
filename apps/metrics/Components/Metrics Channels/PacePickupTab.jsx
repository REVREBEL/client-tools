import React, { useState, useMemo, useEffect } from 'react';

const BRAND_COLORS = {
  primary: "#163666",
  teal: "#047C97",
  cyan: "#00A6B6",
  aqua: "#71C9C5",
  powder: "#B2D3DE",
  yellow: "#FACA78",
  red: "#E05047",
  frost: "#EFF5F6"
};

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
  .hover-bg-dynamic:hover { background-color: var(--hover-bg-color); }
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
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: textColor }}>
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-300" style={{ transform: isNeg ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        <path d="M 12 3 L 5 11 H 8.5 V 21 H 15.5 V 11 H 19 Z" fill={bgColor} />
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

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const val = maxVal * ratio;
          const y = paddingTop + chartH - (ratio * chartH);
          return (
            <g key={ratio}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="font-roboto" fontSize="10" fill="#64748b">{formatCompactUSD(val)}</text>
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
              <text x={groupX + barWidth + 2} y={height - 12} textAnchor="middle" className="font-khand font-bold uppercase" fontSize="11" fill={BRAND_COLORS.primary}>
                {String(d.month).substring(0, 3).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
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
    points.push({ x: px, y: py });
  }

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  const markerX = paddingLeft + ((90 - x0) / 90) * chartW;
  const markerY = paddingTop + chartH - (generatePickup(x0) / 100) * chartH;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {[0, 25, 50, 75, 100].map((pct) => (
          <line key={pct} x1={paddingLeft} y1={paddingTop + chartH - (pct / 100) * chartH} x2={width - paddingRight} y2={paddingTop + chartH - (pct / 100) * chartH} stroke="#e2e8f0" strokeDasharray="3,3" />
        ))}
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

  const parsedData = useMemo(() => {
    const result = { years: [], paceRows: [], channelRows: [] };
    if (!data || !data.length) return result;

    /*
      ROW INDEX STRATEGY FOR GOOGLE SHEETS / BIGQUERY DATA:
      - Row 1 (idx 0): Identifier headers / clean column names
      - Row 2 (idx 1): Raw BigQuery source output headers (strictly bypassed)
      - Row 3+ (idx 2+): Primary data payload rows
    */


    const headers = data[0]?.row || [];
    const findCol = (str) => headers.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());

    const map = {
      paceYear: findCol("pace_year"),
      paceMonth: findCol("pace_stay_month"),
      paceMetricType: findCol("pace_metric_type"),
      paceMetric: findCol("pace_metric"),
      paceTYRev: findCol("pace_ty_revenue"),
      paceSTLYRev: findCol("pace_stly_revenue"),
      channelYear: findCol("channel_year"),
      channelMonth: findCol("channel_stay_month"),
      channelNights: findCol("channel_nights"),
      channelRev: findCol("channel_revenue"),
      channelResn: findCol("channel_no_resn"),
      channelLead: findCol("channel_lead_days")
    };

    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (!r) return;

      if (map.paceYear !== -1 && r[map.paceYear]) {
        result.paceRows.push({
          year: Number(r[map.paceYear]),
          month: safeString(r[map.paceMonth]).toUpperCase(),
          metricType: safeString(r[map.paceMetricType]).toUpperCase(),
          metric: safeString(r[map.paceMetric]),
          ty: Number(r[map.paceTYRev]) || 0,
          stly: Number(r[map.paceSTLYRev]) || 0
        });
      }

      if (map.channelYear !== -1 && r[map.channelYear]) {
        result.channelRows.push({
          year: Number(r[map.channelYear]),
          month: safeString(r[map.channelMonth]).toUpperCase(),
          nights: Number(r[map.channelNights]) || 0,
          revenue: Number(r[map.channelRev]) || 0,
          resn: Number(r[map.channelResn]) || 0,
          lead: Number(r[map.channelLead]) || 0
        });
      }
    });

    const yrSet = new Set(result.paceRows.map(r => String(r.year)).concat(result.channelRows.map(r => String(r.year))));
    result.years = yrSet.size > 0 ? Array.from(yrSet).sort().reverse() : ["2026", "2025"];
    return result;
  }, [data]);

  const { years, paceRows, channelRows } = parsedData;

  useEffect(() => {
    if (years.length > 0 && (!selectedYear || !years.includes(selectedYear))) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  const activeMonthsList = useMemo(() => {
    if (selectedMonth === 'YEAR') return MONTH_ORDER;
    if (selectedMonth === 'YTD') return MONTH_ORDER.slice(0, 7);
    return [selectedMonth];
  }, [selectedMonth]);

  const paceSourcesList = useMemo(() => {
    const set = new Set(paceRows.map(r => r.metric).filter(Boolean));
    return Array.from(set).sort();
  }, [paceRows]);

  const filteredPaceRows = useMemo(() => {
    const yrNum = Number(selectedYear) || 2026;
    let base = paceRows.filter(r => (r.year === yrNum) && activeMonthsList.includes(r.month));
    if (selectedPaceSource !== 'ALL') {
      base = base.filter(r => safeString(r.metric).toUpperCase() === selectedPaceSource.toUpperCase());
    }
    return base;
  }, [paceRows, selectedYear, activeMonthsList, selectedPaceSource]);

  const paceTotals = useMemo(() => {
    const totalTY = filteredPaceRows.reduce((sum, d) => sum + (d.ty || 0), 0);
    const totalSTLY = filteredPaceRows.reduce((sum, d) => sum + (d.stly || 0), 0);
    const paceVar = totalTY - totalSTLY;
    const paceVarPct = totalSTLY > 0 ? (paceVar / totalSTLY) * 100 : 0;
    return { totalTY, totalSTLY, paceVar, paceVarPct };
  }, [filteredPaceRows]);

  const avgLead = useMemo(() => {
    const yrNum = Number(selectedYear) || 2026;
    const currentSet = channelRows.filter(d => d.year === yrNum && activeMonthsList.includes(d.month));
    return currentSet.length > 0 ? currentSet.reduce((s, d) => s + d.lead, 0) / currentSet.length : 15;
  }, [channelRows, selectedYear, activeMonthsList]);

  return (
    <div className="min-h-screen font-roboto select-none" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />

      <header className="bg-white border-b sticky top-0 z-40 p-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-khand font-bold tracking-wider">PICKUP & PACE DASHBOARD</h1>
          <div className="flex gap-3">
            <div className="flex items-center p-1.5 border shadow-sm bg-white">
              <IconFilter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
              <select value={selectedPaceSource} onChange={(e) => setSelectedPaceSource(e.target.value)} className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 font-khand uppercase">
                <option value="ALL">ALL SOURCES</option>
                {paceSourcesList.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex items-center p-1.5 border shadow-sm bg-white">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 font-khand uppercase">
                <option value="YEAR">FULL YEAR</option>
                <option value="YTD">YTD VIEW</option>
                {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.primary }}>
            <span className="text-lg font-khand font-bold uppercase" style={{ color: `${BRAND_COLORS.powder}B3` }}>Pace Variance</span>
            <span className="text-4xl font-khand font-bold uppercase" style={{ color: BRAND_COLORS.powder }}>
              {paceTotals.paceVar >= 0 ? `+$${formatCompact(paceTotals.paceVar)}` : `-$${formatCompact(Math.abs(paceTotals.paceVar))}`}
            </span>
          </div>
          <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.cyan }}>
            <span className="text-lg font-khand font-bold uppercase" style={{ color: `${BRAND_COLORS.yellow}B3` }}>OTB Revenue</span>
            <span className="text-4xl font-khand font-bold uppercase" style={{ color: BRAND_COLORS.yellow }}>${formatCompact(paceTotals.totalTY)}</span>
          </div>
          <div className="p-5 flex flex-col justify-center items-center text-center h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.powder }}>
            <h3 className="text-6xl font-khand font-bold leading-none">{Math.round(avgLead)}</h3>
            <p className="text-sm font-khand font-bold uppercase tracking-wider mt-1">LEAD DAYS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 border-[3px] rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold text-xl mb-4">Revenue OTB Pace</h3>
            <PaceComparisonChart data={filteredPaceRows} selectedYear={selectedYear} />
          </div>
          <div className="bg-white p-8 border-[3px] rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold text-xl mb-4">Booking Window Pickup Velocity</h3>
            <PickupPatternChart leadDays={avgLead} />
          </div>
        </div>
      </main>
    </div>
  );
}