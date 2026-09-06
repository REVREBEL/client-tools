import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  ChevronDown,
  LayoutDashboard,
  Database,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  BarChart3,
  Search
} from 'lucide-react';

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
  white: "#fafafa", 
  successGreen: "#00A6B6"
};

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
  .hover-bg-dynamic:hover { background-color: var(--hover-bg-color); }
  .hover-text-dynamic:hover { color: var(--hover-color); }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

const factorial = (n) => { if (n <= 1) return 1; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatPreciseCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Math.round(val || 0));
const formatCompact = (val) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val || 0);
const formatCompactUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(val || 0);

function ChangeIndicator({ isNeg, textColor, bgColor }) {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: textColor }}>
      <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform duration-300" style={{ transform: isNeg ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        <path d="M 12 3 L 5 11 H 8.5 V 21 H 15.5 V 11 H 19 Z" fill={bgColor} />
      </svg>
    </div>
  );
}

function KPICard({ label, value, diff, isNeg, bgColor, textColor, labelColor }) {
  return (
    <div className="p-5 flex flex-col justify-between h-44 shadow-md transition-transform hover:scale-[1.02] rounded-none border border-black/5 min-w-0 relative" style={{ backgroundColor: bgColor }}>
      <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: labelColor }}>{label}</span>
      <div className="flex flex-col gap-1.5 mt-auto">
        <span className="text-3xl md:text-4xl lg:text-5xl font-khand font-bold uppercase tracking-tight leading-tight pt-[2px] truncate" style={{ color: textColor }}>{value}</span>
        <div className="flex items-center gap-3 mt-1 shrink-0">
          <ChangeIndicator isNeg={isNeg} textColor={textColor} bgColor={bgColor} />
          <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: textColor }}>{diff}</span>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data, colors }) {
  const [activeSlice, setActiveSlice] = useState(null);
  const width = 280;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const rOuter = 120;
  const rInner = 80;

  const total = useMemo(() => data.reduce((acc, d) => acc + (d.value || 0), 0), [data]);

  const colorList = useMemo(() => {
    if (Array.isArray(colors)) return colors;
    if (colors && typeof colors === 'object') return Object.values(colors);
    return Object.values(BRAND_COLORS);
  }, [colors]);

  const slices = useMemo(() => {
    if (!total || !data.length) return [];
    let currentAngle = 0;
    return data.map((d, i) => {
      const sliceAngle = (d.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const isHovered = activeSlice === i;
      const currentROuter = isHovered ? rOuter + 8 : rOuter;

      const x1 = cx + currentROuter * Math.sin(startAngle);
      const y1 = cy - currentROuter * Math.cos(startAngle);
      const x2 = cx + currentROuter * Math.sin(endAngle);
      const y2 = cy - currentROuter * Math.cos(endAngle);

      const x3 = cx + rInner * Math.sin(endAngle);
      const y3 = cy - rInner * Math.cos(endAngle);
      const x4 = cx + rInner * Math.sin(startAngle);
      const y4 = cy - rInner * Math.cos(startAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${currentROuter} ${currentROuter} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

      return { ...d, color: colorList[i % colorList.length], pathData, index: i };
    });
  }, [data, colorList, total, activeSlice]);

  const hoveredData = activeSlice !== null ? slices[activeSlice] : null;

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <svg width={width} height={height} className="overflow-visible">
        <g>
          {slices.map((slice) => (
            <path 
              key={slice.index} 
              d={slice.pathData} 
              fill={slice.color} 
              stroke="#fafafa" 
              strokeWidth="2" 
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={() => setActiveSlice(slice.index)}
              onMouseLeave={() => setActiveSlice(null)}
            />
          ))}
        </g>
        <text x={cx} y={cy - 8} textAnchor="middle" className="font-khand font-bold uppercase" style={{ fontSize: '22px', fill: BRAND_COLORS.primary }}> TOTAL </text>
        <text x={cx} y={cy + 22} textAnchor="middle" className="font-khand font-bold" style={{ fontSize: '24px', fill: BRAND_COLORS.primary }}> {`${formatNumber(total)} RNS`} </text>
      </svg>
      {/* Stacked Vertical Legend */}
      <div className="flex flex-col gap-2 mt-4 w-full max-w-[220px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-roboto font-medium text-slate-600">
            <div className="w-3.5 h-3.5 rounded-none shrink-0" style={{ backgroundColor: colorList[i % colorList.length] }}></div>
            <span className="uppercase text-xs font-bold font-khand pt-[2px] truncate" style={{ color: BRAND_COLORS.primary }}>{d.name}</span>
          </div>
        ))}
      </div>
      {hoveredData && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 border-[3px] p-3 shadow-xl pointer-events-none rounded-none text-center min-w-[140px] z-20" style={{ borderColor: BRAND_COLORS.primary }}>
          <p className="font-khand font-bold uppercase text-sm border-b border-slate-100 pb-1 mb-1 leading-tight" style={{ color: BRAND_COLORS.primary }}>{hoveredData.name}</p>
          <p className="font-roboto font-normal text-[10px] text-slate-500 m-0 leading-tight">Nights: <strong style={{ color: BRAND_COLORS.primary }}>{formatNumber(hoveredData.value)}</strong></p>
          <p className="font-roboto font-normal text-[10px] text-slate-500 m-0 leading-tight">Revenue: <strong style={{ color: BRAND_COLORS.cyan }}>{formatCurrency(hoveredData.revenue)}</strong></p>
        </div>
      )}
    </div>
  );
}

function PaceComparisonChart({ data, selectedYear, roomsConfig = 188 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  if (!data || !data.length) return null;
  const width = 600; const height = 280; const paddingLeft = 60; const paddingBottom = 40; const paddingTop = 20; const paddingRight = 20;
  const chartW = width - paddingLeft - paddingRight; const chartH = height - paddingTop - paddingBottom;
  const maxVal = Math.max(...data.map(d => Math.max(d.ty || 0, d.stly || 0)), 100) * 1.15;
  const groupWidth = chartW / data.length; const barWidth = Math.max(8, (groupWidth * 0.35));
  const tyYearLabel = selectedYear || "2026"; const stlyYearLabel = selectedYear ? String(Number(selectedYear) - 1) : "2025";
  const DAYS_IN_MONTH = { JAN: 31, FEB: 28, MAR: 31, APR: 30, MAY: 31, JUN: 30, JUL: 31, AUG: 31, SEP: 30, OCT: 31, NOV: 30, DEC: 31 };
  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  let tooltipData = null;
  if (activeItem) {
    const monthKey = String(activeItem.month || '').substring(0, 3).toUpperCase();
    const days = DAYS_IN_MONTH[monthKey] || 30;
    const capacity = days * (roomsConfig || 188);
    const tyRev = activeItem.ty || 0; const stlyRev = activeItem.stly || 0; const revChg = tyRev - stlyRev;
    const tyNights = activeItem.tyNights || (tyRev > 0 ? Math.round(tyRev / 185) : 0);
    const stlyNights = activeItem.stlyNights || (stlyRev > 0 ? Math.round(stlyRev / 175) : 0);
    const nightsChg = tyNights - stlyNights;
    const tyAdr = tyNights > 0 ? tyRev / tyNights : 0;
    const stlyAdr = stlyNights > 0 ? stlyRev / stlyNights : 0;
    const adrChg = tyAdr - stlyAdr;
    const tyOcc = capacity > 0 ? (tyNights / capacity) * 100 : 0;
    const stlyOcc = capacity > 0 ? (stlyNights / capacity) * 100 : 0;
    const occChg = tyOcc - stlyOcc;
    const groupX = paddingLeft + (hoveredIndex * groupWidth) + groupWidth / 2;
    tooltipData = { month: activeItem.month, posX: (groupX / width) * 100, tyRev, revChg, tyNights, nightsChg, tyAdr, adrChg, tyOcc, occChg };
  }

  return (
    <div className="w-full relative select-none">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = maxVal * ratio; const y = paddingTop + chartH - (ratio * chartH);
            return (
              <g key={ratio}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="font-roboto" fontSize="10" fill="#64748b">{formatCompactUSD(val)}</text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const groupX = paddingLeft + (i * groupWidth) + (groupWidth - (barWidth * 2 + 4)) / 2;
            const tyH = (d.ty / maxVal) * chartH; const stlyH = (d.stly / maxVal) * chartH;
            const tyY = paddingTop + chartH - tyH; const stlyY = paddingTop + chartH - stlyH;
            const isHovered = hoveredIndex === i;
            return (
              <g key={d.month || i}>
                <rect x={groupX} y={tyY} width={barWidth} height={tyH} fill={BRAND_COLORS.teal} opacity={isHovered ? 1 : 0.9} stroke={isHovered ? BRAND_COLORS.primary : 'none'} strokeWidth="1" />
                <rect x={groupX + barWidth + 4} y={stlyY} width={barWidth} height={stlyH} fill={BRAND_COLORS.aqua} opacity={isHovered ? 1 : 0.85} stroke={isHovered ? BRAND_COLORS.primary : 'none'} strokeWidth="1" />
                <text x={groupX + barWidth + 2} y={height - 12} textAnchor="middle" className="font-khand font-bold uppercase" fontSize="11" fill={BRAND_COLORS.primary}>{String(d.month).substring(0, 3).toUpperCase()}</text>
                <rect x={paddingLeft + i * groupWidth} y={paddingTop} width={groupWidth} height={chartH + 20} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} />
              </g>
            );
          })}
        </svg>
      </div>
      {tooltipData && (
        <div className="absolute z-30 bg-white/95 border-[2px] p-3 shadow-xl pointer-events-none rounded-none text-left min-w-[220px] transition-all duration-150" style={{ borderColor: BRAND_COLORS.teal, left: `${Math.min(Math.max(tooltipData.posX, 20), 75)}%`, top: '10%' }} >
          <p className="font-khand font-bold uppercase text-xs border-b border-slate-100 pb-1 mb-2 flex justify-between items-center" style={{ color: BRAND_COLORS.primary }}>
            <span>{tooltipData.month} PACING ({tyYearLabel})</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#047C97] text-white">OTB VS STLY</span>
          </p>
          <div className="space-y-1.5 font-roboto text-xs">
            <div className="flex justify-between gap-3 items-center">
              <span className="text-slate-500 font-medium">Occupancy OTB:</span>
              <div><strong style={{ color: BRAND_COLORS.primary }}>{tooltipData.tyOcc.toFixed(1)}%</strong> <span className="ml-1 text-[11px] font-bold" style={{ color: tooltipData.occChg >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}> ({tooltipData.occChg >= 0 ? `+${tooltipData.occChg.toFixed(1)}%` : `${tooltipData.occChg.toFixed(1)}%`}) </span></div>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <span className="text-slate-500 font-medium">Rooms OTB:</span>
              <div><strong style={{ color: BRAND_COLORS.primary }}>{formatNumber(tooltipData.tyNights)}</strong> <span className="ml-1 text-[11px] font-bold" style={{ color: tooltipData.nightsChg >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}> ({tooltipData.nightsChg >= 0 ? `+${formatNumber(tooltipData.nightsChg)}` : formatNumber(tooltipData.nightsChg)}) </span></div>
            </div>
            <div className="flex justify-between gap-3 items-center">
              <span className="text-slate-500 font-medium">ADR OTB:</span>
              <div><strong style={{ color: BRAND_COLORS.primary }}>{formatPreciseCurrency(tooltipData.tyAdr)}</strong> <span className="ml-1 text-[11px] font-bold" style={{ color: tooltipData.adrChg >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}> ({tooltipData.adrChg >= 0 ? `+${formatPreciseCurrency(tooltipData.adrChg)}` : `-${formatPreciseCurrency(Math.abs(tooltipData.adrChg))}`}) </span></div>
            </div>
            <div className="flex justify-between gap-3 items-center border-t pt-1 border-slate-100">
              <span className="text-slate-500 font-medium">Revenue OTB:</span>
              <div><strong style={{ color: BRAND_COLORS.teal }}>{formatCurrency(tooltipData.tyRev)}</strong> <span className="ml-1 text-[11px] font-bold" style={{ color: tooltipData.revChg >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}> ({tooltipData.revChg >= 0 ? `+${formatCompactUSD(tooltipData.revChg)}` : `-${formatCompactUSD(Math.abs(tooltipData.revChg))}`}) </span></div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2 text-xs font-khand font-bold uppercase"><div className="w-3 h-3" style={{ backgroundColor: BRAND_COLORS.teal }}></div><span className="pt-[2px]">{tyYearLabel} OTB REVENUE</span></div>
        <div className="flex items-center gap-2 text-xs font-khand font-bold uppercase"><div className="w-3 h-3" style={{ backgroundColor: BRAND_COLORS.aqua }}></div><span className="pt-[2px]">{stlyYearLabel} STLY REVENUE</span></div>
      </div>
    </div>
  );
}

function PickupPatternChart({ pickupData, fallbackLeadDays, fallbackAvgADR = 185, fallbackTotalNights = 1200 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverType, setHoverType] = useState(null);
  const width = 600; const height = 280; const paddingLeft = 45; const paddingRight = 55; const paddingBottom = 40; const paddingTop = 25;
  const chartW = width - paddingLeft - paddingRight; const chartH = height - paddingTop - paddingBottom;
  
  const windowDays = [90, 75, 60, 45, 30, 21, 14, 7, 3, 0];

  const points = useMemo(() => {
    if (pickupData && pickupData.length > 0) {
      // Use the point at 0 days out as the 100% occupancy reference (Realized pickup)
      const day0 = pickupData.find(r => r.daysOut === 0) || pickupData[pickupData.length - 1];
      const realizedRooms = Math.max(day0.rooms, 1);

      return windowDays.map((d, idx) => {
        const row = pickupData.find(r => r.daysOut === d) || { rooms: 0, revenue: 0 };
        const px = paddingLeft + ((90 - d) / 90) * chartW;
        const rooms = row.rooms;
        const revenue = row.revenue;
        const pct = (rooms / realizedRooms) * 100;
        const adr = rooms > 0 ? revenue / rooms : 0;
        
        let occChange = 0; let roomsChange = 0; let adrChange = 0;
        if (idx > 0) {
          const prevD = windowDays[idx - 1];
          const prevRow = pickupData.find(r => r.daysOut === prevD) || { rooms: 0, revenue: 0 };
          const prevPct = (prevRow.rooms / realizedRooms) * 100;
          const prevAdr = prevRow.rooms > 0 ? prevRow.revenue / prevRow.rooms : 0;
          occChange = pct - prevPct; roomsChange = rooms - prevRow.rooms; adrChange = adr - prevAdr;
        }
        return { d, pct, rooms, adr, occChange, roomsChange, adrChange, px, pyOcc: paddingTop + chartH - (Math.min(pct, 100) / 100) * chartH };
      });
    }

    const x0 = fallbackLeadDays || 15; const k = 0.08;
    const generatePickup = (d) => 100 / (1 + Math.exp(k * (d - x0)));
    const baseAdr = fallbackAvgADR > 0 ? fallbackAvgADR : 185;
    const fallbackCap = fallbackTotalNights > 0 ? fallbackTotalNights : 1250;
    return windowDays.map((d, idx) => {
      const pct = generatePickup(d); const px = paddingLeft + ((90 - d) / 90) * chartW;
      const rooms = Math.round((pct / 100) * fallbackCap);
      const adrMultiplier = 0.82 + (0.28 * Math.pow((90 - d) / 90, 0.85));
      const adr = baseAdr * adrMultiplier;
      let occChange = 0; let roomsChange = 0; let adrChange = 0;
      if (idx > 0) {
        const prevPct = generatePickup(windowDays[idx - 1]);
        const prevRooms = Math.round((prevPct / 100) * fallbackCap);
        const prevAdr = baseAdr * (0.82 + (0.28 * Math.pow((90 - windowDays[idx - 1]) / 90, 0.85)));
        occChange = pct - prevPct; roomsChange = rooms - prevRooms; adrChange = adr - prevAdr;
      }
      return { d, pct, rooms, adr, occChange, roomsChange, adrChange, px, pyOcc: paddingTop + chartH - (pct / 100) * chartH };
    });
  }, [windowDays, chartW, chartH, pickupData, fallbackAvgADR, fallbackLeadDays, fallbackTotalNights]);
  
  const maxAdr = useMemo(() => Math.max(...points.map(p => p.adr), 100) * 1.15, [points]);
  const pointsWithY = useMemo(() => points.map(p => ({ ...p, pyAdr: paddingTop + chartH - (p.adr / maxAdr) * chartH })), [points, chartH, maxAdr]);
  const pathOccD = pointsWithY.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.pyOcc.toFixed(1)}`, '');
  const pathAdrD = pointsWithY.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.pyAdr.toFixed(1)}`, '');

  return (
    <div className="w-full relative select-none">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = paddingTop + chartH - (pct / 100) * chartH;
            return (
              <g key={pct}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                <text x={paddingLeft - 6} y={y + 3} textAnchor="end" className="font-roboto font-bold" fontSize="9" fill={BRAND_COLORS.cyan}>{`${pct}%`}</text>
              </g>
            );
          })}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + chartH - (ratio * chartH);
            return <text key={ratio} x={width - paddingRight + 6} y={y + 3} textAnchor="start" className="font-roboto font-bold" fontSize="9" fill={BRAND_COLORS.orange}>{formatCompactUSD(maxAdr * ratio)}</text>;
          })}
          {[90, 60, 30, 0].map((d) => (
            <text key={d} x={paddingLeft + ((90 - d) / 90) * chartW} y={height - 12} textAnchor="middle" className="font-khand font-bold" fontSize="10" fill={BRAND_COLORS.primary}>{`${d} DAYS OUT`}</text>
          ))}
          <path d={pathOccD} fill="none" stroke={BRAND_COLORS.cyan} strokeWidth="3.5" /><path d={pathAdrD} fill="none" stroke={BRAND_COLORS.orange} strokeWidth="3.5" strokeDasharray="5,2" />
          {pointsWithY.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.px} cy={p.pyOcc} r={hoveredPoint === idx && hoverType === 'occ' ? 7 : 4} fill={BRAND_COLORS.cyan} stroke="#FFFFFF" strokeWidth="2" className="cursor-pointer transition-all duration-150" onMouseEnter={() => { setHoveredPoint(idx); setHoverType('occ'); }} onMouseLeave={() => { setHoveredPoint(null); setHoverType(null); }} />
              <circle cx={p.px} cy={p.pyAdr} r={hoveredPoint === idx && hoverType === 'adr' ? 7 : 4} fill={BRAND_COLORS.orange} stroke="#FFFFFF" strokeWidth="2" className="cursor-pointer transition-all duration-150" onMouseEnter={() => { setHoveredPoint(idx); setHoverType('adr'); }} onMouseLeave={() => { setHoveredPoint(null); setHoverType(null); }} />
            </g>
          ))}
        </svg>
      </div>
      {hoveredPoint !== null && hoverType && (
        <div className="absolute z-30 bg-white/95 border-[2px] p-3 shadow-xl pointer-events-none rounded-none text-left min-w-[180px] transition-all duration-150" style={{ borderColor: hoverType === 'occ' ? BRAND_COLORS.cyan : BRAND_COLORS.orange, left: `${Math.min(Math.max((pointsWithY[hoveredPoint].px / width) * 100, 15), 80)}%`, top: `${hoverType === 'occ' ? Math.max((pointsWithY[hoveredPoint].pyOcc / height) * 100 - 35, 5) : Math.max((pointsWithY[hoveredPoint].pyAdr / height) * 100 - 35, 5)}%` }} >
          <p className="font-khand font-bold uppercase text-xs border-b border-slate-100 pb-1 mb-1.5 flex justify-between items-center" style={{ color: BRAND_COLORS.primary }}><span>{pointsWithY[hoveredPoint].d === 0 ? 'SAME DAY (0D)' : `${pointsWithY[hoveredPoint].d} DAYS OUT`}</span><span className="text-[10px] px-1.5 py-0.5" style={{ backgroundColor: hoverType === 'occ' ? BRAND_COLORS.cyan : BRAND_COLORS.orange, color: '#FFFFFF' }}>{hoverType === 'occ' ? 'OCCUPANCY' : 'ADR RATE'}</span></p>
          <div className="space-y-1 font-roboto text-xs">
            {hoverType === 'occ' ? (
              <>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Occupancy %:</span><strong style={{ color: BRAND_COLORS.cyan }}>{pointsWithY[hoveredPoint].pct.toFixed(1)}%</strong></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Occ Change:</span><strong style={{ color: pointsWithY[hoveredPoint].occChange >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{pointsWithY[hoveredPoint].occChange >= 0 ? `+${pointsWithY[hoveredPoint].occChange.toFixed(1)}%` : `${pointsWithY[hoveredPoint].occChange.toFixed(1)}%`}</strong></div>
                <div className="flex justify-between gap-3 border-t pt-1 border-slate-100"><span className="text-slate-500">Rooms OTB:</span><strong style={{ color: BRAND_COLORS.primary }}>{formatNumber(pointsWithY[hoveredPoint].rooms)}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Rooms Pickup:</span><strong style={{ color: pointsWithY[hoveredPoint].roomsChange >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{pointsWithY[hoveredPoint].roomsChange >= 0 ? `+${formatNumber(pointsWithY[hoveredPoint].roomsChange)}` : formatNumber(pointsWithY[hoveredPoint].roomsChange)}</strong></div>
              </>
            ) : (
              <>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Total ADR:</span><strong style={{ color: BRAND_COLORS.orange }}>{formatPreciseCurrency(pointsWithY[hoveredPoint].adr)}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">ADR Change:</span><strong style={{ color: pointsWithY[hoveredPoint].adrChange >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{pointsWithY[hoveredPoint].adrChange >= 0 ? `+${formatPreciseCurrency(pointsWithY[hoveredPoint].adrChange)}` : `-${formatPreciseCurrency(Math.abs(pointsWithY[hoveredPoint].adrChange))}`}</strong></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DAYS_IN_MONTH_RAW = { JAN: 31, FEB: 28, MAR: 31, APR: 30, MAY: 31, JUN: 30, JUL: 31, AUG: 31, SEP: 30, OCT: 31, NOV: 30, DEC: 31 };

function App({ data, updateItem, deleteItem, insertItem, moveItem, followLink }) {
  const [selectedMonth, setSelectedMonth] = useState('YTD');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPaceSource, setSelectedPaceSource] = useState('ALL');

  const [profileMetricType, setProfileMetricType] = useState('CHANNEL');
  const [selectedChannelProfile, setSelectedChannelProfile] = useState('ALL');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Comprehensive Parsing
  const parsedData = useMemo(() => {
    const result = { records: [], paceRows: [], channelRows: [], sourceRows: [], subsourceRows: [], pickupRows: [], years: [], propertyName: "REBEL HOTEL", rooms: 188, ytdTotals: {}, ytdChannelTotals: {} };
    if (!data || !data.length) return result;
    
    const headers = data[0].row || [];
    const findCol = (str) => {
      const idx0 = headers.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());
      if (idx0 !== -1) return idx0;
      const headers1 = data[1]?.row || [];
      return headers1.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());
    };
    
    const findColMulti = (candidates) => {
      for (const c of candidates) {
        const cleanCand = c.toLowerCase().replace(/\s+/g, '');
        const idx = headers.findIndex(h => safeString(h).toLowerCase().replace(/\s+/g, '') === cleanCand) !== -1 ? headers.findIndex(h => safeString(h).toLowerCase().replace(/\s+/g, '') === cleanCand) : (data[1]?.row || []).findIndex(h => safeString(h).toLowerCase().replace(/\s+/g, '') === cleanCand);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const map = {
      property: findCol("property"),
      rooms: findCol("rooms"),
      channelYear: findColMulti(["channel_year", "source_year"]),
      channelMonth: findColMulti(["channel_stay_month", "source_stay_month"]),
      channelMetric: findColMulti(["channel_metric", "source_metric"]),
      channelMetricCode: findColMulti(["channel_metric_code", "source_metric_code"]),
      channelResn: findColMulti(["channel_no_resn", "source_no_resn"]),
      channelNights: findColMulti(["channel_nights", "source_nights"]),
      channelRev: findColMulti(["channel_revenue", "source_revenue"]),
      channelADR: findColMulti(["channel_adr", "source_adr"]),
      channelALOS: findColMulti(["channel_alos", "source_alos"]),
      channelLead: findColMulti(["channel_lead_days", "source_lead_days"]),
      paceYear: findColMulti(["pace_year", "source_year", "year"]),
      paceMonth: findColMulti(["pace_stay_month", "source_stay_month", "stay_month"]),
      paceMetricType: findColMulti(["pace_metric_type", "source"]),
      paceMetric: findColMulti(["pace_metric", "source_metric", "metric"]),
      paceTYRev: findCol("pace_ty_revenue"),
      paceSTLYRev: findCol("pace_stly_revenue"),
      paceTYNights: findCol("pace_ty_room_nights"),
      paceSTLYNights: findCol("pace_stly_room_nights"),
      paceSort: findCol("pace_sort"),
      sourceYear: findColMulti(["source_year", "year"]),
      sourceMonth: findColMulti(["source_stay_month", "stay_month"]),
      sourceMetric: findColMulti(["source_metric", "metric"]),
      sourceResn: findColMulti(["source_no_resn", "no_resn"]),
      sourceNights: findColMulti(["source_nights", "nights"]),
      sourceRev: findColMulti(["source_revenue", "revenue"]),
      sourceLead: findColMulti(["source_lead_days", "lead_days"]),
      sourceYtdYear: findCol("source_ytd_year"),
      sourceYtdMetric: findCol("source_ytd_metric"),
      sourceYtdPeriod: findCol("source_ytd_period"),
      sourceYtdRev: findCol("source_ytd_revenue"),
      sourceYtdNights: findCol("source_ytd_nights"),
      sourceYtdResn: findCol("source_ytd_no_resn"),
      sourceYtdLead: findCol("source_ytd_lead_days"),
      subsourceYear: findColMulti(["subsource_year"]),
      subsourceMonth: findColMulti(["subsource_stay_month"]),
      subsourceMetric: findColMulti(["subsource_metric"]),
      subsourceResn: findColMulti(["subsource_no_resn"]),
      subsourceNights: findColMulti(["subsource_nights"]),
      subsourceRev: findColMulti(["subsource_revenue"]),
      subsourceLead: findColMulti(["subsource_lead_days"]),
      pickupYear: findColMulti(["pickup_year", "pickup_yr"]),
      pickupMonth: findColMulti(["pickup_stay_month", "pickup_month"]),
      pickupBreakoutType: findColMulti(["pickup_breakout_type", "pace_breakout_type"]),
      pickupBreakout: findColMulti(["pickup_breakout", "pace_breakout"]),
      pickupMetric: findColMulti(["pickup_metric", "pace_metric"]),
      pickupDaysOut: findColMulti(["pickup_days_out", "pickup_lead_days", "pickup_lead_window", "pickup_window", "pickup_days"]),
      pickupRooms: findColMulti(["pickup_rooms", "pickup_nights", "pickup_room_nights"]),
      pickupRev: findColMulti(["pickup_revenue", "pickup_rev", "pickup_rev_amt"]),
      pickupADR: findColMulti(["pickup_adr"])
    };

    data.forEach((item, idx) => {
      if (idx < 2) return;
      const r = item.row;
      if (!r) return;

      if (idx === 2) {
        if (map.property !== -1) result.propertyName = safeString(r[map.property]) || result.propertyName;
        if (map.rooms !== -1) result.rooms = Number(r[map.rooms]) || result.rooms;
      }

      if (map.channelYear !== -1 && typeof r[map.channelYear] === 'number') {
        const yr = r[map.channelYear];
        const month = safeString(r[map.channelMonth]).toUpperCase();
        const channel = safeString(r[map.channelMetric]);
        result.records.push({ 
          index_: item.index_, year: yr, month, channel, 
          resn: Number(r[map.channelResn]) || 0, nights: Number(r[map.channelNights]) || 0, adr: Number(r[map.channelADR]) || 0, revenue: Number(r[map.channelRev]) || 0, alos: Number(r[map.channelALOS]) || 0, lead: Number(r[map.channelLead]) || 0
        });
        result.channelRows.push({ year: yr, month, metric: channel, channel, resn: Number(r[map.channelResn]) || 0, nights: Number(r[map.channelNights]) || 0, revenue: Number(r[map.channelRev]) || 0, lead: Number(r[map.channelLead]) || 0 });
      }

      if (map.sourceYtdYear !== -1 && r[map.sourceYtdYear] !== null) {
        const yrYtd = Number(r[map.sourceYtdYear]);
        const periodYtd = safeString(r[map.sourceYtdPeriod]).toUpperCase();
        const metricYtd = safeString(r[map.sourceYtdMetric]).toUpperCase();
        if (periodYtd === 'YTD' && !isNaN(yrYtd)) {
          const ytdData = {
            rev: Number(r[map.sourceYtdRev]) || 0,
            nights: Number(r[map.sourceYtdNights]) || 0,
            resn: Number(r[map.sourceYtdResn]) || 0,
            leadDays: Number(r[map.sourceYtdLead]) || 0
          };
          if (metricYtd === 'TOTAL') {
            result.ytdTotals[yrYtd] = { ...ytdData, revenue: ytdData.rev };
          } else if (metricYtd) {
            if (!result.ytdChannelTotals[yrYtd]) result.ytdChannelTotals[yrYtd] = {};
            result.ytdChannelTotals[yrYtd][metricYtd] = ytdData;
          }
        }
      }

      if (map.paceTYRev !== -1 && (r[map.paceTYRev] !== null || r[map.paceSTLYRev] !== null)) {
        const metricName = safeString(r[map.paceMetric]);
        const rawType = safeString(r[map.paceMetricType]).toUpperCase();
        const type = (rawType === 'SOURCE' || (rawType === '' && metricName && metricName.toUpperCase() !== 'TOTAL')) ? 'SOURCE' : 'TOTAL';
        
        result.paceRows.push({ 
          year: map.paceYear !== -1 ? r[map.paceYear] : 2026, 
          month: map.paceMonth !== -1 ? safeString(r[map.paceMonth]).toUpperCase() : 'JAN', 
          metricType: type,
          metric: metricName || 'TOTAL', 
          ty: Number(r[map.paceTYRev]) || 0, 
          stly: Number(r[map.paceSTLYRev]) || 0,
          tyNights: Number(r[map.paceTYNights]) || 0,
          stlyNights: Number(r[map.paceSTLYNights]) || 0,
          sort: Number(r[map.paceSort]) || 0
        });
      }

      if (map.sourceMetric !== -1 && r[map.sourceMetric]) {
        const yr = map.sourceYear !== -1 && r[map.sourceYear] ? Number(r[map.sourceYear]) : 2026;
        result.sourceRows.push({ year: isNaN(yr) ? 2026 : yr, month: map.sourceMonth !== -1 && r[map.sourceMonth] ? safeString(r[map.sourceMonth]).toUpperCase() : 'JAN', metric: safeString(r[map.sourceMetric]), resn: Number(r[map.sourceResn]) || 0, nights: Number(r[map.sourceNights]) || 0, revenue: Number(r[map.sourceRev]) || 0, lead: Number(r[map.sourceLead]) || 0 });
      }

      if (map.subsourceMetric !== -1 && r[map.subsourceMetric]) {
        const yr = map.subsourceYear !== -1 && r[map.subsourceYear] ? Number(r[map.subsourceYear]) : 2026;
        result.subsourceRows.push({ year: isNaN(yr) ? 2026 : yr, month: map.subsourceMonth !== -1 && r[map.subsourceMonth] ? safeString(r[map.subsourceMonth]).toUpperCase() : 'JAN', metric: safeString(r[map.subsourceMetric]), resn: Number(r[map.subsourceResn]) || 0, nights: Number(r[map.subsourceNights]) || 0, revenue: Number(r[map.subsourceRev]) || 0, lead: Number(r[map.subsourceLead]) || 0 });
      }

      if (map.pickupBreakoutType !== -1 && r[map.pickupBreakoutType] !== null) {
        result.pickupRows.push({
          year: Number(r[map.pickupYear]) || 2026,
          month: safeString(r[map.pickupMonth] || r[map.sourceMonth]).toUpperCase(),
          breakoutType: safeString(r[map.pickupBreakoutType]).toUpperCase(),
          breakout: safeString(r[map.pickupBreakout]),
          metric: safeString(r[map.pickupMetric]).toUpperCase(),
          daysOut: Number(r[map.pickupDaysOut]),
          rooms: Number(r[map.pickupRooms]) || 0,
          revenue: Number(r[map.pickupRev]) || 0
        });
      }
    });

    const yrSet = new Set([...result.records.map(r => String(r.year)), ...result.paceRows.map(r => String(r.year))]);
    result.years = Array.from(yrSet).filter(y => y !== '0' && y !== 'NaN').sort().reverse();
    return result;
  }, [data]);

  const activeMonthsList = useMemo(() => {
    if (selectedMonth === 'YEAR') return MONTH_ORDER;
    if (selectedMonth === 'YTD') {
      const monthsInData = parsedData.records.filter(r => String(r.year) === selectedYear).map(r => r.month);
      const latestIdx = MONTH_ORDER.reduce((max, m, i) => monthsInData.includes(m) ? Math.max(max, i) : max, 6);
      return MONTH_ORDER.slice(0, latestIdx + 1);
    }
    return [selectedMonth];
  }, [selectedMonth, parsedData.records, selectedYear]);

  const filteredRecords = useMemo(() => {
    return parsedData.records.filter(r => 
      String(r.year) === selectedYear && 
      activeMonthsList.includes(r.month) && 
      r.channel && r.channel.toUpperCase() !== 'TOTAL'
    );
  }, [parsedData.records, selectedYear, activeMonthsList]);

  const priorYearRecords = useMemo(() => {
    const priorYear = String(Number(selectedYear) - 1);
    return parsedData.records.filter(r => 
      String(r.year) === priorYear && 
      activeMonthsList.includes(r.month) && 
      r.channel && r.channel.toUpperCase() !== 'TOTAL'
    );
  }, [parsedData.records, selectedYear, activeMonthsList]);

  const kpiStats = useMemo(() => {
    const aggregateData = (recs) => {
      const totalRev = recs.reduce((s, r) => s + (r.revenue || 0), 0);
      const totalNights = recs.reduce((s, r) => s + (r.nights || 0), 0);
      const totalRes = recs.reduce((s, r) => s + (r.resn || 0), 0);
      const leadWeightSum = recs.reduce((s, r) => s + (r.lead || 0) * (r.resn || 0), 0);
      return {
        totalRev, totalNights, totalRes,
        avgADR: totalNights > 0 ? totalRev / totalNights : 0,
        avgALOS: totalRes > 0 ? totalNights / totalRes : 0,
        avgLead: totalRes > 0 ? leadWeightSum / totalRes : 15
      };
    };
    const curr = aggregateData(filteredRecords);
    const prior = aggregateData(priorYearRecords);
    
    const yrNum = Number(selectedYear);
    const hasYtdAgg = selectedMonth === 'YTD' && parsedData.ytdTotals[yrNum];
    const totalRev = hasYtdAgg ? parsedData.ytdTotals[yrNum].revenue : curr.totalRev;
    const totalNights = hasYtdAgg ? parsedData.ytdTotals[yrNum].nights : curr.totalNights;
    const totalRes = hasYtdAgg ? parsedData.ytdTotals[yrNum].resn : curr.totalRes;
    const totalLead = hasYtdAgg ? parsedData.ytdTotals[yrNum].leadDays : curr.avgLead;

    const priorYrNum = yrNum - 1;
    const hasPriorYtdAgg = selectedMonth === 'YTD' && parsedData.ytdTotals[priorYrNum];
    const stlyRev = hasPriorYtdAgg ? parsedData.ytdTotals[priorYrNum].revenue : prior.totalRev;
    const stlyNights = hasPriorYtdAgg ? parsedData.ytdTotals[priorYrNum].nights : prior.totalNights;
    const stlyRes = hasPriorYtdAgg ? parsedData.ytdTotals[priorYrNum].resn : prior.totalRes;

    return {
      curr, prior,
      totalRev, totalNights, totalRes,
      stlyRev, stlyNights, stlyRes,
      avgADR: totalNights > 0 ? totalRev / totalNights : 0, 
      stlyADR: stlyNights > 0 ? stlyRev / stlyNights : 0,
      lead: totalLead, alos: totalRes > 0 ? totalNights / totalRes : 0, stlyAlos: stlyRes > 0 ? stlyNights / stlyRes : 0,
      avgLead: totalLead, avgALOS: totalRes > 0 ? totalNights / totalRes : 0, stlyALOS: stlyRes > 0 ? stlyNights / stlyRes : 0
    };
  }, [filteredRecords, priorYearRecords, selectedMonth, selectedYear, parsedData]);

  const performanceByChannel = useMemo(() => { 
    const years = parsedData.years;
    const channelOnlyData = parsedData.channelRows;
    const yrNum = Number(selectedYear) || (years[0] ? Number(years[0]) : 2026); 
    const currentGroup = channelOnlyData.filter(d => d.year === yrNum && activeMonthsList.includes(d.month) && safeString(d.channel || d.metric).toUpperCase() !== 'TOTAL');  
    const totalRevCurrent = currentGroup.reduce((sum, d) => sum + (d.revenue || 0), 0);  
    const map = {}; 
    currentGroup.forEach(d => { 
      if (!map[d.channel]) { 
        map[d.channel] = { resn: 0, nights: 0, revenue: 0, leadSum: 0, count: 0 }; 
      } 
      map[d.channel].resn += d.resn || 0; 
      map[d.channel].nights += d.nights || 0; 
      map[d.channel].revenue += d.revenue || 0; 
      map[d.channel].leadSum += d.lead || 0; 
      map[d.channel].count += 1; 
    });  
    return Object.keys(map).map(channel => { 
      const cur = map[channel]; 
      return { name: channel, resn: cur.resn, nights: cur.nights, value: cur.revenue, adr: cur.nights > 0 ? cur.revenue / cur.nights : 0, mix: totalRevCurrent > 0 ? cur.revenue / totalRevCurrent : 0, alos: cur.resn > 0 ? cur.nights / cur.resn : 0, lead: cur.count > 0 ? cur.leadSum / cur.count : 0 }; 
    }).sort((a, b) => b.value - a.value); 
  }, [parsedData.channelRows, selectedYear, activeMonthsList, parsedData.years]);

  const channelsList = useMemo(() => Array.from(new Set(parsedData.channelRows.map(d => safeString(d.metric || d.channel)).filter(b => Boolean(b) && b.toUpperCase() !== 'TOTAL'))).sort(), [parsedData.channelRows]);

  const paceSourcesList = useMemo(() => {
    const sourceRows = parsedData.paceRows.filter(r => r.metricType === 'SOURCE' && r.metric && r.metric.toUpperCase() !== 'TOTAL');
    const metricSortMap = {};
    sourceRows.forEach(r => {
      const m = r.metric;
      const sValue = Number(r.sort);
      if (!isNaN(sValue)) {
        if (metricSortMap[m] === undefined) metricSortMap[m] = sValue;
        else metricSortMap[m] = Math.min(metricSortMap[m], sValue);
      }
    });
    return Object.keys(metricSortMap).sort((a, b) => metricSortMap[a] - metricSortMap[b]);
  }, [parsedData.paceRows]);

  const filteredPaceRows = useMemo(() => {
    const yrNum = Number(selectedYear) || 2026;
    const currentYearRows = parsedData.paceRows.filter(r => (r.year === yrNum || !r.year) && activeMonthsList.includes(r.month));
    const monthsToCover = activeMonthsList;
    
    const monthMap = {};
    monthsToCover.forEach(m => {
      monthMap[m] = { year: yrNum, month: m, ty: 0, stly: 0, tyNights: 0, stlyNights: 0 };
    });

    if (selectedPaceSource === 'ALL') {
      currentYearRows.filter(r => r.metricType === 'SOURCE' && safeString(r.metric).toUpperCase() !== 'TOTAL').forEach(r => {
        const m = monthMap[r.month];
        if (m) {
          m.ty += (r.ty || 0);
          m.stly += (r.stly || 0);
          m.tyNights += (r.tyNights || 0);
          m.stlyNights += (r.stlyNights || 0);
        }
      });
    } else {
      currentYearRows.filter(r => r.metricType === 'SOURCE' && safeString(r.metric).toUpperCase() === selectedPaceSource.toUpperCase()).forEach(r => {
        if (monthMap[r.month]) monthMap[r.month] = { ...r };
      });
    }

    return monthsToCover.map(m => monthMap[m]);
  }, [parsedData.paceRows, selectedYear, activeMonthsList, selectedPaceSource]);

  const paceMonthTotals = useMemo(() => {
    const yrNum = Number(selectedYear) || 2026;
    const totals = {};
    activeMonthsList.forEach(m => { totals[m] = 0; });
    parsedData.paceRows.filter(r => (r.year === yrNum || !r.year) && r.metricType === 'SOURCE' && safeString(r.metric).toUpperCase() !== 'TOTAL').forEach(r => {
      if (totals[r.month] !== undefined) totals[r.month] += (r.tyNights || 0);
    });
    return totals;
  }, [parsedData.paceRows, selectedYear, activeMonthsList]);

  const filteredPickupData = useMemo(() => {
    const yrNum = Number(selectedYear);
    const monthsToProcess = activeMonthsList;
    
    let relevantRows = parsedData.pickupRows.filter(r => 
      (r.year === yrNum || !r.year) && 
      monthsToProcess.includes(r.month) && 
      (r.breakoutType === 'SOURCE' || !r.breakoutType)
    );

    let base;
    if (selectedPaceSource === 'ALL') {
      const totals = relevantRows.filter(r => safeString(r.breakout).toUpperCase() === 'TOTAL');
      if (totals.length > 0) {
        base = totals;
      } else {
        base = relevantRows.filter(r => safeString(r.breakout).toUpperCase() !== 'TOTAL');
      }
    } else {
      base = relevantRows.filter(r => safeString(r.breakout).toUpperCase() === selectedPaceSource.toUpperCase());
    }

    if (!base.length) return [];

    const windowMap = {};
    base.forEach(r => {
      const d = r.daysOut;
      if (!windowMap[d]) windowMap[d] = { daysOut: d, rooms: 0, revenue: 0 };
      if (r.metric === 'ROOM_NIGHTS') {
        windowMap[d].rooms += r.rooms;
      } else if (r.metric === 'REVENUE') {
        windowMap[d].revenue += r.revenue;
      } else {
        windowMap[d].rooms += r.rooms;
        windowMap[d].revenue += r.revenue;
      }
    });

    return Object.values(windowMap).sort((a, b) => b.daysOut - a.daysOut);
  }, [parsedData.pickupRows, selectedYear, activeMonthsList, selectedPaceSource]);

  const sourceKpiStats = useMemo(() => {
    if (selectedPaceSource === 'ALL') return kpiStats;
    const ch = performanceByChannel.find(c => c.name.toUpperCase() === selectedPaceSource.toUpperCase());
    if (!ch) return kpiStats;
    return {
      ...kpiStats,
      adr: ch.adr || kpiStats.avgADR,
      lead: ch.lead || kpiStats.lead,
      totalNights: ch.nights || kpiStats.totalNights
    };
  }, [performanceByChannel, selectedPaceSource, kpiStats]);

  const paceTotals = useMemo(() => {
    const totalTY = filteredPaceRows.reduce((sum, d) => sum + (d.ty || 0), 0);
    const totalSTLY = filteredPaceRows.reduce((sum, d) => sum + (d.stly || 0), 0);
    const paceVar = totalTY - totalSTLY;
    const paceVarPct = totalSTLY > 0 ? (paceVar / totalSTLY) * 100 : 0;
    return { totalTY, totalSTLY, paceVar, paceVarPct };
  }, [filteredPaceRows]);

  const stayProfilesMetrics = useMemo(() => {
    let activeSet = parsedData.channelRows;
    if (profileMetricType === 'SOURCE') activeSet = parsedData.sourceRows.length > 0 ? parsedData.sourceRows : parsedData.channelRows;
    if (profileMetricType === 'SUBSOURCE') activeSet = parsedData.subsourceRows.length > 0 ? parsedData.subsourceRows : parsedData.channelRows;

    const yrNum = Number(selectedYear);
    let filtered = activeSet.filter(d => (d.year === yrNum || !d.year) && activeMonthsList.includes(d.month));

    const isAll = !selectedChannelProfile || selectedChannelProfile.toUpperCase().startsWith('ALL');
    if (!isAll) {
      filtered = filtered.filter(d => safeString(d.metric || d.channel).toUpperCase() === safeString(selectedChannelProfile).toUpperCase());
    }

    const totalNights = filtered.reduce((sum, d) => sum + (d.nights || 0), 0);
    const totalRes = filtered.reduce((sum, d) => sum + (d.resn || 0), 0);
    const leadSum = filtered.reduce((sum, d) => sum + (d.lead || 0), 0);
    const leadCount = filtered.filter(d => (d.lead || 0) > 0).length || filtered.length;

    let targetALOS = (totalRes > 0 && isFinite(totalNights / totalRes)) ? totalNights / totalRes : 2.5;
    let targetLead = (leadCount > 0 && isFinite(leadSum / leadCount)) ? leadSum / leadCount : 15;
    
    return { stayNights: [12, 25, 30, 15, 10, 5, 3], leadTimes: [10, 8, 15, 20, 25, 15, 7], hasData: true, alos: targetALOS, lead: targetLead };
  }, [parsedData, profileMetricType, selectedChannelProfile, selectedYear, activeMonthsList]);

  const currentMetricOptions = useMemo(() => {
    const listSet = (set) => Array.from(new Set(set.map(d => safeString(d.metric)).filter(b => Boolean(b) && b.toUpperCase() !== 'TOTAL'))).sort();
    if (profileMetricType === 'SOURCE') return listSet(parsedData.sourceRows);
    if (profileMetricType === 'SUBSOURCE') return listSet(parsedData.subsourceRows);
    return Array.from(new Set(parsedData.channelRows.map(d => safeString(d.metric || d.channel)).filter(b => Boolean(b) && b.toUpperCase() !== 'TOTAL'))).sort();
  }, [profileMetricType, parsedData]);

  const periodLabel = `${selectedYear} ${selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth)}`;

  return (
    <div className="min-h-screen font-roboto select-none flex flex-col" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: `${BRAND_COLORS.aqua}33` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-6">
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
              
              <div className="flex items-center gap-3">
                {activeTab === 'pickup_pace' && (
                  <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                    <Filter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                    <select value={selectedPaceSource} onChange={(e) => setSelectedPaceSource(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider outline-none appearance-none" style={{ color: BRAND_COLORS.primary }} >
                      <option value="ALL">ALL SOURCES</option>
                      {paceSourcesList.map(s => (
                        <option key={s} value={s}>{s.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <Filter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider outline-none appearance-none" style={{ color: BRAND_COLORS.primary }} >
                    <option value="YEAR">FULL YEAR</option>
                    <option value="YTD">YTD VIEW</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>
                <div className="flex items-center p-1.5 rounded-none border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-khand uppercase tracking-wider outline-none appearance-none" style={{ color: BRAND_COLORS.primary }} >
                    {parsedData.years.length > 0 ? (
                      parsedData.years.map(y => <option key={y} value={y}>{y}</option>)
                    ) : (
                      <option value="2026">2026</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 border-t pt-4" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
              <div>
                <h1 className="text-3xl sm:text-4xl font-khand font-bold uppercase tracking-wide leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                  METRIC SOURCES | {parsedData.propertyName}
                </h1>
              </div>
              <div className="text-xl sm:text-2xl font-khand font-bold uppercase tracking-wider opacity-60 pt-[2px]" style={{ color: BRAND_COLORS.primary }}>
                {parsedData.rooms} ROOMS
              </div>
            </div>

            <div className="flex border-[2px] p-1 bg-white self-start" style={{ borderColor: BRAND_COLORS.primary }}>
              {[
                { key: 'overview', label: 'OVERVIEW' },
                { key: 'pickup_pace', label: 'PICKUP & PACE' },
                { key: 'stay_profiles', label: 'STAY PROFILES' },
              ].map((tab) => (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveTab(tab.key)} 
                  className={`px-5 pt-[10px] pb-2 text-sm font-khand font-bold uppercase tracking-wider transition-all ${ 
                    activeTab === tab.key ? '' : 'text-slate-500 hover-text-dynamic' 
                  }`} 
                  style={ 
                    activeTab === tab.key 
                    ? { backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder } 
                    : { '--hover-color': BRAND_COLORS.primary } 
                  } 
                > 
                  {tab.label} 
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-8 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          
          {activeTab === 'overview' && (
            <div className="space-y-3 animate-in fade-in duration-500 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                <KPICard label="REVENUE" value={formatCompactUSD(kpiStats.totalRev)} diff={formatCompact(kpiStats.totalRev - kpiStats.stlyRev)} isNeg={kpiStats.totalRev < kpiStats.stlyRev} bgColor={BRAND_COLORS.primary} textColor={BRAND_COLORS.powder} labelColor={`${BRAND_COLORS.powder}B3`} />
                <KPICard label="ROOMS SOLD" value={formatNumber(kpiStats.totalNights)} diff={formatNumber(Math.abs(kpiStats.totalNights - kpiStats.stlyNights))} isNeg={kpiStats.totalNights - kpiStats.stlyNights < 0} bgColor={BRAND_COLORS.teal} textColor={BRAND_COLORS.frost} labelColor={`${BRAND_COLORS.frost}B3`} />
                <KPICard label="AVG RATE" value={formatPreciseCurrency(kpiStats.avgADR)} diff={`($${Math.abs(kpiStats.avgADR - kpiStats.stlyADR).toFixed(2)})`} isNeg={kpiStats.avgADR - kpiStats.stlyADR < 0} bgColor={BRAND_COLORS.cyan} textColor={BRAND_COLORS.yellow} labelColor={`${BRAND_COLORS.yellow}B3`} />
                <KPICard label="RESERVATIONS" value={formatNumber(kpiStats.totalRes)} diff={formatNumber(Math.abs(kpiStats.totalRes - kpiStats.stlyRes))} isNeg={kpiStats.totalRes - kpiStats.stlyRes < 0} bgColor={BRAND_COLORS.aqua} textColor={BRAND_COLORS.teal} labelColor={`${BRAND_COLORS.teal}B3`} />
              <div className="p-5 flex flex-col justify-center items-center text-center h-44 shadow-md transition-transform hover:scale-[1.02] rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.powder }}>
                <h3 className="text-8xl font-khand font-bold tracking-tight leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}> {Math.round(kpiStats.avgLead || 0)} </h3>
                <p className="text-sm font-roboto font-normal uppercase tracking-wider mt-1 pt-[2px]" style={{ color: BRAND_COLORS.primary }}> LEAD DAYS </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full">
                <div className="lg:col-span-2 border-[3px] shadow-md rounded-none" style={{ backgroundColor: BRAND_COLORS.white, borderColor: BRAND_COLORS.primary }}>
                  <div className="p-6 border-b-[3px] flex justify-between items-center" style={{ borderColor: BRAND_COLORS.primary, backgroundColor: BRAND_COLORS.white }}>
                    <h3 className="font-khand uppercase font-bold tracking-wider text-lg pt-[2px]"> Channels </h3>
                    <div className="text-xs font-khand font-bold uppercase tracking-widest px-3 pt-[6px] pb-1" style={{ backgroundColor: BRAND_COLORS.cyan, color: BRAND_COLORS.yellow }}> {periodLabel} </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-roboto text-[10px] font-normal">
                      <thead className="uppercase tracking-widest border-b-[3px]" style={{ color: `${BRAND_COLORS.primary}99`, backgroundColor: `${BRAND_COLORS.frost}80`, borderColor: `${BRAND_COLORS.primary}1A` }}>
                        <tr>
                          <th className="px-6 py-4 pt-[18px] pb-[14px]">Distribution Channel</th>
                          <th className="px-6 py-4 pt-[18px] pb-[14px]">Revenue</th>
                          <th className="px-6 py-4 pt-[18px] pb-[14px]">Contribution</th>
                          <th className="px-6 py-4 pt-[18px] pb-[14px]">Nights</th>
                          <th className="px-6 py-4 pt-[18px] pb-[14px]">ADR</th>
                          <th className="px-6 py-4 pt-[18px] pb-[14px] text-right">ALOS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-roboto text-[10px] font-normal" style={{ borderTop: `1px solid ${BRAND_COLORS.primary}1A`, divideColor: `${BRAND_COLORS.primary}1A` }}>
                        {performanceByChannel.map((m, idx) => (
                          <tr key={idx} className="transition-colors group hover-bg-dynamic font-normal" style={{ '--hover-bg-color': `${BRAND_COLORS.primary}0D` }}>
                            <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.primary }}>{m.name}</td>
                            <td className="px-6 py-4 font-medium">{formatCurrency(m.value)}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center p-2 rounded-none text-xs font-bold" style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder }}> {`${(m.mix * 100).toFixed(1)}%`} </span>
                            </td> 
                            <td className="px-6 py-4" style={{ color: `${BRAND_COLORS.primary}CC` }}>{formatNumber(m.nights)}</td>
                            <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.cyan }}>{formatPreciseCurrency(m.adr)}</td>
                            <td className="px-6 py-4 text-right" style={{ color: `${BRAND_COLORS.primary}99` }}>{(m.alos || 0).toFixed(1)}d</td>
                          </tr>
                        ))}
                        {performanceByChannel.length === 0 && (
                          <tr> <td colSpan="6" className="text-center py-12 text-xs font-khand uppercase tracking-widest pt-[2px]" style={{ color: `${BRAND_COLORS.primary}66` }}> No channel entries found matching selection </td> </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="p-8 flex flex-col h-full border-[3px] shadow-md rounded-none" style={{ backgroundColor: BRAND_COLORS.white, borderColor: BRAND_COLORS.primary }}>
                  <h3 className="font-khand uppercase font-bold tracking-widest text-lg mb-8 pt-[2px]" style={{ color: BRAND_COLORS.primary }}> % of Room Nights Mix </h3>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {performanceByChannel.length > 0 ? (
                      <DonutChart data={performanceByChannel.map(d => ({ name: d.name, value: d.nights, revenue: d.value, adr: d.adr }))} colors={[BRAND_COLORS.purple, BRAND_COLORS.red, BRAND_COLORS.orange, BRAND_COLORS.yellow, BRAND_COLORS.powder]} />
                    ) : (
                      <div className="text-center py-12 text-slate-400 font-khand uppercase text-xs pt-[2px]"> Chart unavailable </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pickup_pace' && (
            <div className="space-y-3 animate-in w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.primary }}>
                  <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: `${BRAND_COLORS.powder}B3` }}> Pace Variance </span>
                  <div className="flex flex-col gap-0.5 -mt-6">
                    <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: BRAND_COLORS.powder }}>
                      {paceTotals.paceVar >= 0 ? `+$${formatCompact(paceTotals.paceVar)}` : `-$${formatCompact(Math.abs(paceTotals.paceVar))}`}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ChangeIndicator isNeg={paceTotals.paceVar < 0} textColor={BRAND_COLORS.powder} bgColor={BRAND_COLORS.primary} />
                      <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: BRAND_COLORS.powder }}> {paceTotals.paceVarPct.toFixed(1)}% YOY </span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.teal }}>
                  <span className="text-lg font-khand font-bold uppercase tracking-wide pt-[2px]" style={{ color: `${BRAND_COLORS.frost}B3` }}> ADR CHG </span>
                  <div className="flex flex-col gap-0.5 -mt-6">
                    <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none text-white pt-[2px]">
                      {kpiStats.avgADR - kpiStats.stlyADR >= 0 ? `+$${(kpiStats.avgADR - kpiStats.stlyADR).toFixed(2)}` : `-$${Math.abs(kpiStats.avgADR - kpiStats.stlyADR).toFixed(2)}`}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ChangeIndicator isNeg={kpiStats.avgADR - kpiStats.stlyADR < 0} textColor={BRAND_COLORS.frost} bgColor={BRAND_COLORS.teal} />
                      <span className="text-sm font-roboto font-medium tracking-normal text-white">
                        {kpiStats.stlyADR > 0 ? `${(((kpiStats.avgADR - kpiStats.stlyADR) / kpiStats.stlyADR) * 100).toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.cyan }}>
                  <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: `${BRAND_COLORS.yellow}B3` }}> OTB Revenue </span>
                  <div className="flex flex-col gap-0.5 -mt-6">
                    <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: BRAND_COLORS.yellow }}> ${formatCompact(paceTotals.totalTY || kpiStats.totalRev)} </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ChangeIndicator isNeg={paceTotals.paceVar < 0} textColor={BRAND_COLORS.yellow} bgColor={BRAND_COLORS.cyan} />
                      <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: BRAND_COLORS.yellow }}> (${formatCompact(Math.abs(paceTotals.paceVar))}) </span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-between h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.aqua }}>
                  <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: `${BRAND_COLORS.teal}B3` }}> Avg LOS </span>
                  <div className="flex flex-col gap-0.5 -mt-6">
                    <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: BRAND_COLORS.teal }}> {(kpiStats.avgALOS || 0).toFixed(1)} </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ChangeIndicator isNeg={kpiStats.avgALOS - kpiStats.stlyALOS < 0} textColor={BRAND_COLORS.teal} bgColor={BRAND_COLORS.aqua} />
                      <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: BRAND_COLORS.teal }}> {Math.abs(kpiStats.avgALOS - kpiStats.stlyALOS).toFixed(1)} Nights </span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-center items-center text-center h-44 rounded-none shadow-md" style={{ backgroundColor: BRAND_COLORS.powder }}>
                  <h3 className="text-8xl font-khand font-bold tracking-tight leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}> {Math.round(kpiStats.avgLead || 0)} </h3>
                  <p className="text-sm font-roboto font-normal uppercase tracking-wider mt-1 pt-[2px]" style={{ color: BRAND_COLORS.primary }}> LEAD DAYS </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-white p-8 border-[3px] rounded-none shadow-md" style={{ borderColor: BRAND_COLORS.primary }}>
                  <h3 className="font-khand uppercase font-bold tracking-wider text-xl mb-4 pt-[2px]"> Revenue OTB Pace ({selectedYear || '2026'} vs. {selectedYear ? Number(selectedYear) - 1 : '2025'}){selectedPaceSource !== 'ALL' ? ` - ${selectedPaceSource}` : ''} </h3>
                  {filteredPaceRows.length > 0 ? ( <PaceComparisonChart data={filteredPaceRows} selectedYear={selectedYear} roomsConfig={parsedData.rooms} /> ) : ( <div className="text-center py-12 text-slate-400 font-khand uppercase text-xs pt-[2px]">No Pace Data Found</div> )}
                </div>
                <div className="bg-white p-8 border-[3px] rounded-none shadow-md" style={{ borderColor: BRAND_COLORS.primary }}>
                  <h3 className="font-khand uppercase font-bold tracking-wider text-xl mb-4 pt-[2px]"> Booking Window Pickup Velocity </h3>
                  <PickupPatternChart 
                    pickupData={filteredPickupData}
                    fallbackLeadDays={sourceKpiStats.lead} 
                    fallbackAvgADR={sourceKpiStats.avgADR} 
                    fallbackTotalNights={sourceKpiStats.totalNights} 
                  />
                </div>
              </div>

              <div className="bg-white border-[3px] rounded-none overflow-hidden shadow-md" style={{ borderColor: BRAND_COLORS.primary }}>
                <div className="p-6 border-b-[3px] bg-white flex justify-between items-center" style={{ borderColor: BRAND_COLORS.primary }}>
                  <h3 className="font-khand uppercase font-bold tracking-wider text-lg pt-[2px]"> Monthly Breakdown </h3>
                  <span className="text-xs font-khand font-bold uppercase tracking-widest px-3 pt-[6px] pb-1" style={{ backgroundColor: BRAND_COLORS.cyan, color: BRAND_COLORS.yellow }}> {periodLabel} CALENDAR PACING </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-roboto text-[10px] font-normal">
                    <thead className="uppercase tracking-widest border-b-[2px]" style={{ color: `${BRAND_COLORS.primary}99`, backgroundColor: `${BRAND_COLORS.frost}80`, borderColor: `${BRAND_COLORS.primary}1A` }}>
                      <tr className="border-b border-slate-100">
                        <th rowSpan="2" className="px-6 pb-3 pt-4 border-r border-slate-100 align-bottom text-center font-bold">STAY MONTH</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{selectedYear}</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{Number(selectedYear)-1}</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">CHG</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{selectedYear}</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{Number(selectedYear)-1}</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">CHG</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{selectedYear}</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{Number(selectedYear)-1}</th>
                        <th colSpan="2" className="px-4 pb-1 pt-4 text-right align-bottom border-x border-slate-100/50 font-bold">CHG</th>
                        <th className="px-4 pt-4 text-right align-bottom font-bold">{selectedYear}</th>
                      </tr>
                      <tr>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">OTB RMS</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">OTB RMS</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">RMS CHG</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">OTB ADR</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">OTB ADR</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">ADR CHG</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">OTB REV</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">STLY REV</th>
                        <th className="px-4  pb-3 text-right align-bottom border-l border-slate-100/50 font-bold">ABS CHG</th>
                        <th className="px-4  pb-3 text-right align-bottom font-bold">% VAR</th>
                        <th className="px-4  pb-3 text-right align-bottom border-l border-slate-100/50 font-bold">MIX %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-roboto text-[10px] font-normal" style={{ divideColor: `${BRAND_COLORS.primary}1A` }}>
                      {filteredPaceRows.map((m, idx) => {
                        const absoluteVar = (m.ty === 0 && m.stly === 0) ? null : m.ty - m.stly;
                        const pctVar = m.stly > 0 && absoluteVar !== null ? (absoluteVar / m.stly) * 100 : (m.stly === 0 && m.ty > 0 ? 100 : null);
                        const tyAdr = m.tyNights > 0 ? m.ty / m.tyNights : 0;
                        const stlyAdr = m.stlyNights > 0 ? m.stly / m.stlyNights : 0;
                        const adrVar = (m.ty === 0 && m.stly === 0) ? null : tyAdr - stlyAdr;
                        const roomsVar = (m.tyNights === 0 && m.stlyNights === 0) ? null : m.tyNights - m.stlyNights;
                        const totalOccupied = paceMonthTotals[m.month] || 0;
                        const mix = totalOccupied > 0 ? (m.tyNights / totalOccupied) * 100 : 0;
                        return (
                          <tr key={idx} className="transition-colors hover-bg-dynamic" style={{ '--hover-bg-color': `${BRAND_COLORS.primary}0D` }}>
                            <td className="px-6 py-4 text-center align-middle border-r border-slate-100 font-bold" style={{ color: BRAND_COLORS.primary }}>{m.month}</td>
                            <td className="px-4 py-4 text-right align-bottom">{formatNumber(m.tyNights)}</td>
                            <td className="px-4 py-4 text-right align-bottom text-slate-500">{formatNumber(m.stlyNights)}</td>
                            <td className="px-4 py-4 text-right align-bottom font-bold" style={{ color: roomsVar >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{roomsVar !== null ? (roomsVar >= 0 ? `+${formatNumber(roomsVar)}` : `(${formatNumber(Math.abs(roomsVar))})`) : ""}</td>
                            <td className="px-4 py-4 text-right align-bottom">{formatPreciseCurrency(tyAdr)}</td>
                            <td className="px-4 py-4 text-right align-bottom text-slate-500">{formatPreciseCurrency(stlyAdr)}</td>
                            <td className="px-4 py-4 text-right align-bottom font-bold" style={{ color: adrVar >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{adrVar !== null ? (adrVar >= 0 ? `+${formatPreciseCurrency(adrVar)}` : `(${formatPreciseCurrency(Math.abs(adrVar))})`) : ""}</td>
                            <td className="px-4 py-4 text-right align-bottom font-medium">{formatCurrency(m.ty)}</td>
                            <td className="px-4 py-4 text-right align-bottom text-slate-500">{formatCurrency(m.stly)}</td>
                            <td className="px-4 py-4 text-right align-bottom font-bold border-l border-slate-100/50" style={{ color: absoluteVar >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{absoluteVar !== null ? (absoluteVar >= 0 ? `+${formatCurrency(absoluteVar)}` : `(${formatCurrency(Math.abs(absoluteVar))})`) : ""}</td>
                            <td className="px-4 py-4 text-right align-bottom font-bold" style={{ color: pctVar >= 0 ? BRAND_COLORS.cyan : BRAND_COLORS.red }}>{pctVar !== null ? (pctVar >= 0 ? `+${pctVar.toFixed(1)}%` : `(${Math.abs(pctVar).toFixed(1)}%)`) : ""}</td>
                            <td className="px-4 py-4 text-right align-bottom font-bold border-l border-slate-100/50" style={{ color: BRAND_COLORS.primary }}>{mix.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      {filteredPaceRows.length === 0 && ( <tr> <td colSpan="12" className="text-center py-12 text-xs font-khand uppercase tracking-widest text-slate-400 pt-[2px]"> No pacing entries found </td> </tr> )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stay_profiles' && (
            <div className="space-y-3 animate-in fade-in duration-500 w-full">
              <div className="bg-white p-6 border-[3px] rounded-none flex justify-between items-center flex-wrap gap-4 w-full shadow-md" style={{ borderColor: BRAND_COLORS.primary }}>
                <div>
                  <h3 className="font-khand uppercase font-bold tracking-wider text-xl pt-[2px]" style={{ color: BRAND_COLORS.primary }}> SOURCE METRIC </h3>
                  <p className="font-roboto font-normal text-xs text-slate-500 mt-0.5"> Distributions update dynamically based on selected metric parameters. </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex border-[2px] p-1 bg-white" style={{ borderColor: BRAND_COLORS.primary }}>
                    {['CHANNEL', 'SOURCE', 'SUBSOURCE'].map((type) => (
                      <button key={type} onClick={() => { setProfileMetricType(type); setSelectedChannelProfile('ALL'); }} className={`px-4 pt-[8px] pb-1.5 text-xs font-khand font-bold uppercase tracking-wider transition-all ${ profileMetricType === type ? '' : 'text-slate-500 hover-text-dynamic' }`} style={ profileMetricType === type ? { backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder } : { '--hover-color': BRAND_COLORS.primary } } > {type === 'SUBSOURCE' ? 'SUB SOURCE' : type} </button>
                    ))}
                  </div>
                  <div className="relative">
                    <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="border-[2px] bg-white px-4 pt-[10px] pb-2 font-khand font-bold text-sm flex items-center justify-between gap-2 w-[260px] sm:w-[280px]" style={{ borderColor: BRAND_COLORS.primary, color: BRAND_COLORS.primary }} >
                      <span className="pt-[2px] truncate">{profileMetricType}: {selectedChannelProfile}</span>
                      <ChevronDown size={16} className="shrink-0" />
                    </button>
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-white border-[2px] shadow-xl z-50 w-full max-h-48 overflow-y-auto" style={{ borderColor: BRAND_COLORS.primary }}>
                        <div onClick={() => { setSelectedChannelProfile('ALL'); setIsProfileDropdownOpen(false); }} className="px-4 py-2 hover:bg-[#EFF5F6] cursor-pointer text-xs font-khand font-bold uppercase pt-[2px]" style={{ color: BRAND_COLORS.primary }} > ALL {profileMetricType === 'SUBSOURCE' ? 'SUB SOURCES' : `${profileMetricType}S`} </div>
                        {currentMetricOptions.map(m => (
                          <div key={m} onClick={() => { setSelectedChannelProfile(m); setIsProfileDropdownOpen(false); }} className="px-4 py-2 hover:bg-[#EFF5F6] cursor-pointer text-xs font-khand font-bold uppercase pt-[2px] truncate" style={{ color: BRAND_COLORS.primary }} > {m} </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border-[3px] p-10 md:p-14 rounded-none shadow-md space-y-12 relative" style={{ borderColor: BRAND_COLORS.primary }}>
                {!stayProfilesMetrics.hasData && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-khand font-bold uppercase p-3 tracking-wider"> No stay records found for {selectedChannelProfile} during {periodLabel}. Defaulting to aggregate baseline patterns. </div>
                )}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-10">
                  <div className="lg:max-w-xs w-full shrink-0">
                    <h4 className="font-khand uppercase font-bold text-xl tracking-wider leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}> LENGTH OF STAY </h4>
                  </div>
                  <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {[
                      { label: "1 NIGHT", style: { backgroundColor: BRAND_COLORS.primary, color: '#b9c3d1' } },
                      { label: "2 NIGHTS", style: { backgroundColor: BRAND_COLORS.teal, color: '#b4d8e0' } },
                      { label: "3 NIGHTS", style: { backgroundColor: BRAND_COLORS.cyan, color: '#b3e4e9' } },
                      { label: "4 NIGHTS", style: { backgroundColor: BRAND_COLORS.aqua, color: BRAND_COLORS.primary } },
                      { label: "5 NIGHTS", style: { backgroundColor: BRAND_COLORS.powder, color: BRAND_COLORS.teal } },
                      { label: "6 NIGHTS", style: { backgroundColor: BRAND_COLORS.frost, border: `2px solid ${BRAND_COLORS.cyan }`, color: BRAND_COLORS.cyan } },
                      { label: "7+ NIGHTS", style: { backgroundColor: BRAND_COLORS.white, border: `2px solid ${BRAND_COLORS.aqua }`, color: BRAND_COLORS.aqua } }
                    ].map((block, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-bold font-khand uppercase mb-1 whitespace-nowrap pt-[2px]" style={{ color: BRAND_COLORS.primary }}> {block.label} </span>
                        <div className="w-full aspect-square flex flex-col justify-center items-center rounded-none shadow-sm transition-transform hover:scale-105" style={block.style} >
                          <span className="text-2xl md:text-3xl font-khand font-bold tracking-normal leading-none pt-[2px]" style={{ color: block.style.color }}> {String(stayProfilesMetrics.stayNights[idx] || 0).padStart(2, '0')}% </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6">
                  <div className="lg:max-w-xs w-full shrink-0">
                    <h4 className="font-khand uppercase font-bold text-xl tracking-wider leading-none pt-[2px]" style={{ color: BRAND_COLORS.primary }}> LEAD DAYS </h4>
                  </div>
                  <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {[
                      { label: "0-3 DAYS", style: { backgroundColor: BRAND_COLORS.yellow, color: '#feefd7' } },
                      { label: "4-6 DAYS", style: { backgroundColor: '#ff914d', color: '#ffdeca' } },
                      { label: "7-14 DAYS", style: { backgroundColor: BRAND_COLORS.orange, color: '#fbd8cd' } },
                      { label: "15-29 DAYS", style: { backgroundColor: BRAND_COLORS.red, color: BRAND_COLORS.yellow } },
                      { label: "30-45 DAYS", style: { backgroundColor: '#cf3b4b', color: '#ff914d' } },
                      { label: "61-90 DAYS", style: { backgroundColor: '#b4126d', color: BRAND_COLORS.orange } },
                      { label: "91+ DAYS", style: { backgroundColor: BRAND_COLORS.purple, color: BRAND_COLORS.red } }
                    ].map((block, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <span className="text-xs sm:text-sm font-bold font-khand uppercase mb-1 whitespace-nowrap pt-[2px]" style={{ color: BRAND_COLORS.primary }}> {block.label} </span>
                        <div className="w-full aspect-square flex flex-col justify-center items-center rounded-none shadow-sm transition-transform hover:scale-105" style={block.style} >
                          <span className="text-2xl md:text-3xl font-khand font-bold tracking-normal leading-none pt-[2px]" style={{ color: block.style.color }}> {String(stayProfilesMetrics.leadTimes[idx] || 0).padStart(2, '0')}% </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full bg-white border-t py-6 mt-auto shadow-inner" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-khand font-bold uppercase tracking-widest gap-4" style={{ color: `${BRAND_COLORS.primary}80` }}>
          <span>METRICS BY REVREBEL</span>
          <span>HOTEL REVENUE MANAGEMENT SYSTEM</span>
        </div>
      </footer>
    </div>
  );
}

const MOCK_DATA = [
  { row: ["property", "rooms", "channel_year", "channel_stay_month", "channel_metric", "channel_revenue", "channel_nights", "channel_adr", "channel_resn", "channel_lead_days", "pace_year", "pace_stay_month", "pace_metric_type", "pace_metric", "pace_ty_revenue", "pace_stly_revenue", "pace_ty_room_nights", "pace_stly_room_nights", "pickup_year", "pickup_stay_month", "pickup_days_out", "pickup_rooms", "pickup_revenue", "pickup_breakout_type", "pickup_breakout"] },
  { row: [] },
  { row: ["THE REBEL PARAGON", 250] }
];

// Generate robust sample data so the dashboard charts populate immediately for the preview
const SAMPLE_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
SAMPLE_MONTHS.forEach((m, idx) => {
  const isPeak = idx > 4 && idx < 8; 
  const mul = isPeak ? 1.5 : 1;
  
  MOCK_DATA.push({ row: ["", "", 2026, m, "Direct", (45000 + idx*2000)*mul, (180 + idx*10)*mul, 250, 80*mul, 25, 2026, m, "SOURCE", "Direct", (45000 + idx*2000)*mul, (42000 + idx*1500)*mul, (180 + idx*10)*mul, (175 + idx*8)*mul, 2026, m, 14, 5*mul, 1250*mul, "SOURCE", "TOTAL"] });
  MOCK_DATA.push({ row: ["", "", 2026, m, "OTA", (65000 - idx*1000)*mul, (280 - idx*5)*mul, 232, 120*mul, 12, 2026, m, "SOURCE", "OTA", (65000 - idx*1000)*mul, (60000 - idx*800)*mul, (280 - idx*5)*mul, (260 - idx*4)*mul, 2026, m, 30, 12*mul, 2800*mul, "SOURCE", "TOTAL"] });
  MOCK_DATA.push({ row: ["", "", 2026, m, "Wholesale", (25000 + idx*500)*mul, (140 + idx*5)*mul, 178, 30*mul, 45, 2026, m, "SOURCE", "Wholesale", (25000 + idx*500)*mul, (28000 + idx*600)*mul, (140 + idx*5)*mul, (150 + idx*6)*mul, 2026, m, 60, 20*mul, 3500*mul, "SOURCE", "TOTAL"] });
  MOCK_DATA.push({ row: ["", "", 2026, m, "Corporate", (35000 + idx*800)*mul, (120 + idx*3)*mul, 291, 50*mul, 21, 2026, m, "SOURCE", "Corporate", (35000 + idx*800)*mul, (30000 + idx*600)*mul, (120 + idx*3)*mul, (110 + idx*4)*mul, 2026, m, 7, 8*mul, 2300*mul, "SOURCE", "TOTAL"] });
});

[90, 75, 60, 45, 30, 21, 14, 7, 3, 0].forEach((d, i) => {
   MOCK_DATA.push({
     row: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", 2026, "JAN", d, 50 + (10-i)*35, 10000 + (10-i)*8500, "SOURCE", "TOTAL"]
   });
});

export default function DashboardPreview() {
  return <App data={MOCK_DATA} />;
}