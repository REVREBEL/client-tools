import React, { useState, useMemo } from 'react';

const MONTH_ORDER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const BRAND_COLORS = { primary: "#163666", cyan: "#00A6B6", aqua: "#71C9C5", powder: "#B2D3DE", yellow: "#FACA78", orange: "#F37D59", red: "#E05047", purple: "#8E456A", frost: "#EFF5F6", white: "#fafafa" };

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Khand:wght@600;700&family=Roboto:wght@400;500;700&display=swap');
  .font-khand { font-family: 'Khand', sans-serif; }
  .font-roboto { font-family: 'Roboto', sans-serif; }
`;

const formatWholeCompact = (val) => `${Math.round(Math.abs(val) / 1000)}K`;

export default function PerformanceToPlanTab({ data = [] }) {
  const [planMode, setPlanMode] = useState('budget');
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const mockPlanData = useMemo(() => {
    return MONTH_ORDER.map((m, i) => {
      const isPassed = i < 5;
      const targetRev = 500000 + i * 10000;
      const actualRev = isPassed ? targetRev + (i % 2 === 0 ? 25000 : -15000) : 0;
      const otbRev = !isPassed ? targetRev - 30000 : 0;
      return {
        month: m,
        isPassed,
        targetRev,
        actualRev,
        otbRev,
        stlyRev: targetRev - 40000,
        isAbove: isPassed ? actualRev >= targetRev : otbRev >= targetRev,
        varToTarget: isPassed ? (actualRev - targetRev) : (otbRev - targetRev)
      };
    });
  }, []);

  return (
    <div className="min-h-screen font-roboto pb-12" style={{ backgroundColor: BRAND_COLORS.frost, color: BRAND_COLORS.primary }}>
      <style>{fontStyles}</style>

      <header className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-khand font-bold uppercase">PERFORMANCE TO PLAN</h1>
          <select value={planMode} onChange={(e) => setPlanMode(e.target.value)} className="border p-2 font-khand text-xs font-bold uppercase">
            <option value="budget">BUDGET VS OTB</option>
            <option value="forecast">FORECAST VS OTB</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white border-[3px] p-8 shadow-sm overflow-x-auto" style={{ borderColor: BRAND_COLORS.primary }}>
          <svg viewBox="0 0 1000 450" className="w-full h-auto min-w-[800px]">
            {mockPlanData.map((d, idx) => {
              const colW = 55;
              const x = 70 + idx * 75;
              const baseY = 360;
              const hTarget = (d.targetRev / 700000) * 280;
              const hVal = ((d.isPassed ? d.actualRev : d.otbRev) / 700000) * 280;

              const barY = baseY - hVal;
              const color = d.isPassed 
                ? (d.isAbove ? BRAND_COLORS.cyan : BRAND_COLORS.orange) 
                : (d.isAbove ? BRAND_COLORS.primary : BRAND_COLORS.powder);

              return (
                <g key={d.month} onMouseEnter={() => setHoveredMonth(d.month)} onMouseLeave={() => setHoveredMonth(null)} className="cursor-pointer">
                  <rect x={x} y={barY} width={colW} height={hVal} fill={color} stroke={BRAND_COLORS.primary} strokeWidth="1.5" />
                  <text x={x + colW / 2} y={barY - 10} textAnchor="middle" className="font-khand font-bold text-xs" fill={color}>
                    {d.isAbove ? `+$${formatWholeCompact(d.varToTarget)}` : `-$${formatWholeCompact(Math.abs(d.varToTarget))}`}
                  </text>
                  <rect x={x} y={baseY} width={colW} height={24} fill={BRAND_COLORS.frost} stroke={BRAND_COLORS.primary} />
                  <text x={x + colW / 2} y={baseY + 16} textAnchor="middle" className="font-khand font-bold text-sm" fill={BRAND_COLORS.primary}>{d.month}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </main>
    </div>
  );
}