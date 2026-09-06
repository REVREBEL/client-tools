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
`;

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatPreciseCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Math.round(val || 0));
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

function KPICard({ label, value, diff, isNeg, bgColor, textColor, labelColor }) {
  return (
    <div className="p-5 flex flex-col justify-between h-44 shadow-md transition-transform hover:scale-[1.02] rounded-none border border-black/5" style={{ backgroundColor: bgColor }}>
      <span className="text-lg font-khand font-bold uppercase tracking-wider pt-[2px]" style={{ color: labelColor }}>{label}</span>
      <div className="flex flex-col gap-0.5 -mt-4">
        <span className="text-4xl md:text-5xl font-khand font-bold uppercase tracking-normal leading-none pt-[2px]" style={{ color: textColor }}>{value}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <ChangeIndicator isNeg={isNeg} textColor={textColor} bgColor={bgColor} />
          <span className="text-sm font-roboto font-medium tracking-normal" style={{ color: textColor }}>{diff}</span>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ data, colors }) {
  const [activeSlice, setActiveSlice] = useState(null);
  const width = 300;
  const height = 300;
  const cx = width / 2;
  const cy = height / 2;
  const rOuter = 130;
  const rInner = 85;

  const total = useMemo(() => data.reduce((acc, d) => acc + (d.value || 0), 0), [data]);

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

      return { ...d, color: colors[i % colors.length], pathData, index: i };
    });
  }, [data, colors, total, activeSlice]);

  const hoveredData = activeSlice !== null ? slices[activeSlice] : null;

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <svg width={width} height={height} className="overflow-visible">
        <g>
          {slices.map((slice) => (
            <path key={slice.index} d={slice.pathData} fill={slice.color} stroke="#fafafa" strokeWidth="3" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={() => setActiveSlice(slice.index)} onMouseLeave={() => setActiveSlice(null)} />
          ))}
        </g>
        <text x={cx} y={cy - 8} textAnchor="middle" className="font-khand font-bold uppercase" style={{ fontSize: '22px', fill: BRAND_COLORS.primary }}>TOTAL</text>
        <text x={cx} y={cy + 22} textAnchor="middle" className="font-khand font-bold" style={{ fontSize: '24px', fill: BRAND_COLORS.cyan }}>{`${formatNumber(total)} RNS`}</text>
      </svg>
      {hoveredData && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 border-[3px] p-4 shadow-xl pointer-events-none rounded-none text-center min-w-[160px] z-20" style={{ borderColor: BRAND_COLORS.primary }}>
          <p className="font-khand font-bold uppercase text-base border-b border-slate-100 pb-1 mb-1.5 leading-tight" style={{ color: BRAND_COLORS.primary }}>{hoveredData.name}</p>
          <p className="font-roboto font-normal text-xs text-slate-500 m-0">Nights: <strong style={{ color: BRAND_COLORS.primary }}>{formatNumber(hoveredData.value)}</strong></p>
          <p className="font-roboto font-normal text-xs text-slate-500 m-0">Revenue: <strong style={{ color: BRAND_COLORS.cyan }}>{formatCurrency(hoveredData.revenue)}</strong></p>
          <p className="font-roboto font-normal text-xs text-slate-500 m-0">ADR: <strong style={{ color: BRAND_COLORS.cyan }}>{formatPreciseCurrency(hoveredData.adr)}</strong></p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs font-roboto font-medium text-slate-600">
            <div className="w-3 h-3 rounded-none" style={{ backgroundColor: colors[i % colors.length] }}></div>
            <span className="uppercase text-[11px] font-bold font-khand pt-[2px]">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewTab({ data = [] }) {
  const [selectedMonth, setSelectedMonth] = useState('YTD');
  const [selectedYear, setSelectedYear] = useState('');

  const parsedData = useMemo(() => {
    const result = { years: [], roomsConfig: 188, propertyName: "REBEL HOTEL", channelRows: [] };
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
      property: findCol("PROPERTY"),
      rooms: findCol("ROOMS"),
      channelYear: findCol("channel_year"),
      channelMonth: findCol("channel_stay_month"),
      channelMetric: findCol("channel_metric"),
      channelMetricCode: findCol("channel_metric_code"),
      channelResn: findCol("channel_no_resn"),
      channelNights: findCol("channel_nights"),
      channelRev: findCol("channel_revenue"),
      channelADR: findCol("channel_adr"),
      channelALOS: findCol("channel_alos"),
      channelLead: findCol("channel_lead_days")
    };

    if (data[2]) {
      if (map.property !== -1) result.propertyName = safeString(data[2].row[map.property]) || result.propertyName;
      if (map.rooms !== -1) result.roomsConfig = Number(data[2].row[map.rooms]) || result.roomsConfig;
    }

    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (!r) return;

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
            lead: Number(r[map.channelLead]) || 0
          });
        }
      }
    });

    const yrSet = new Set(result.channelRows.map(r => String(r.year)));
    result.years = yrSet.size > 0 ? Array.from(yrSet).sort().reverse() : ["2026", "2025"];
    return result;
  }, [data]);

  const { years, roomsConfig, propertyName, channelRows } = parsedData;

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

  const kpiStats = useMemo(() => {
    const yrNum = Number(selectedYear) || (years[0] ? Number(years[0]) : 2026);
    const currentSet = channelOnlyData.filter(d => d.year === yrNum && activeMonthsList.includes(d.month));

    const totalRev = currentSet.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalNights = currentSet.reduce((sum, d) => sum + (d.nights || 0), 0);
    const totalRes = currentSet.reduce((sum, d) => sum + (d.resn || 0), 0);
    const avgADR = totalNights > 0 ? totalRev / totalNights : 0;
    const avgLead = currentSet.length > 0 ? (currentSet.reduce((sum, d) => sum + (d.lead || 0), 0) / currentSet.length) : 15;

    const priorSet = channelOnlyData.filter(d => d.year === yrNum - 1 && activeMonthsList.includes(d.month));
    const stlyRev = priorSet.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const stlyNights = priorSet.reduce((sum, d) => sum + (d.nights || 0), 0);
    const stlyADR = stlyNights > 0 ? stlyRev / stlyNights : 0;
    const stlyRes = priorSet.reduce((sum, d) => sum + (d.resn || 0), 0);

    return { totalRev, stlyRev, totalNights, stlyNights, avgADR, stlyADR, totalRes, stlyRes, avgLead };
  }, [channelOnlyData, selectedYear, activeMonthsList, years]);

  const performanceByChannel = useMemo(() => {
    const yrNum = Number(selectedYear) || (years[0] ? Number(years[0]) : 2026);
    const currentGroup = channelOnlyData.filter(d => d.year === yrNum && activeMonthsList.includes(d.month));
    const totalRevCurrent = currentGroup.reduce((sum, d) => sum + (d.revenue || 0), 0);

    const map = {};
    currentGroup.forEach(d => {
      if (!map[d.channel]) map[d.channel] = { resn: 0, nights: 0, revenue: 0 };
      map[d.channel].resn += d.resn || 0;
      map[d.channel].nights += d.nights || 0;
      map[d.channel].revenue += d.revenue || 0;
    });

    return Object.keys(map).map(channel => {
      const cur = map[channel];
      return {
        name: channel,
        nights: cur.nights,
        value: cur.revenue,
        adr: cur.nights > 0 ? cur.revenue / cur.nights : 0,
        mix: totalRevCurrent > 0 ? cur.revenue / totalRevCurrent : 0,
        alos: cur.resn > 0 ? cur.nights / cur.resn : 0
      };
    }).sort((a, b) => b.value - a.value);
  }, [channelOnlyData, selectedYear, activeMonthsList, years]);

  const scopeTitle = selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth);
  const periodLabel = `${selectedYear || '2026'} ${scopeTitle}`;

  return (
    <div className="min-h-screen font-roboto select-none" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />

      <header className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: `${BRAND_COLORS.aqua}33` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="text-2xl font-khand font-bold tracking-wider" style={{ color: BRAND_COLORS.primary }}>OVERVIEW DASHBOARD</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center p-1.5 border shadow-sm bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <IconFilter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 cursor-pointer font-khand uppercase">
                    <option value="YEAR">FULL YEAR</option>
                    <option value="YTD">YTD VIEW</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>
                <div className="flex items-center p-1.5 border shadow-sm bg-white" style={{ borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent border-none text-xs font-bold py-1 pl-2 pr-8 cursor-pointer font-khand uppercase">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 border-t pt-4" style={{ borderColor: `${BRAND_COLORS.primary}1A` }}>
              <h1 className="text-3xl sm:text-4xl font-khand font-bold uppercase tracking-wide leading-none">{propertyName}</h1>
              <div className="text-xl sm:text-2xl font-khand font-bold uppercase tracking-wider opacity-60">{roomsConfig} ROOMS</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          <KPICard label="REVENUE" value={formatCompactUSD(kpiStats.totalRev)} diff={formatCompact(kpiStats.totalRev - kpiStats.stlyRev)} isNeg={kpiStats.totalRev - kpiStats.stlyRev < 0} bgColor={BRAND_COLORS.primary} textColor={BRAND_COLORS.powder} labelColor={`${BRAND_COLORS.powder}B3`} />
          <KPICard label="ROOMS SOLD" value={formatNumber(kpiStats.totalNights)} diff={formatNumber(Math.abs(kpiStats.totalNights - kpiStats.stlyNights))} isNeg={kpiStats.totalNights - kpiStats.stlyNights < 0} bgColor={BRAND_COLORS.teal} textColor="#FFFFFF" labelColor="#FFFFFFB3" />
          <KPICard label="AVG RATE" value={formatPreciseCurrency(kpiStats.avgADR)} diff={`($${Math.abs(kpiStats.avgADR - kpiStats.stlyADR).toFixed(2)})`} isNeg={kpiStats.avgADR - kpiStats.stlyADR < 0} bgColor={BRAND_COLORS.cyan} textColor={BRAND_COLORS.yellow} labelColor={`${BRAND_COLORS.yellow}B3`} />
          <KPICard label="RESERVATIONS" value={formatNumber(kpiStats.totalRes)} diff={formatNumber(Math.abs(kpiStats.totalRes - kpiStats.stlyRes))} isNeg={kpiStats.totalRes - kpiStats.stlyRes < 0} bgColor={BRAND_COLORS.aqua} textColor={BRAND_COLORS.primary} labelColor={`${BRAND_COLORS.primary}B3`} />
          <div className="p-5 flex flex-col justify-center items-center text-center h-44 shadow-md rounded-none border border-black/5" style={{ backgroundColor: BRAND_COLORS.powder }}>
            <h3 className="text-8xl font-khand font-bold leading-none">{Math.round(kpiStats.avgLead)}</h3>
            <p className="text-sm font-khand font-bold uppercase tracking-wider mt-1">LEAD DAYS</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[3px] border-[3px] shadow-md rounded-none" style={{ backgroundColor: BRAND_COLORS.primary, borderColor: BRAND_COLORS.primary }}>
          <div className="lg:col-span-2 bg-white">
            <div className="p-6 border-b-[3px] flex justify-between items-center" style={{ borderColor: BRAND_COLORS.primary }}>
              <h3 className="font-khand uppercase font-bold tracking-wider text-lg">Segments</h3>
                <div className="text-xs font-bold px-3 pt-[6px] pb-1 uppercase tracking-widest rounded-none font-khand" style={{ backgroundColor: BRAND_COLORS.cyan, color: BRAND_COLORS.yellow }}>{periodLabel}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[11px] font-khand uppercase border-b-[3px]" style={{ backgroundColor: `${BRAND_COLORS.frost}80`, borderColor: `${BRAND_COLORS.primary}1A` }}>
                  <tr>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Revenue</th>
                    <th className="px-6 py-4">Contribution</th>
                    <th className="px-6 py-4">Nights</th>
                    <th className="px-6 py-4">ADR</th>
                    <th className="px-6 py-4 text-right">ALOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-roboto">
                  {performanceByChannel.map((m, idx) => (
                    <tr key={idx} className="hover-bg-dynamic" style={{ '--hover-bg-color': `${BRAND_COLORS.primary}0D` }}>
                      <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.primary }}>{m.name}</td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(m.value)}</td>
                      <td className="px-6 py-4">
                        <span className="p-2 text-xs font-bold" style={{ backgroundColor: BRAND_COLORS.primary, color: BRAND_COLORS.powder }}>{`${(m.mix * 100).toFixed(1)}%`}</span>
                      </td>
                      <td className="px-6 py-4">{formatNumber(m.nights)}</td>
                      <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.cyan }}>{formatPreciseCurrency(m.adr)}</td>
                      <td className="px-6 py-4 text-right">{(m.alos || 0).toFixed(1)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-8 flex flex-col h-full bg-white border-l-[3px]" style={{ borderColor: BRAND_COLORS.primary }}>
            <h3 className="font-khand uppercase font-bold tracking-widest text-lg mb-8">% of Room Nights Mix</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <DonutChart data={performanceByChannel.map(d => ({ name: d.name, value: d.nights, revenue: d.value, adr: d.adr }))} colors={[BRAND_COLORS.purple, BRAND_COLORS.orange, BRAND_COLORS.yellow, BRAND_COLORS.powder, BRAND_COLORS.powder]} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}