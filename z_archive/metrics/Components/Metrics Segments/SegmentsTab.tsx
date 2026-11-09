import React, { useState, useMemo } from 'react';
import { Clock, Filter, Layers } from 'lucide-react';

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const BRAND_COLORS = {
  primary: "#163666",
  cyan: "#00A6B6",
  frost: "#EFF5F6",
  white: "#fafafa"
};

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Math.round(val || 0));
const formatPreciseCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

export default function SegmentsApp({ data = [] }) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('YEAR');

  const parsedData = useMemo(() => {
    const result = { rows: [], years: ['2026', '2025'], propertyName: "REBEL HOTEL" };
    if (!data || !Array.isArray(data) || data.length === 0) return result;

    const headers = data[0]?.row || [];
    const findCol = (str) => headers.findIndex(h => safeString(h).toLowerCase() === str.toLowerCase());

    const map = {
      property: findCol("PROPERTY"),
      segmentYear: findCol("segment_year") !== -1 ? findCol("segment_year") : findCol("source_year"),
      segmentMonth: findCol("segment_stay_month") !== -1 ? findCol("segment_stay_month") : findCol("source_stay_month"),
      segmentMetric: findCol("segment_metric") !== -1 ? findCol("segment_metric") : findCol("source_metric"),
      segmentNights: findCol("segment_nights") !== -1 ? findCol("segment_nights") : findCol("source_nights"),
      segmentRev: findCol("segment_revenue") !== -1 ? findCol("segment_revenue") : findCol("source_revenue"),
      segmentLead: findCol("segment_lead_days") !== -1 ? findCol("segment_lead_days") : findCol("source_lead_days")
    };

    for (let idx = 1; idx < Math.min(5, data.length); idx++) {
      const row = data[idx]?.row;
      if (row && map.property !== -1 && row[map.property]) {
        result.propertyName = safeString(row[map.property]).toUpperCase();
      }
    }

    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (!r) return;

      if (map.segmentYear !== -1 && r[map.segmentYear]) {
        const yr = Number(r[map.segmentYear]);
        if (!isNaN(yr) && yr > 2000) {
          result.rows.push({
            year: yr,
            month: safeString(r[map.segmentMonth]).toUpperCase(),
            metric: safeString(r[map.segmentMetric]).toUpperCase() || 'TOTAL',
            nights: Number(r[map.segmentNights]) || 0,
            revenue: Number(r[map.segmentRev]) || 0,
            lead: Number(r[map.segmentLead]) || 0
          });
        }
      }
    });

    const yrSet = new Set(result.rows.map(r => String(r.year)));
    if (yrSet.size > 0) result.years = Array.from(yrSet).sort().reverse();

    return result;
  }, [data]);

  const { rows, years, propertyName } = parsedData;

  const activeMonthsList = useMemo(() => {
    if (selectedMonth === 'YEAR') return MONTH_ORDER;
    if (selectedMonth === 'YTD') return ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
    return [selectedMonth];
  }, [selectedMonth]);

  const stats = useMemo(() => {
    const activeData = rows.filter(r => String(r.year) === selectedYear && activeMonthsList.includes(r.month) && r.metric === 'TOTAL');
    return { totalRev: activeData.reduce((acc, d) => acc + d.revenue, 0) };
  }, [rows, selectedYear, activeMonthsList]);

  const aggregatedSegments = useMemo(() => {
    const filtered = rows.filter(r => String(r.year) === selectedYear && r.metric !== 'TOTAL' && r.metric !== 'COMPLIMENTARY' && activeMonthsList.includes(r.month));
    const segmentMap = {};
    
    filtered.forEach(row => {
      const key = row.metric;
      if (!segmentMap[key]) segmentMap[key] = { metric: key, revenue: 0, nights: 0, lead: 0, count: 0 };
      segmentMap[key].revenue += (row.revenue || 0);
      segmentMap[key].nights += (row.nights || 0);
      segmentMap[key].lead += (row.lead || 0);
      segmentMap[key].count += 1;
    });

    return Object.values(segmentMap).map(s => ({
      ...s,
      adr: s.nights > 0 ? s.revenue / s.nights : 0,
      avgLead: s.count > 0 ? s.lead / s.count : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [rows, selectedYear, activeMonthsList]);

  const scopeTitle = selectedMonth === 'YEAR' ? 'FULL YEAR' : (selectedMonth === 'YTD' ? 'YTD' : selectedMonth);

  return (
    <div className="min-h-screen font-roboto pb-12" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-4xl font-bold uppercase tracking-tight" style={{ color: BRAND_COLORS.primary }}>{propertyName} | SEGMENTS</h1>
            <div className="flex items-center gap-3">
                <div className="flex items-center p-1.5 border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <Filter size={14} className="ml-2" style={{ color: BRAND_COLORS.cyan }} />
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer uppercase">
                    <option value="YEAR">FULL YEAR</option><option value="YTD">YTD VIEW</option>
                    {MONTH_ORDER.map(m => <option key={m} value={m}>{m} VIEW</option>)}
                  </select>
                </div>
                <div className="flex items-center p-1.5 border shadow-sm" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 py-1 pl-2 pr-8 cursor-pointer uppercase">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8 animate-in fade-in duration-500">
        <div className="bg-[#fafafa] border-[3px] p-8 shadow-sm rounded-none" style={{ borderColor: BRAND_COLORS.primary }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                <h3 className="text-2xl font-khand uppercase font-bold" style={{ color: BRAND_COLORS.primary }}>Detailed Segment Breakdown</h3>
                <p className="text-xs font-medium" style={{ color: `${BRAND_COLORS.primary}99` }}>Segment metrics for {selectedYear} {scopeTitle}</p>
                </div>
                <div className="px-4 py-3 border rounded-none" style={{ backgroundColor: BRAND_COLORS.frost, borderColor: `${BRAND_COLORS.primary}33` }}>
                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: `${BRAND_COLORS.primary}66` }}>Period Total</p>
                <p className="text-xl font-bold font-khand" style={{ color: BRAND_COLORS.cyan }}>{formatCurrency(stats.totalRev)}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left font-roboto">
                <thead className="text-[11px] font-khand uppercase tracking-widest border-b" style={{ backgroundColor: `${BRAND_COLORS.frost}80`, color: `${BRAND_COLORS.primary}99`, borderColor: `${BRAND_COLORS.primary}1A` }}>
                    <tr>
                    <th className="px-6 py-5">Distribution Segment</th>
                    <th className="px-6 py-5">Revenue</th>
                    <th className="px-6 py-5">% Mix</th>
                    <th className="px-6 py-5">Total Nights</th>
                    <th className="px-6 py-5">ADR</th>
                    <th className="px-6 py-5">Lead Window</th>
                    </tr>
                </thead>
                <tbody>
                    {aggregatedSegments.map((seg, idx) => (
                    <tr key={idx} className="transition-colors hover-bg-dynamic border-b" style={{'--hover-bg-color': `${BRAND_COLORS.primary}0D`, borderColor: `${BRAND_COLORS.primary}1A`}}>
                        <td className="px-6 py-5 font-bold text-sm" style={{ color: BRAND_COLORS.primary }}>{seg.metric}</td>
                        <td className="px-6 py-5 text-sm font-bold">{formatCurrency(seg.revenue)}</td>
                        <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-2 border border-black/5 overflow-hidden rounded-none" style={{ backgroundColor: BRAND_COLORS.frost }}>
                            <div className="h-full transition-all duration-1000 rounded-none" style={{ width: `${stats.totalRev > 0 ? (seg.revenue / stats.totalRev) * 100 : 0}%`, backgroundColor: BRAND_COLORS.cyan }} />
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: BRAND_COLORS.cyan }}>{stats.totalRev > 0 ? ((seg.revenue / stats.totalRev) * 100).toFixed(1) : 0}%</span>
                        </div>
                        </td>
                        <td className="px-6 py-5 text-sm" style={{ color: `${BRAND_COLORS.primary}B3` }}>{formatNumber(seg.nights)}</td>
                        <td className="px-6 py-5 text-sm font-bold" style={{ color: BRAND_COLORS.cyan }}>{formatPreciseCurrency(seg.adr)}</td>
                        <td className="px-6 py-5 text-sm">
                        <div className="flex items-center gap-1.5 text-xs px-3 py-1 w-fit font-bold uppercase tracking-wider rounded-none" style={{ backgroundColor: BRAND_COLORS.frost, color: `${BRAND_COLORS.primary}99` }}>
                            <Clock size={12} /> {Math.round(seg.avgLead)}d
                        </div>
                        </td>
                    </tr>
                    ))}
                    {aggregatedSegments.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-12 text-sm" style={{color: `${BRAND_COLORS.primary}66`}}>No segment data found for this selection.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
}