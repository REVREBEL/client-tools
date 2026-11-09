import React, { useState, useMemo } from 'react';
import { TrendingUp, Filter } from 'lucide-react';

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const BRAND_COLORS = { primary: "#163666", teal: "#047C97", cyan: "#00A6B6", aqua: "#71C9C5", powder: "#B2D3DE", yellow: "#FACA78", orange: "#F37D59", red: "#E05047", purple: "#8E456A", frost: "#EFF5F6", white: "#fafafa" };

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
`;

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Math.round(val || 0));
const formatPreciseCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

function MetricBrief({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold" style={{ color: `${BRAND_COLORS.primary}80` }}>{label}</p>
      <p className="text-2xl font-khand font-bold leading-none">{value}</p>
    </div>
  );
}

function BarChart({ data, xKey, yKey, label, color }) {
  const width = 600;
  const height = 240;
  const maxVal = Math.max(...data.map(d => d[yKey] || 0), 1) * 1.15;

  return (
    <div className="bg-[#fafafa] p-6 border-[3px] w-full" style={{ borderColor: BRAND_COLORS.primary }}>
      <h4 className="font-khand uppercase font-bold mb-4 flex items-center gap-2" style={{ color: BRAND_COLORS.primary }}>
        <TrendingUp size={16} style={{ color: BRAND_COLORS.cyan }} /> {label}
      </h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {data.map((d, i) => {
          const barW = (width - 80) / data.length * 0.7;
          const x = 50 + i * ((width - 80) / data.length);
          const h = (d[yKey] / maxVal) * (height - 60);
          const y = height - 30 - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill={color} />
              <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize="10" className="font-khand font-bold" fill={BRAND_COLORS.primary}>{d[xKey]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MonthlyTrendsTab({ data = [] }) {
  const [selectedYear, setSelectedYear] = useState('2026');

  const monthlyTotals = useMemo(() => {
    if (!data || !data.length) return [];
    const headers = data[0]?.row || [];
    const yrCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_year');
    const mCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_stay_month');
    const revCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_revenue');
    const nightsCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_nights');

    const map = {};
    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (r && String(r[yrCol]) === selectedYear) {
        const m = safeString(r[mCol]).toUpperCase();
        if (MONTH_ORDER.includes(m)) {
          if (!map[m]) map[m] = { month: m, revenue: 0, nights: 0 };
          map[m].revenue += Number(r[revCol]) || 0;
          map[m].nights += Number(r[nightsCol]) || 0;
        }
      }
    });

    return MONTH_ORDER.map(m => {
      const cur = map[m] || { month: m, revenue: 0, nights: 0 };
      return { ...cur, adr: cur.nights > 0 ? cur.revenue / cur.nights : 0 };
    });
  }, [data, selectedYear]);

  const totalRev = useMemo(() => monthlyTotals.reduce((s, d) => s + d.revenue, 0), [monthlyTotals]);

  return (
    <div className="min-h-screen font-roboto pb-12" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style>{fontStyles}</style>

      <header className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-khand font-bold uppercase">MONTHLY TRENDS ANALYSIS</h1>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border p-2 font-khand text-xs font-bold uppercase">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-[#fafafa] border-[3px] p-8 flex justify-between items-center" style={{ borderColor: BRAND_COLORS.primary }}>
          <div className="grid grid-cols-3 gap-8">
            <MetricBrief label="Total Revenue" value={formatCurrency(totalRev)} />
            <MetricBrief label="Total Nights" value={formatNumber(monthlyTotals.reduce((s, d) => s + d.nights, 0))} />
            <MetricBrief label="Avg Rate" value={formatPreciseCurrency(totalRev / (monthlyTotals.reduce((s, d) => s + d.nights, 0) || 1))} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart data={monthlyTotals} xKey="month" yKey="adr" label="Average Daily Rate (ADR) Progression" color={BRAND_COLORS.cyan} />
          <BarChart data={monthlyTotals} xKey="month" yKey="nights" label="Rooms Sold Progression" color={BRAND_COLORS.primary} />
        </div>
      </main>
    </div>
  );
}