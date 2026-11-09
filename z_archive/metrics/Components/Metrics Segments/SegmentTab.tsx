import React, { useState, useMemo } from 'react';
import { Clock } from 'lucide-react';

const BRAND_COLORS = { primary: "#163666", teal: "#047C97", cyan: "#00A6B6", aqua: "#71C9C5", powder: "#B2D3DE", frost: "#EFF5F6" };

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
`;

const safeString = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Math.round(val || 0));
const formatPreciseCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

export default function SegmentAnalysisTab({ data = [] }) {
  const [selectedYear, setSelectedYear] = useState('2026');

  const aggregatedSegments = useMemo(() => {
    if (!data || !data.length) return [];
    const headers = data[0]?.row || [];
    const yrCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_year');
    const metricCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_metric');
    const revCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_revenue');
    const nightsCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_nights');
    const leadCol = headers.findIndex(h => safeString(h).toLowerCase() === 'segment_lead_days');

    const map = {};
    data.forEach((item, idx) => {
      if (idx <= 1) return;
      const r = item.row;
      if (r && String(r[yrCol]) === selectedYear) {
        const metric = safeString(r[metricCol]).toUpperCase();
        if (metric && metric !== 'TOTAL' && metric !== 'COMPLIMENTARY') {
          if (!map[metric]) map[metric] = { metric, revenue: 0, nights: 0, leadSum: 0, count: 0 };
          map[metric].revenue += Number(r[revCol]) || 0;
          map[metric].nights += Number(r[nightsCol]) || 0;
          map[metric].leadSum += Number(r[leadCol]) || 0;
          map[metric].count += 1;
        }
      }
    });

    return Object.values(map).map(s => ({
      ...s,
      adr: s.nights > 0 ? s.revenue / s.nights : 0,
      avgLead: s.count > 0 ? s.leadSum / s.count : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [data, selectedYear]);

  const totalRev = useMemo(() => aggregatedSegments.reduce((s, d) => s + d.revenue, 0), [aggregatedSegments]);

  return (
    <div className="min-h-screen font-roboto pb-12" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style>{fontStyles}</style>

      <header className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-khand font-bold uppercase">SEGMENT ANALYSIS</h1>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border p-2 font-khand text-xs font-bold uppercase">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-[#fafafa] border-[3px] p-8" style={{ borderColor: BRAND_COLORS.primary }}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-khand uppercase font-bold">Detailed Segment Breakdown</h3>
            <div className="px-4 py-2 border bg-white">
              <span className="text-xs uppercase font-bold text-slate-500 mr-2">Total Rev:</span>
              <span className="text-xl font-bold font-khand" style={{ color: BRAND_COLORS.cyan }}>{formatCurrency(totalRev)}</span>
            </div>
          </div>

          <table className="w-full text-left font-roboto">
            <thead className="text-[11px] font-khand uppercase border-b">
              <tr>
                <th className="px-6 py-4">Distribution Segment</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">% Mix</th>
                <th className="px-6 py-4">Total Nights</th>
                <th className="px-6 py-4">ADR</th>
                <th className="px-6 py-4">Lead Window</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedSegments.map((seg, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50 text-sm">
                  <td className="px-6 py-4 font-bold">{seg.metric}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(seg.revenue)}</td>
                  <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.cyan }}>
                    {totalRev > 0 ? ((seg.revenue / totalRev) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-6 py-4">{formatNumber(seg.nights)}</td>
                  <td className="px-6 py-4 font-bold" style={{ color: BRAND_COLORS.cyan }}>{formatPreciseCurrency(seg.adr)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 font-bold uppercase">
                      <Clock size=12 /> {Math.round(seg.avgLead)}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}